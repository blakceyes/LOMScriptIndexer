from __future__ import annotations

import time
from typing import Any

from ..console import Reporter
from .assets import AssetSession
from .schema import STAT_CLASS


def _clean(text: Any) -> str:
    if not isinstance(text, str):
        return ""
    return " ".join(text.replace("\r\n", "\n").replace("\r", "\n").split())


def extract(session: AssetSession, reporter: Reporter) -> tuple[dict[str, dict[str, Any]],
                                                               dict[str, Any]]:
    started = time.time()
    warnings = session.warnings
    items: dict[str, dict[str, Any]] = {}
    for path, obj, _cls in session.iter_class({STAT_CLASS}):
        tree = session.tree(path, obj)
        if not isinstance(tree, dict):
            continue
        key = _clean(tree.get("m_Name"))
        if not key:
            continue
        entry: dict[str, Any] = {"type": int(tree.get("_type") or 0)}
        note = _clean(tree.get("_name"))
        if note:
            entry["note"] = note
        items[key] = entry
    elapsed = round(time.time() - started, 1)
    stats = summarize(items, elapsed)
    reporter.info(
        f"stat assets: {stats['assets']} assets, {stats['with_note']} with notes, {elapsed}s")
    if session.warnings > warnings:
        reporter.warn(f"stat assets: {session.warnings - warnings} read warnings")
    return dict(sorted(items.items())), stats


def summarize(items: dict[str, dict[str, Any]], elapsed: float = 0.0) -> dict[str, Any]:
    with_note = sum(1 for entry in items.values() if entry.get("note"))
    return {"assets": len(items), "with_note": with_note, "elapsed": round(elapsed, 1)}
