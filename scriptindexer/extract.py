from __future__ import annotations

import hashlib
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .analysis_cache import analyze_all
from .cache import CacheKey, load_envelope, save_envelope
from .console import Reporter
from .game.assets import AssetSession, build_generator
from .game.battle_levels import extract as extract_battles
from .game.battle_levels import summarize as summarize_battles
from .game.checkpoints import (
    collect_hints,
    collect_keys,
    extract as extract_checkpoints,
    scan as scan_checkpoints,
    summarize as summarize_checkpoints,
)
from .game.entries import probe as probe_entries
from .game.entries import summarize as summarize_entries
from .game.info import read_game_info
from .game.layout import GameLayout, discover, game_root, install_dir, steamapps_dir
from .game.locales import extract_locales
from .game.lore import probe as probe_lore
from .game.lore import summarize as summarize_lore
from .game.scripts import ScriptCorpus, extract_scripts
from .game.stats import extract as extract_stats
from .game.stats import summarize as summarize_stats
from .jsonio import atomic_write_text, write_json
from .manifest import load_manifest, manifest_matches, save_manifest
from .paths import (
    BATTLE_CACHE_PATH,
    BATTLES_PATH,
    CHECKPOINT_CACHE_PATH,
    CHECKPOINTS_PATH,
    ENTRY_CACHE_PATH,
    ENTRIES_PATH,
    LORE_CACHE_PATH,
    LORE_PATH,
    LOCALE_DIR,
    LUA_DIR,
    MANIFEST_PATH,
    STATS_CACHE_PATH,
    STATS_PATH,
)
from .versions import (
    BATTLE_VERSION,
    CHECKPOINT_VERSION,
    ENTRY_VERSION,
    LOCALE_VERSION,
    LORE_VERSION,
    SCHEMA_VERSION,
    STAT_VERSION,
)

OK = "ok"
USAGE = "usage"
DATA = "data"

STAGE_SCRIPTS = "scripts"
STAGE_ANALYSIS = "semantic analysis"
STAGE_CHECKPOINTS = "checkpoint conditions"
STAGE_ENTRIES = "system entries"
STAGE_STATS = "stat assets"
STAGE_BATTLES = "battle levels"
STAGE_LOCALES = "locale tables"
STAGE_LORE = "lore texts"

EXTRACT_STAGES = (
    STAGE_SCRIPTS,
    STAGE_ANALYSIS,
    STAGE_CHECKPOINTS,
    STAGE_ENTRIES,
    STAGE_STATS,
    STAGE_BATTLES,
    STAGE_LOCALES,
    STAGE_LORE,
)

GENERATOR_MISSING = (
    "TypeTreeGeneratorAPI is not installed or its .NET runtime is unavailable"
)


@dataclass(frozen=True)
class ExtractRequest:
    game: Path | None
    langs: tuple[str, ...]
    force: bool = False
    checkpoints: bool = True
    entries: bool = True
    lore: bool = True
    stats: bool = True
    battles: bool = True


@dataclass(frozen=True)
class ExtractResult:
    kind: str
    reason: str = ""
    scripts: int = 0
    langs: tuple[str, ...] = ()

    @property
    def ok(self) -> bool:
        return self.kind == OK


@dataclass
class StageStats:
    values: dict[str, Any] = field(default_factory=dict)
    enabled: bool = True
    skipped: bool = False
    elapsed: float = 0.0
    warnings: tuple[str, ...] = ()

    def to_wire(self) -> dict[str, Any]:
        out: dict[str, Any] = {"enabled": self.enabled, "skipped": self.skipped}
        out.update(self.values)
        out["elapsed"] = round(self.elapsed, 1)
        if self.warnings:
            out["warnings"] = list(self.warnings)
        return out


StageRun = Callable[[], tuple[dict[str, Any], dict[str, Any]]]
StageSummarize = Callable[[dict[str, Any], dict[str, Any]], StageStats]
StagePublish = Callable[[dict[str, Any], dict[str, Any]], None]
StageNote = Callable[[StageStats], str]


@dataclass(frozen=True)
class Stage:
    title: str
    version: int
    cache_path: Path
    fingerprint: str
    run: StageRun
    summarize: StageSummarize
    publish: StagePublish
    note: StageNote


def _write_versioned(path: Path, version: int, items: dict[str, Any],
                     extra: dict[str, Any] | None = None) -> None:
    payload: dict[str, Any] = {"version": version, "items": items}
    if extra:
        payload.update(extra)
    write_json(path, payload, indent=None)


def _stats_note(stats: StageStats, key: str, label: str) -> str:
    return f"{stats.values.get(key, 0)} {label} from cache"


def _run_stage(stage: Stage, force: bool, reporter: Reporter) -> dict[str, Any]:
    reporter.stage(stage.title)
    key = CacheKey(stage.version, stage.fingerprint)
    cached = None if force else load_envelope(stage.cache_path, key)
    if isinstance(cached, dict):
        items = cached.get("items")
        extra = cached.get("extra")
        item_map = items if isinstance(items, dict) else {}
        extra_map = extra if isinstance(extra, dict) else {}
        stats = stage.summarize(item_map, extra_map)
        stage.publish(item_map, extra_map)
        reporter.info(stage.note(stats))
        return stats.to_wire()

    started = time.time()
    items, extra = stage.run()
    extra["elapsed"] = round(time.time() - started, 1)
    stats = stage.summarize(items, extra)
    skip = extra.get("skip")
    if skip:
        reporter.warn(str(skip))
    else:
        save_envelope(stage.cache_path, key, {"items": items, "extra": extra})
    stage.publish(items, extra)
    return stats.to_wire()


def _disabled_stage(reporter: Reporter, title: str) -> dict[str, Any]:
    reporter.stage(title)
    return StageStats(enabled=False, skipped=True).to_wire()


def _checkpoint_stage(session: AssetSession, models: dict[str, Any], reporter: Reporter,
                      fingerprint: str) -> Stage:
    wanted = collect_keys(models)
    hints = collect_hints(models)

    def run() -> tuple[dict[str, Any], dict[str, Any]]:
        if not wanted:
            return {}, {"gaps": [], "skip": "no checkpoint references in the corpus, skipping"}
        if session.generator is None:
            return {}, {"gaps": [], "skip": GENERATOR_MISSING}
        reporter.info(f"scanning assets for {len(wanted)} configs")
        found = scan_checkpoints(session, wanted, reporter)
        reporter.info(f"located {len(found)}/{len(wanted)}, reading fields...")
        items, gaps = extract_checkpoints(session, found, reporter, hints)
        return items, {"gaps": gaps}

    def summarize(items: dict[str, Any], extra: dict[str, Any]) -> StageStats:
        values = summarize_checkpoints(items, len(wanted), extra.get("gaps") or [])
        return StageStats(
            values=values,
            skipped=bool(extra.get("skip")),
            elapsed=float(extra.get("elapsed") or 0.0),
        )

    def publish(items: dict[str, Any], extra: dict[str, Any]) -> None:
        _write_versioned(CHECKPOINTS_PATH, CHECKPOINT_VERSION, items,
                         {"gaps": extra.get("gaps") or []})

    def note(stats: StageStats) -> str:
        kinds = stats.values.get("by_kind") or {}
        detail = ", ".join(f"{kind} {count}" for kind, count in kinds.items())
        return f"{stats.values.get('resolved', 0)} from cache" + (f" ({detail})" if detail else "")

    return Stage(
        title=STAGE_CHECKPOINTS,
        version=CHECKPOINT_VERSION,
        cache_path=CHECKPOINT_CACHE_PATH,
        fingerprint=fingerprint,
        run=run,
        summarize=summarize,
        publish=publish,
        note=note,
    )


def _entry_stage(session: AssetSession, ids: set[str], reporter: Reporter,
                 fingerprint: str) -> Stage:
    def run() -> tuple[dict[str, Any], dict[str, Any]]:
        if not ids:
            return {}, {"skip": "no scripts found, skipping the system entry probe"}
        reporter.info("scanning asset files")
        return probe_entries(session, ids, reporter), {}

    def summarize(items: dict[str, Any], extra: dict[str, Any]) -> StageStats:
        values = summarize_entries(items)
        skip = extra.get("skip")
        if skip:
            values["reason"] = str(skip)
        return StageStats(
            values=values,
            skipped=bool(skip),
            elapsed=float(values.get("elapsed") or 0.0),
        )

    def publish(items: dict[str, Any], extra: dict[str, Any]) -> None:
        write_json(ENTRIES_PATH, items or {}, indent=None)

    return Stage(
        title=STAGE_ENTRIES,
        version=ENTRY_VERSION,
        cache_path=ENTRY_CACHE_PATH,
        fingerprint=fingerprint,
        run=run,
        summarize=summarize,
        publish=publish,
        note=lambda stats: (
            f"{stats.values.get('entries', 0)} sources and"
            f" {stats.values.get('positions', 0)} position events from cache"
        ),
    )


def _stat_stage(session: AssetSession, reporter: Reporter, fingerprint: str) -> Stage:
    def run() -> tuple[dict[str, Any], dict[str, Any]]:
        if session.generator is None:
            return {}, {"skip": GENERATOR_MISSING}
        try:
            items, _stats = extract_stats(session, reporter)
        except Exception as exc:
            return {}, {"skip": f"stat asset extraction failed: {type(exc).__name__}: {exc}"}
        return items, {}

    def summarize(items: dict[str, Any], extra: dict[str, Any]) -> StageStats:
        elapsed = float(extra.get("elapsed") or 0.0)
        return StageStats(
            values=summarize_stats(items, elapsed),
            skipped=bool(extra.get("skip")),
            elapsed=elapsed,
        )

    def publish(items: dict[str, Any], extra: dict[str, Any]) -> None:
        _write_versioned(STATS_PATH, STAT_VERSION, items)

    return Stage(
        title=STAGE_STATS,
        version=STAT_VERSION,
        cache_path=STATS_CACHE_PATH,
        fingerprint=fingerprint,
        run=run,
        summarize=summarize,
        publish=publish,
        note=lambda stats: _stats_note(stats, "assets", "assets"),
    )


def _battle_stage(session: AssetSession, reporter: Reporter, fingerprint: str) -> Stage:
    def run() -> tuple[dict[str, Any], dict[str, Any]]:
        if session.generator is None:
            return {}, {"skip": GENERATOR_MISSING}
        try:
            items, stats = extract_battles(session, reporter)
        except Exception as exc:
            return {}, {"skip": f"battle level extraction failed: {type(exc).__name__}: {exc}"}
        extra = {key: stats[key] for key in ("failed", "duplicates", "unresolved_refs")
                 if key in stats}
        return items, extra

    def summarize(items: dict[str, Any], extra: dict[str, Any]) -> StageStats:
        elapsed = float(extra.get("elapsed") or 0.0)
        values = summarize_battles(items, elapsed)
        for key in ("failed", "duplicates", "unresolved_refs"):
            if key in extra:
                values[key] = extra[key]
        return StageStats(
            values=values,
            skipped=bool(extra.get("skip")),
            elapsed=elapsed,
        )

    def publish(items: dict[str, Any], extra: dict[str, Any]) -> None:
        _write_versioned(BATTLES_PATH, BATTLE_VERSION, items)

    return Stage(
        title=STAGE_BATTLES,
        version=BATTLE_VERSION,
        cache_path=BATTLE_CACHE_PATH,
        fingerprint=fingerprint,
        run=run,
        summarize=summarize,
        publish=publish,
        note=lambda stats: _stats_note(stats, "levels", "levels"),
    )


def _lore_stage(session: AssetSession, missing: set[str], story_keys: int,
                reporter: Reporter, fingerprint: str) -> Stage:
    if missing:
        key_hash = hashlib.blake2b("\n".join(sorted(missing)).encode("utf-8"), digest_size=8).hexdigest()
        lore_key = f"{fingerprint}:{key_hash}"
    else:
        lore_key = fingerprint

    def run() -> tuple[dict[str, Any], dict[str, Any]]:
        if not missing:
            return {}, {"missing": [], "gaps": [],
                        "skip": "every AddStory key has a LegendInfo entry"}
        if session.generator is None:
            return {}, {"missing": sorted(missing), "gaps": [],
                        "skip": GENERATOR_MISSING, "unavailable": True}
        reporter.info(f"scanning assets for {len(missing)} missing LegendInfo keys")
        try:
            items, gaps = probe_lore(session, missing, reporter)
        except Exception as exc:
            reporter.warn(f"lore probe failed: {type(exc).__name__}: {exc}")
            items = {}
            gaps = [{"key": key, "reason": "probe_error"} for key in sorted(missing)]
        return items, {"missing": sorted(missing), "gaps": gaps}

    def summarize(items: dict[str, Any], extra: dict[str, Any]) -> StageStats:
        elapsed = float(extra.get("elapsed") or 0.0)
        candidates = set(extra.get("missing") or [])
        values = summarize_lore(candidates, items, extra.get("gaps") or [], elapsed)
        values["story_keys"] = story_keys
        if extra.get("unavailable"):
            values["by_reason"] = {"unavailable": len(candidates)}
        return StageStats(
            values=values,
            skipped=bool(extra.get("skip")),
            elapsed=elapsed,
        )

    def publish(items: dict[str, Any], extra: dict[str, Any]) -> None:
        _write_versioned(LORE_PATH, LORE_VERSION, items)

    return Stage(
        title=STAGE_LORE,
        version=LORE_VERSION,
        cache_path=LORE_CACHE_PATH,
        fingerprint=lore_key,
        run=run,
        summarize=summarize,
        publish=publish,
        note=lambda stats: (
            f"StoryData fallback: {stats.values.get('resolved', 0)} from cache"
        ),
    )


def _write_scripts(scripts: dict[str, str], reporter: Reporter) -> None:
    LUA_DIR.mkdir(parents=True, exist_ok=True)
    for name, text in sorted(scripts.items()):
        atomic_write_text(LUA_DIR / f"{name}.lua", text)
    stale = 0
    for path in LUA_DIR.glob("*.lua"):
        if path.stem not in scripts:
            path.unlink()
            stale += 1
    if stale:
        reporter.info(f"removed {stale} stale scripts")


def _write_locales(tables: dict[str, dict[str, dict[str, str]]], langs: tuple[str, ...],
                   reporter: Reporter) -> tuple[dict[str, int], dict[str, int]]:
    LOCALE_DIR.mkdir(parents=True, exist_ok=True)
    keys: dict[str, int] = {}
    namespaces: dict[str, int] = {}
    for lang in langs:
        payload = {prefix: entries for prefix, entries in sorted(tables[lang].items())}
        write_json(LOCALE_DIR / f"{lang}.json", payload, indent=None)
        keys[lang] = len(payload.get("Story", {}))
        namespaces[lang] = len(payload)
        reporter.info(
            f"{lang}: {keys[lang]} Story keys / {namespaces[lang]} namespaces,"
            f" {len(payload.get('Character', {}))} Character keys"
        )
    return keys, namespaces


def _stage_versions(request: ExtractRequest) -> dict[str, int]:
    return {
        "checkpoints": CHECKPOINT_VERSION if request.checkpoints else 0,
        "entries": ENTRY_VERSION if request.entries else 0,
        "stats": STAT_VERSION if request.stats else 0,
        "battles": BATTLE_VERSION if request.battles else 0,
        "locale": LOCALE_VERSION,
        "lore": LORE_VERSION if request.lore else 0,
    }


def _manifest_payload(
    layout: GameLayout, langs: tuple[str, ...], request: ExtractRequest,
    corpus: ScriptCorpus, locale_keys: dict[str, int], locale_stats: dict[str, Any],
    namespaces: dict[str, int], checkpoint_stats: dict[str, Any],
    entry_stats: dict[str, Any], stat_stats: dict[str, Any],
    battle_stats: dict[str, Any], lore_stats: dict[str, Any],
) -> dict[str, Any]:
    return {
        "schema": SCHEMA_VERSION,
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "game": str(layout.root),
        "fingerprint": layout.fingerprint(),
        "stage_versions": _stage_versions(request),
        "langs": list(langs),
        "script_count": len(corpus.scripts),
        "script_stats": corpus.stats,
        "anomalies": corpus.anomalies,
        "locale_keys": locale_keys,
        "locale_stats": {**locale_stats, "namespaces": {
            lang: namespaces[lang] for lang in sorted(namespaces)}},
        "checkpoint_stats": checkpoint_stats,
        "entry_stats": entry_stats,
        "stat_stats": stat_stats,
        "battle_stats": battle_stats,
        "lore_stats": lore_stats,
    }


def _run_extract(layout: GameLayout, langs: tuple[str, ...], request: ExtractRequest,
                 reporter: Reporter) -> ExtractResult:
    reporter.configure(EXTRACT_STAGES)
    fingerprint = layout.fingerprint()
    needs_generator = (request.checkpoints or request.entries or request.lore
                       or request.stats or request.battles)
    generator = build_generator(layout) if needs_generator else None
    if needs_generator and generator is None:
        reporter.warn(
            "TypeTreeGeneratorAPI is not installed or its .NET runtime is unavailable;"
            " condition, entry, lore and stat extraction will be skipped"
        )
    session = AssetSession(layout, generator, reporter.info)
    try:
        reporter.stage(STAGE_SCRIPTS)
        corpus = extract_scripts(session, reporter)
        if not corpus.scripts:
            reporter.error("no script extracted, check the game version or UnityPy compatibility")
            return ExtractResult(DATA, "no scripts")
        _write_scripts(corpus.scripts, reporter)

        models, _reused, _failed = analyze_all(
            corpus.scripts, not request.force, reporter)
        failed_scripts = [(sid, model.error) for sid, model in sorted(models.items())
                          if model.error]
        for sid, error in failed_scripts[:20]:
            reporter.warn(f"{sid} failed to parse: {error}")
        if len(failed_scripts) > 20:
            reporter.warn(f"{len(failed_scripts) - 20} more scripts failed to parse")

        checkpoint_stats = (
            _run_stage(_checkpoint_stage(session, models, reporter, fingerprint),
                       request.force, reporter)
            if request.checkpoints else _disabled_stage(reporter, STAGE_CHECKPOINTS)
        )
        entry_stats = (
            _run_stage(_entry_stage(session, set(corpus.scripts), reporter, fingerprint),
                       request.force, reporter)
            if request.entries else _disabled_stage(reporter, STAGE_ENTRIES)
        )
        stat_stats = (
            _run_stage(_stat_stage(session, reporter, fingerprint), request.force, reporter)
            if request.stats else _disabled_stage(reporter, STAGE_STATS)
        )
        battle_stats = (
            _run_stage(_battle_stage(session, reporter, fingerprint), request.force, reporter)
            if request.battles else _disabled_stage(reporter, STAGE_BATTLES)
        )

        reporter.stage(STAGE_LOCALES)
        tables, locale_stats = extract_locales(session, langs, reporter)
        locale_keys, namespaces = _write_locales(tables, langs, reporter)

        story_keys = {key for model in models.values() for key in model.story_keys}
        missing = {
            key for key in story_keys
            if any(key not in (tables[lang].get("LegendInfo") or {}) for lang in langs)
        }
        lore_stats = (
            _run_stage(_lore_stage(session, missing, len(story_keys), reporter, fingerprint),
                       request.force, reporter)
            if request.lore else _disabled_stage(reporter, STAGE_LORE)
        )

        info = read_game_info(session, steamapps_dir(layout.root), install_dir(layout.root))
        if info.version:
            reporter.info(f"game version: v{info.version}")
    finally:
        session.close()

    save_manifest(
        MANIFEST_PATH,
        _manifest_payload(layout, langs, request, corpus, locale_keys, locale_stats, namespaces,
                          checkpoint_stats, entry_stats, stat_stats, battle_stats, lore_stats),
    )
    reporter.blank()
    reporter.write(f"[done] {len(corpus.scripts)} scripts -> {LUA_DIR}")
    reporter.write(f"[done] stat assets -> {STATS_PATH}")
    reporter.write(f"[done] battle levels -> {BATTLES_PATH}")
    for lang in langs:
        reporter.write(f"[done] {lang} locale table -> {LOCALE_DIR / (lang + '.json')}")
    reporter.write(f"[done] manifest -> {MANIFEST_PATH}")
    return ExtractResult(OK, scripts=len(corpus.scripts), langs=langs)


def run(request: ExtractRequest, reporter: Reporter) -> ExtractResult:
    root = request.game if request.game is not None else game_root()
    if root is None:
        reporter.error("no game directory given; pass --game or set the game directory env var")
        return ExtractResult(USAGE, "game directory missing")
    layout = discover(root)
    if layout is None:
        reporter.error(f"game data directory not found under {root}")
        return ExtractResult(USAGE, "game assets missing")
    langs = request.langs
    if not langs:
        reporter.error("no language selected; pass --langs zh-tw,zh-cn")
        return ExtractResult(USAGE, "no language")

    manifest = load_manifest(MANIFEST_PATH)
    if not request.force and manifest_matches(
            manifest, layout.fingerprint(), langs, LUA_DIR, LOCALE_DIR,
            _stage_versions(request), (BATTLES_PATH,) if request.battles else ()):
        reporter.write("[skip] resources unchanged and outputs complete; use --force to rerun")
        reporter.write(
            f"       {manifest.get('script_count')} scripts, "
            + ", ".join(f"{lang} {count} keys"
                        for lang, count in (manifest.get("locale_keys") or {}).items()))
        return ExtractResult(OK, scripts=int(manifest.get("script_count") or 0), langs=langs)

    return _run_extract(layout, langs, request, reporter)


__all__ = ["ExtractRequest", "ExtractResult", "run"]
