from __future__ import annotations

from pathlib import Path
from typing import Any

from ..console import Reporter
from .assets import AssetSession
from .reading import count_reasons, missing_fields, multiline_text
from .schema import LORE_FIELDS

GAP_NOT_FOUND = "not_found"
GAP_EMPTY_TEXT = "empty_text"
GAP_PARSE_ERROR = "parse_error"


def probe(session: AssetSession, wanted: set[str],
          reporter: Reporter) -> tuple[dict[str, str], list[dict[str, str]]]:
    if not wanted:
        return {}, []
    if session.generator is None:
        raise RuntimeError("TypeTreeGeneratorAPI is not installed")
    items: dict[str, str] = {}
    seen: set[str] = set()
    failed: set[str] = set()
    by_file: dict[Path, list[Any]] = {}
    for path, obj in session.iter_type("MonoBehaviour"):
        name = session.name(obj)
        if not name or name not in wanted:
            continue
        by_file.setdefault(path, []).append(obj)
    for path, objects in sorted(by_file.items(), key=lambda item: str(item[0])):
        hits = 0
        for obj in objects:
            name = session.name(obj)
            seen.add(name)
            tree = session.tree(path, obj)
            if not tree:
                failed.add(name)
                continue
            missing = missing_fields(tree, LORE_FIELDS)
            if missing:
                session.warn_once(
                    ("fields", "LegendInfo", *missing),
                    f"LegendInfo is missing {', '.join(missing)}; lore texts may be incomplete")
            text = multiline_text(tree.get("_text"))
            if not text:
                continue
            if len(text) > len(items.get(name, "")):
                items[name] = text
                hits += 1
        reporter.info(f"{path.name}: {hits} lore texts ({len(items)} total)")
    gaps: list[dict[str, str]] = []
    for key in sorted(wanted):
        if key in items:
            continue
        if key in failed:
            reason = GAP_PARSE_ERROR
        elif key in seen:
            reason = GAP_EMPTY_TEXT
        else:
            reason = GAP_NOT_FOUND
        gaps.append({"key": key, "reason": reason})
    return dict(sorted(items.items())), gaps


def summarize(candidates: set[str], items: dict[str, str], gaps: list[dict[str, str]],
              elapsed: float) -> dict[str, Any]:
    return {
        "wanted": len(candidates),
        "resolved": len(items),
        "unresolved": max(len(candidates) - len(items), 0),
        "by_reason": count_reasons(gaps),
        "elapsed": round(elapsed, 1),
    }
