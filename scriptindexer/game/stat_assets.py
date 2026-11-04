from __future__ import annotations

import time
from typing import Any

from ..console import Reporter
from .assets import AssetSession
from .unity_fields import STAT_CLASS, STAT_FIELDS
from .unity_objects import absent_fields, coerce_int, collapse_text


def extract(session: AssetSession, reporter: Reporter
            ) -> tuple[dict[str, dict[str, Any]], dict[str, Any]]:
    started = time.time()
    warnings = session.warnings
    items: dict[str, dict[str, Any]] = {}
    for path, obj, cls in session.iter_class({STAT_CLASS}):
        tree = session.typetree(path, obj)
        if not isinstance(tree, dict):
            continue
        missing = absent_fields(tree, STAT_FIELDS)
        if missing:
            session.warn_once(
                ("fields", cls, *missing),
                f"{cls} is missing {', '.join(missing)}; stat names may be incomplete")
        key = collapse_text(tree.get("m_Name"))
        if not key:
            continue
        stat_record: dict[str, Any] = {"type": coerce_int(tree.get("_type"))}
        note = collapse_text(tree.get("_name"))
        if note:
            stat_record["note"] = note
        items[key] = stat_record
    elapsed = round(time.time() - started, 1)
    summary = summarize(items, elapsed)
    reporter.info(
        f"stat assets: {summary['assets']} assets, {summary['with_note']} with notes, {elapsed}s")
    if session.warnings > warnings:
        reporter.warn(f"stat assets: {session.warnings - warnings} read warnings")
    return dict(sorted(items.items())), summary


def summarize(items: dict[str, dict[str, Any]], elapsed: float) -> dict[str, Any]:
    with_note = sum(1 for record in items.values() if record.get("note"))
    return {"assets": len(items), "with_note": with_note, "elapsed": round(elapsed, 1)}
