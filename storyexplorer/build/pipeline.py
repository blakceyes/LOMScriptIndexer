from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .. import vocab
from ..analysis_cache import analyze_all
from ..calendar import ROUNDS_PER_MONTH, ROUNDS_PER_YEAR, date_of
from ..console import Reporter
from ..emit import (
    assets_payload,
    prune,
    text_payload,
    write_checkpoint_shards,
    write_graph,
    write_text,
    write_text_shard,
    write_wordcount,
)
from ..game.assets import AssetSession
from ..game.entries import summarize as summarize_probe
from ..game.info import read_game_info
from ..game.layout import discover, game_root, install_dir, steamapps_dir
from ..game.reading import count_reasons
from ..jsonio import dump_json, read_json
from ..languages import DERIVED_LANGS, TEXT_SOURCE_LANG
from ..model import Edge, Facets, GameInfo, ScriptAnalysis
from ..paths import (
    BATTLES_PATH,
    CHECKPOINTS_PATH,
    ENTRIES_PATH,
    LOCALE_DIR,
    LORE_PATH,
    LUA_DIR,
    MANIFEST_PATH,
    REPORT_PATH,
    STATS_PATH,
    WEB_DATA_DIR,
)
from ..versions import (
    BATTLE_VERSION,
    CHECKPOINT_SHARDS,
    CHECKPOINT_VERSION,
    ENTRY_VERSION,
    LORE_VERSION,
    SCHEMA_VERSION,
    STAT_VERSION,
)
from . import checkpoint_wire as checkpoint_models
from . import labels, load_sources
from .battle_cards import BattleCards, collect_battle_facets
from .chapters import build_chapters, chapter_id, classify
from .facets import collect_facets, merge
from .graph import (
    CollectedEdges,
    assemble_nodes,
    build_system_entries,
    collect_edges,
    expand_positions,
)
from .story_render import Renderer
from .wordcount import KINDS, WordCounter, add_row, totals, zero_row
from .report import compose, fmt_bytes, write_report
from .sharding import assign_checkpoints, pack_stories


STAGE_ANALYSIS = "semantic analysis"
STAGE_GRAPH = "graph"
STAGE_RENDER = "render"
STAGE_OUTPUT = "output"

BUILD_STAGES = (STAGE_ANALYSIS, STAGE_GRAPH, STAGE_RENDER, STAGE_OUTPUT)


@dataclass
class BuildResult:
    ok: bool
    scripts: int
    edges: int
    chapters: int
    languages: dict[str, Any]
    report_path: Path


@dataclass
class LanguageRender:
    lang: str
    stories: dict[str, list]
    rows: dict[str, list[list[int]]]
    chapters: dict[str, list[list[int]]]
    characters: dict[str, str]
    titles: dict[str, str]
    edge_labels: dict[str, str]
    metrics: dict[str, Any]
    missing: list[str]
    seconds: float


def _load_sources(reporter: Reporter) -> dict[str, str]:
    if not LUA_DIR.is_dir():
        reporter.error("data/lua not found, run extract.py first")
        return {}
    sources = load_sources()
    if not sources:
        reporter.error("data/lua is empty, run extract.py first")
    return sources


def _load_locale(lang: str, reporter: Reporter) -> dict | None:
    payload = read_json(LOCALE_DIR / f"{lang}.json")
    if not isinstance(payload, dict):
        reporter.error(f"missing or invalid locale table for {lang}, run extract.py first")
        return None
    return payload


def _load_lore(reporter: Reporter) -> dict[str, str]:
    payload = read_json(LORE_PATH)
    if not isinstance(payload, dict):
        reporter.warn("data/lore.json missing; lore entries fall back to LegendInfo only")
        return {}
    if payload.get("version") != LORE_VERSION:
        reporter.warn(
            f"data/lore.json version {payload.get('version')} does not match {LORE_VERSION};"
            " rerun extract.py"
        )
        return {}
    items = payload.get("items")
    if not isinstance(items, dict):
        return {}
    return {
        key: value for key, value in items.items()
        if isinstance(key, str) and isinstance(value, str) and value
    }


def _load_battles(reporter: Reporter) -> dict[str, Any]:
    payload = read_json(BATTLES_PATH)
    if not isinstance(payload, dict):
        reporter.warn("data/battles.json missing; battle switches fall back to scene lines")
        return {}
    if payload.get("version") != BATTLE_VERSION:
        reporter.warn(
            f"data/battles.json version {payload.get('version')} does not match"
            f" {BATTLE_VERSION}; rerun extract.py"
        )
        return {}
    items = payload.get("items")
    if not isinstance(items, dict):
        return {}
    reporter.info(f"battle levels: {len(items)} levels loaded")
    return items


def _load_stats(reporter: Reporter) -> dict[str, str]:
    payload = read_json(STATS_PATH)
    if not isinstance(payload, dict):
        reporter.warn("data/stats.json missing; stat names fall back to the locale table")
        return {}
    if payload.get("version") != STAT_VERSION:
        reporter.warn(
            f"data/stats.json version {payload.get('version')} does not match {STAT_VERSION};"
            " rerun extract.py"
        )
        return {}
    items = payload.get("items")
    if not isinstance(items, dict):
        return {}
    notes: dict[str, str] = {}
    for key, entry in items.items():
        if not isinstance(key, str) or not isinstance(entry, dict):
            continue
        note = entry.get("note")
        if isinstance(note, str) and note.strip():
            notes[key] = note.strip()
    reporter.info(f"stat names: {len(notes)} notes from {len(items)} assets")
    return notes


def render_language(lang: str, locale: dict, node_ids: list[str],
                    models: dict[str, ScriptAnalysis], chapter_of_id: dict[str, str],
                    chapters, facets: dict[str, Facets], edges: list[Edge],
                    lore: dict[str, str] | None, used: labels.NameTables,
                    stats: dict[str, str] | None = None,
                    battles: BattleCards | None = None) -> LanguageRender:
    started = time.time()
    renderer = Renderer(locale, lore_fallback=lore, used=used, stat_notes=stats,
                        battles=battles)
    stories: dict[str, list] = {}
    rows: dict[str, list[list[int]]] = {}
    for sid in node_ids:
        counter = WordCounter()
        renderer.counter = counter
        beats = renderer.render(models[sid].beats)
        if beats:
            stories[sid] = beats
        rows[sid] = counter.row()

    chapter_totals = {chapter.id: zero_row() for chapter in chapters}
    for sid in node_ids:
        chapter_key = chapter_of_id[sid]
        if chapter_key in chapter_totals:
            add_row(chapter_totals[chapter_key], rows[sid])

    edge_labels: dict[str, str] = {}
    for index, edge in enumerate(edges):
        if not edge.label:
            continue
        label = renderer.edge_label(edge.label)
        if label:
            edge_labels[str(index)] = label

    metrics = {
        "options": renderer.option_count,
        "locked": renderer.locked_count,
        "rich": renderer.rich_count,
        "think": renderer.think_count,
        "think_named": renderer.think_named_count,
        "lore": renderer.lore_count,
        "lore_fallback": renderer.lore_fallback_count,
        "lore_missing": renderer.lore_missing_count,
        "lore_missing_samples": renderer.lore_missing[:40],
        "missing": renderer.missing_count,
        "battles": renderer.battle_count,
        "battle_missing": renderer.battle_missing,
    }
    return LanguageRender(
        lang=lang,
        stories=stories,
        rows=rows,
        chapters=chapter_totals,
        characters=renderer.character_table(),
        titles=renderer.title_table(),
        edge_labels=edge_labels,
        metrics=metrics,
        missing=renderer.missing,
        seconds=round(time.time() - started, 1),
    )


def _write_language(render: LanguageRender, names: dict[str, dict[str, str]],
                    shard_of: dict[str, str], shards: list[dict],
                    ) -> tuple[list[tuple[str, int]], dict[str, Any]]:
    lang = render.lang
    parts: list[tuple[str, int]] = []
    shard_keys = [shard["key"] for shard in shards]
    payload = text_payload(
        lang=lang,
        characters=render.characters,
        titles=render.titles,
        names=names,
        edge_labels=render.edge_labels,
        stories={},
        shard_keys=shard_keys,
        missing=render.metrics["missing"],
        missing_keys=render.missing[:200],
    )
    head_size = write_text(WEB_DATA_DIR / f"text-{lang}-head.js", lang, payload)
    parts.append((f"text-{lang}-head.js", head_size))
    buckets: dict[str, dict[str, list]] = {key: {} for key in shard_keys}
    for sid in render.stories:
        key = shard_of.get(sid)
        if key in buckets:
            buckets[key][sid] = render.stories[sid]
    shard_bytes = 0
    for shard in shards:
        written = write_text_shard(
            WEB_DATA_DIR / f"text-{lang}-{shard['key']}.js", lang, buckets[shard["key"]])
        parts.append((f"text-{lang}-{shard['key']}.js", written))
        shard_bytes += written

    report = {
        "stories": len(render.stories),
        "characters": len(render.characters),
        "titles": len(render.titles),
        "options": render.metrics["options"],
        "locked_options": render.metrics["locked"],
        "rich_text": render.metrics["rich"],
        "think": render.metrics["think"],
        "think_named": render.metrics["think_named"],
        "lore": render.metrics["lore"],
        "lore_fallback": render.metrics["lore_fallback"],
        "lore_missing": render.metrics["lore_missing"],
        "lore_missing_samples": render.metrics["lore_missing_samples"],
        "edge_labels": len(render.edge_labels),
        "missing_keys": render.metrics["missing"],
        "missing_samples": render.missing[:40],
        "head_bytes": head_size,
        "shard_count": len(shards),
        "shard_bytes": shard_bytes,
        "seconds": render.seconds,
    }
    return parts, report


def _game_info(manifest: dict[str, Any]) -> GameInfo:
    root = game_root()
    if root is None:
        raw = manifest.get("game")
        if isinstance(raw, str) and raw.strip():
            root = Path(raw)
    layout = discover(root)
    if layout is None:
        return GameInfo()
    session = AssetSession(layout, None)
    try:
        return read_game_info(session, steamapps_dir(layout.root), install_dir(layout.root))
    finally:
        session.close()


def _gap_report(blob: dict[str, Any]) -> dict[str, Any]:
    gaps = [gap for gap in (blob.get("gaps") or []) if isinstance(gap, dict)]
    return {"total": len(gaps), "by_reason": count_reasons(gaps)}


def _time_label(rounds: float) -> str:
    year, month, stage = date_of(rounds)
    return f"Y{year}-M{month}-P{stage}"


def _report_graph(reporter: Reporter, edges: list[Edge],
                  position_edges: list[Edge], dynamic: list[str],
                  scene_total: int, chapters: list[Any], times: dict[str, int],
                  system: Any, position_stats: dict[str, int],
                  probe: dict[str, Any]) -> None:
    reporter.stage(STAGE_GRAPH)
    reporter.info(
        f"{len(edges)} edges ({len(position_edges)} position),"
        f" {len(dynamic)} dynamic jumps"
    )
    reporter.info(f"{scene_total} scene switches")
    reporter.info(f"{len(chapters)} chapters; {len(times)} scripts with a fixed date")
    if times:
        reporter.info(
            f"time range: {_time_label(min(times.values()))} -> {_time_label(max(times.values()))}")
    reporter.info(
        f"system entries: {len(system.entries)} hardcoded, {len(system.sources)} from assets,"
        f" positions exact {position_stats['exact_names']} + prefix {position_stats['prefix_names']}"
        f"/{position_stats['names']}"
    )
    probe_summary = summarize_probe(dict(probe))
    if not probe_summary["ok"]:
        reporter.info(f"system entry probe: {probe_summary['reason']}")


def _pack_shards(node_ids: list[str], chapter_index_map: dict[str, int], chapters: list[Any],
                 stories: dict[str, Any], reporter: Reporter,
                 ) -> tuple[dict[str, str], list[dict[str, Any]]]:
    sizes = {sid: len(dump_json(stories.get(sid, [])).encode("utf-8")) for sid in node_ids}
    shard_of, shards = pack_stories(
        node_ids, sizes, chapter_index_map, [chapter.id for chapter in chapters])
    largest = max((shard["bytes"] for shard in shards), default=0)
    reporter.info(
        f"story shards: {len(shards)} (largest {fmt_bytes(largest)},"
        f" budget {fmt_bytes(sum(shard['bytes'] for shard in shards))})"
    )
    return shard_of, shards


def _emit_checkpoints(reporter: Reporter, locale: dict[str, Any],
                      used: labels.NameTables, stats: dict[str, str] | None = None) -> dict[str, Any]:
    blob = read_json(CHECKPOINTS_PATH)
    if not isinstance(blob, dict) or blob.get("version") != CHECKPOINT_VERSION:
        if blob:
            reporter.warn("data/checkpoints.json version mismatch; rerun extract.py")
        blob = {}
    items = checkpoint_models.sanitize(blob.get("items"))
    labels.attach(items, locale, used, stats)
    variants = sum(len(model.get("variants") or []) for model in items.values())
    parts: list[dict[str, Any]] = []
    mapping: dict[str, int] = {}
    if items:
        mapping = assign_checkpoints(sorted(items), CHECKPOINT_SHARDS)
        parts = write_checkpoint_shards(WEB_DATA_DIR, items, mapping)
        reporter.info(
            f"checkpoint conditions: {len(items)} in {len(parts)} shards,"
            f" {variants} variants, {fmt_bytes(sum(item['bytes'] for item in parts))} total"
        )
    else:
        reporter.info("checkpoint conditions: none")
    return {
        "blob": blob,
        "items": items,
        "variants": variants,
        "parts": parts,
        "mapping": mapping,
    }


def _counts_report(edges: list[Edge], node_ids: list[str], in_degree: dict[str, int],
                   out_degree: dict[str, int], system_in: dict[str, int],
                   empty: set[str], simplified: set[str], facets: dict[str, Any],
                   system: Any, checkpoints: dict[str, Any]) -> tuple[dict[str, Any], ...]:
    edge_counts = {kind: sum(1 for edge in edges if edge.kind == kind) for kind in vocab.EDGE_KINDS}
    node_counts = {
        "empty": len(empty),
        "simplified_only": len(simplified),
        "no_incoming": sum(1 for sid in node_ids if in_degree[sid] == 0),
        "no_incoming_after_system": sum(
            1 for sid in node_ids if in_degree[sid] == 0 and system_in[sid] == 0),
        "no_incoming_after_entries": sum(
            1 for sid in node_ids if in_degree[sid] == 0 and sid not in system.sources),
        "system_in": sum(1 for sid in node_ids if system_in[sid] > 0),
        "entry_sources": len(system.sources),
        "no_outgoing": sum(1 for sid in node_ids if out_degree[sid] == 0),
    }
    facet_report = {
        "fields": list(vocab.FACET_KINDS),
        "speakers": len({key for row in facets.values() for key in row.speakers}),
        "flags": len({key for row in facets.values() for key in row.flags}),
        "checks": len({key for row in facets.values() for key in row.checks}),
        "stats": len({key for row in facets.values() for key in row.stats}),
        "rels": len({key for row in facets.values() for key in row.rels}),
        "scripts_with_flag": sum(1 for row in facets.values() if row.flags),
        "scripts_with_check": sum(1 for row in facets.values() if row.checks),
        "scripts_with_lock": sum(1 for row in facets.values() if row.locks),
        "scripts_with_dice": sum(1 for row in facets.values() if row.dice),
        "scripts_with_options": sum(1 for row in facets.values() if row.options),
    }
    parts = checkpoints["parts"]
    checkpoint_report = {
        "resolved": len(checkpoints["items"]),
        "variants": checkpoints["variants"],
        "bytes": sum(item["bytes"] for item in parts),
        "mode": "shards" if parts else "none",
        "shards": len(parts),
        "by_kind": checkpoint_models.count_kinds(checkpoints["items"]),
        "gaps": _gap_report(checkpoints["blob"]),
    }
    return edge_counts, node_counts, facet_report, checkpoint_report


def _wordcount_report(lang: str, data: dict[str, Any], reporter: Reporter) -> dict[str, Any]:
    sums = totals(data["chapters"])
    report = {
        "chapters": len(data["chapters"]),
        "stories": len(data["stories"]),
        "by_kind": {
            kind: {"zh": pair[0], "en": pair[1], "sum": pair[0] + pair[1]}
            for kind, pair in zip(KINDS, sums)
        },
        "total": {
            "zh": sum(pair[0] for pair in sums),
            "en": sum(pair[1] for pair in sums),
            "sum": sum(pair[0] + pair[1] for pair in sums),
        },
    }
    reporter.info(
        f"word count {lang}: {report['total']['sum']} chars"
        f" ({report['stories']} scripts)"
    )
    return report


def _prune_stale(parts: list[tuple[str, int]], reporter: Reporter) -> None:
    keep = {name for name, _ in parts}
    removed = prune(WEB_DATA_DIR, keep)
    if removed:
        reporter.info(f"removed {removed} stale artifacts")


def _positions(models: dict[str, ScriptAnalysis]) -> dict[str, list[str]]:
    return {sid: list(model.positions) for sid, model in models.items() if model.positions}


def _times(models: dict[str, ScriptAnalysis]) -> dict[str, int]:
    return {sid: model.time for sid, model in models.items() if model.time is not None}


def _collect(models: dict[str, ScriptAnalysis],
             probe: dict[str, Any]) -> tuple[CollectedEdges, list[Edge], list[Edge], Any,
                                             dict[str, Any], dict[str, int]]:
    collected = collect_edges(models)
    edges = list(collected.edges)
    node_ids = sorted(models)
    system = build_system_entries(probe, node_ids)
    position_edges, position_stats = expand_positions(
        _positions(models), node_ids, collected.adjacency, probe.get("positions") or {})
    edges.extend(position_edges)
    system_in: dict[str, int] = {sid: 0 for sid in node_ids}
    for edge in position_edges:
        system_in[edge.target] += 1
    return collected, edges, position_edges, system, position_stats, system_in


def run_build(*, langs: tuple[str, ...], default_lang: str,
              use_cache: bool = True,
              jobs: int | None = None,
              reporter: Reporter | None = None) -> BuildResult:
    reporter = reporter or Reporter()
    reporter.configure(BUILD_STAGES)
    if not langs:
        reporter.error("no language selected; pass --langs zh-tw")
        return BuildResult(False, 0, 0, 0, {}, REPORT_PATH)
    if TEXT_SOURCE_LANG not in langs:
        reporter.error(f"{TEXT_SOURCE_LANG} is required; the reader ships the source text only")
        return BuildResult(False, 0, 0, 0, {}, REPORT_PATH)
    if len(langs) > 1:
        reporter.warn(f"only {TEXT_SOURCE_LANG} is rendered; the other languages are derived at runtime")

    sources = _load_sources(reporter)
    if not sources:
        return BuildResult(False, 0, 0, 0, {}, REPORT_PATH)

    manifest = read_json(MANIFEST_PATH)
    if not isinstance(manifest, dict):
        manifest = {}
    anomalies = manifest.get("anomalies") or {}
    simplified = set(anomalies.get("simplified_only") or [])
    empty = set(anomalies.get("empty") or [])

    models, reused, failed = analyze_all(sources, use_cache, reporter, jobs)

    probe = read_json(ENTRIES_PATH)
    if not isinstance(probe, dict) or probe.get("version") != ENTRY_VERSION:
        if probe:
            reporter.warn("data/entries.json version mismatch; rerun extract.py")
        probe = {}
    collected, edges, position_edges, system, position_stats, system_in = _collect(models, probe)
    dynamic = collected.dynamic
    scene_total = sum(model.scene_count for model in models.values())
    node_ids = sorted(models)
    chapters, chapter_index = build_chapters(node_ids)
    chapter_of_id = {sid: chapter_id(*classify(sid)) for sid in node_ids}
    chapter_index_map = {sid: chapter_index[chapter_of_id[sid]] for sid in node_ids}

    locale = _load_locale(TEXT_SOURCE_LANG, reporter)
    if locale is None:
        return BuildResult(False, len(node_ids), len(edges), len(chapters), {}, REPORT_PATH)
    lore = _load_lore(reporter)
    stat_notes = _load_stats(reporter)
    battle_items = _load_battles(reporter)
    used_names: labels.NameTables = {}
    battle_cards = (BattleCards(battle_items, locale, used_names, stat_notes)
                    if battle_items else None)

    battle_facets = collect_battle_facets(models, battle_cards)
    facets = {
        sid: merge(collect_facets(models[sid].beats, models[sid].checks),
                   battle_facets.get(sid))
        for sid in node_ids
    }
    times = _times(models)

    _report_graph(reporter, edges, position_edges, dynamic, scene_total,
                  chapters, times, system, position_stats, probe)

    nodes = assemble_nodes(
        node_ids, models, chapter_index_map, collected.out_degree, collected.in_degree,
        system_in, facets, empty, simplified, system.sources, times,
    )

    WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)
    reporter.stage(STAGE_RENDER)
    checkpoints = _emit_checkpoints(reporter, locale, used_names, stat_notes)
    checkpoint_mapping = checkpoints["mapping"]

    render = render_language(
        TEXT_SOURCE_LANG, locale, node_ids, models, chapter_of_id, chapters, facets, edges,
        lore, used_names, stat_notes, battle_cards)
    names = labels.trim(used_names)
    metrics = render.metrics
    reporter.info(
        f"battle cards: {metrics['battles']} rendered, {metrics['battle_missing']} missing levels"
    )
    reporter.info(
        f"rendered {TEXT_SOURCE_LANG}: {len(render.stories)} scripts, {metrics['options']} options"
        f" ({metrics['locked']} locked), {metrics['rich']} rich text,"
        f" {metrics['missing']} missing keys"
    )
    reporter.info(
        f"inner monologue {metrics['think']} ({metrics['think_named']} with a speaker),"
        f" lore {metrics['lore']} (fallback {metrics['lore_fallback']},"
        f" unresolved {metrics['lore_missing']})"
    )

    shard_of, shards = _pack_shards(
        node_ids, chapter_index_map, chapters, render.stories, reporter)

    parts, language_report = _write_language(render, names, shard_of, shards)
    languages: dict[str, Any] = {TEXT_SOURCE_LANG: language_report}
    reporter.info(
        f"wrote {TEXT_SOURCE_LANG}: head {fmt_bytes(language_report['head_bytes'])}"
        f", {language_report['shard_count']} shards {fmt_bytes(language_report['shard_bytes'])}"
    )

    wordcount_payload = {
        "schema": SCHEMA_VERSION,
        "kinds": list(KINDS),
        "langs": {TEXT_SOURCE_LANG: {"chapters": render.chapters, "stories": render.rows}},
    }
    wordcount_size = write_wordcount(WEB_DATA_DIR / "wordcount.js", wordcount_payload)
    parts.append(("wordcount.js", wordcount_size))
    parts.extend((item["name"], item["bytes"]) for item in checkpoints["parts"])

    game = _game_info(manifest)
    if game.version or game.build:
        reporter.info("game version: " + " · ".join(piece for piece in (
            f"v{game.version}" if game.version else "",
            f"build {game.build}" if game.build else "",
            f"updated {game.updated}" if game.updated else "",
        ) if piece))
    else:
        reporter.info("game version: unavailable (normal when the game is not installed)")

    display_langs = [TEXT_SOURCE_LANG, *DERIVED_LANGS]
    graph_payload = {
        "schema": SCHEMA_VERSION,
        "meta": {
            "generated": time.strftime("%Y-%m-%d %H:%M:%S"),
            "game": game.to_wire(),
            "langs": display_langs,
            "defaultLang": default_lang,
            "textSource": TEXT_SOURCE_LANG,
            "vocab": vocab.wire_payload(),
            "assets": assets_payload(),
            "calendar": {"roundsPerYear": ROUNDS_PER_YEAR, "roundsPerMonth": ROUNDS_PER_MONTH},
            "counts": {
                "scripts": len(node_ids),
                "edges": len(edges),
                "chapters": len(chapters),
                "dynamicJumps": len(dynamic),
            },
            "shards": shards,
            "shardOf": shard_of,
            "checkpointShards": checkpoint_mapping,
            "entries": system.entries,
        },
        "chapters": [chapter.to_wire() for chapter in chapters],
        "nodes": [node.to_wire() for node in nodes],
        "edges": [edge.to_wire(index) for index, edge in enumerate(edges)],
    }
    graph_size = write_graph(WEB_DATA_DIR / "graph.js", graph_payload)
    parts.append(("graph.js", graph_size))

    _prune_stale(parts, reporter)

    edge_counts, node_counts, facet_report, checkpoint_report = _counts_report(
        edges, node_ids, collected.in_degree, collected.out_degree, system_in,
        empty, simplified, facets, system, checkpoints)
    wordcount_report = _wordcount_report(
        TEXT_SOURCE_LANG, wordcount_payload["langs"][TEXT_SOURCE_LANG], reporter)

    battle_manifest = manifest.get("battle_stats") or {}
    battle_report = {
        "levels": len(battle_items),
        "used": metrics.get("battles", 0),
        "missing": metrics.get("battle_missing", 0),
        "extracted": battle_manifest.get("levels", 0),
        "by_kind": battle_manifest.get("by_kind") or {},
        "events": battle_manifest.get("events", 0),
        "actions": battle_manifest.get("actions", 0),
        "elapsed": battle_manifest.get("elapsed", 0),
    }
    lore_manifest = manifest.get("lore_stats") or {}
    lore_report = {
        "items": len(lore),
        "wanted": lore_manifest.get("wanted", 0),
        "resolved": lore_manifest.get("resolved", 0),
        "unresolved": lore_manifest.get("unresolved", 0),
        "fallback": metrics.get("lore_fallback", 0),
        "missing": metrics.get("lore_missing", 0),
        "samples": metrics.get("lore_missing_samples", []),
    }
    report_payload = compose(
        generated=time.strftime("%Y-%m-%d %H:%M:%S"),
        scripts=len(node_ids),
        edge_counts=edge_counts,
        node_counts=node_counts,
        entries={
            "hardcoded": system.entries,
            "hardcoded_missing": system.missing,
            "position": position_stats,
            "asset_probe": summarize_probe(dict(probe)),
        },
        facets=facet_report,
        checkpoints=checkpoint_report,
        battles=battle_report,
        lore=lore_report,
        wordcount={"bytes": wordcount_size, "langs": wordcount_report},
        times={
            "explicit": len(times),
            "range": [list(date_of(min(times.values()))), list(date_of(max(times.values())))]
            if times else None,
            "scripts": sorted(times),
        },
        chapters=[chapter.to_wire() for chapter in chapters],
        text={
            "shard_count": len(shards),
            "largest_shard_kb": max((round(shard["bytes"] / 1024) for shard in shards), default=0),
            "shards": shards,
        },
        languages=languages,
        dynamic=dynamic,
        analysis={
            "failed": failed,
            "cache_reused": reused,
            "scene_switches": scene_total,
        },
        artifacts=[{"name": name, "size": size} for name, size in parts],
    )
    write_report(REPORT_PATH, report_payload)

    reporter.stage(STAGE_OUTPUT)
    reporter.info("graph.js " + fmt_bytes(graph_size) + ", " + ", ".join(
        f"{name} {fmt_bytes(size)}" for name, size in parts
        if name != "graph.js" and not name.startswith("checkpoints-")))
    reporter.info(f"{len(node_ids)} nodes / {len(edges)} edges / {len(chapters)} chapters")
    reporter.info(f"report -> {REPORT_PATH}")
    if failed:
        reporter.warn(
            f"{failed} scripts failed to parse and were degraded to empty text (see report.json)")
    if not render.stories:
        reporter.error("all scripts rendered empty, check the extraction output")
        return BuildResult(False, len(node_ids), len(edges), len(chapters), languages, REPORT_PATH)
    return BuildResult(True, len(node_ids), len(edges), len(chapters), languages, REPORT_PATH)
