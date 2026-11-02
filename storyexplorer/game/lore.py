from __future__ import annotations

from typing import Any

from ..console import Reporter
from .assets import AssetSession

GAP_NOT_FOUND = "not_found"
GAP_EMPTY_TEXT = "empty_text"
GAP_PARSE_ERROR = "parse_error"


def _clean(text: Any) -> str:
    if not isinstance(text, str):
        return ""
    return text.replace("\r\n", "\n").replace("\r", "\n").strip()


def probe(session: AssetSession, wanted: set[str],
          reporter: Reporter) -> tuple[dict[str, str], list[dict[str, str]]]:
    if not wanted:
        return {}, []
    if session.generator is None:
        raise RuntimeError("TypeTreeGeneratorAPI is not installed")
    files = session.layout.files
    items: dict[str, str] = {}
    seen: set[str] = set()
    failed: set[str] = set()
    for index, path in enumerate(files, 1):
        try:
            objects = session.objects(path)
        except Exception as exc:
            reporter.warn(f"lore: failed to open {path.name}: {type(exc).__name__}")
            continue
        hits = 0
        for obj in objects:
            if obj.type.name != "MonoBehaviour":
                continue
            name = session.name(obj)
            if not name or name not in wanted:
                continue
            seen.add(name)
            tree = session.tree(path, obj)
            if not tree:
                failed.add(name)
                continue
            text = _clean(tree.get("_text"))
            if not text:
                continue
            if len(text) > len(items.get(name, "")):
                items[name] = text
                hits += 1
        reporter.info(f"[{index}/{len(files)}] {path.name}: {hits} lore texts ({len(items)} total)")
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
    by_reason: dict[str, int] = {}
    for gap in gaps:
        reason = str(gap.get("reason") or "?")
        by_reason[reason] = by_reason.get(reason, 0) + 1
    return {
        "wanted": len(candidates),
        "resolved": len(items),
        "unresolved": max(len(candidates) - len(items), 0),
        "by_reason": by_reason,
        "elapsed": round(elapsed, 1),
    }
