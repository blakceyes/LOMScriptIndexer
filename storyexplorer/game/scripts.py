from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

from ..console import Reporter
from .assets import AssetSession

PRIMARY_PREFIX = "story/chinesetraditional/"
FALLBACK_PREFIX = "story/chinesesimplified/"


@dataclass
class ScriptCorpus:
    scripts: dict[str, str] = field(default_factory=dict)
    origin: dict[str, str] = field(default_factory=dict)
    stats: dict[str, Any] = field(default_factory=dict)
    anomalies: dict[str, list[str]] = field(default_factory=dict)


def resource_entries(session: AssetSession) -> list[tuple[str, int]]:
    found = session.find_type("ResourceManager")
    if found is None:
        return []
    path, obj = found
    tree = session.tree(path, obj)
    entries: list[tuple[str, int]] = []
    for item in (tree or {}).get("m_Container") or []:
        try:
            name, info = item
            entries.append((str(name), int(info["m_PathID"])))
        except (TypeError, ValueError, KeyError):
            continue
    return entries


def _basename(path: str) -> str:
    return path.rsplit("/", 1)[-1]


def extract_scripts(session: AssetSession, reporter: Reporter) -> ScriptCorpus:
    reporter.stage(1, 4, "reading scripts from resources")
    started = time.time()
    entries = [(name.lower(), path_id) for name, path_id in resource_entries(session)]
    reporter.info(f"{len(entries)} resource paths")

    primary: list[tuple[int, str]] = []
    fallback: list[tuple[int, str]] = []
    for name, path_id in entries:
        if name.startswith(PRIMARY_PREFIX):
            primary.append((path_id, _basename(name)))
        elif name.startswith(FALLBACK_PREFIX):
            fallback.append((path_id, _basename(name)))

    wanted = {path_id: name for path_id, name in primary}
    wanted.update({path_id: name for path_id, name in fallback if path_id not in wanted})
    texts: dict[int, tuple[str, str]] = {}
    for path, obj in session.iter_type("TextAsset"):
        path_id = int(getattr(obj, "path_id", 0) or 0)
        expected = wanted.get(path_id)
        if expected is None:
            continue
        name = session.name(obj)
        if name:
            folded = name.lower()
            if folded not in (expected.lower(), f"{expected.lower()}.lua"):
                continue
        if path_id not in texts:
            text = session.read_text(obj).replace("\r\n", "\n").replace("\r", "\n")
            texts[path_id] = (name or expected, text)

    corpus = ScriptCorpus()
    missing: list[str] = []
    empty: list[str] = []

    for path_id, name in primary:
        if path_id not in texts:
            missing.append(name)
            continue
        text_name, text = texts[path_id]
        key = (text_name or name).removesuffix(".lua")
        if not text:
            empty.append(key)
        corpus.scripts[key] = text
        corpus.origin[key] = "traditional"

    fallback_only: list[str] = []
    for path_id, name in fallback:
        if path_id not in wanted or path_id not in texts:
            continue
        text_name, text = texts[path_id]
        key = (text_name or name).removesuffix(".lua")
        if not text or corpus.scripts.get(key):
            continue
        corpus.scripts[key] = text
        corpus.origin[key] = "simplified"
        fallback_only.append(key)
        if key in empty:
            empty.remove(key)

    corpus.stats = {
        "text_assets": len(texts),
        "traditional": sum(1 for value in corpus.origin.values() if value == "traditional"),
        "simplified_only": len(fallback_only),
    }
    corpus.anomalies = {"simplified_only": fallback_only, "empty": empty, "missing": missing}

    reporter.info(
        f"{len(texts)} TextAssets -> {len(corpus.scripts)} scripts"
        f" (traditional {corpus.stats['traditional']},"
        f" simplified only {corpus.stats['simplified_only']}),"
        f" {time.time() - started:.1f}s"
    )
    if fallback_only:
        reporter.info(f"simplified only (unreachable in game): {', '.join(fallback_only[:6])}")
    if empty:
        reporter.info(f"{len(empty)} empty scripts: {', '.join(empty[:6])}")
    if missing:
        reporter.warn(f"{len(missing)} paths present but resources missing: {missing[:3]}")
    return corpus
