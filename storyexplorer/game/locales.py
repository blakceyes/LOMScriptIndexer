from __future__ import annotations

import re
import time
from typing import Any

from ..console import Reporter
from ..languages import SUPPORTED_LANGS
from .assets import AssetSession

_LOCALE_LINE = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*)/([^\r\n=]{1,160}?) = (.*)$")


def language_of(name: str) -> str | None:
    lower = (name or "").strip().lower()
    for lang in SUPPORTED_LANGS:
        if not lower.endswith(lang):
            continue
        head = lower[: -len(lang)]
        if head.endswith("_") or head.endswith("-"):
            return lang
    return None


def parse_locale_text(text: str) -> tuple[dict[str, dict[str, str]], int]:
    table: dict[str, dict[str, str]] = {}
    matched = 0
    for raw_line in text.splitlines():
        if not raw_line.strip() or raw_line.lstrip().startswith("//"):
            continue
        match = _LOCALE_LINE.match(raw_line)
        if not match:
            continue
        prefix, key, value = match.group(1), match.group(2), match.group(3)
        table.setdefault(prefix, {})[key] = value.replace("\\n", "\n")
        matched += 1
    return table, matched


def merge_tables(target: dict[str, dict[str, str]],
                 incoming: dict[str, dict[str, str]]) -> int:
    added = 0
    for prefix, entries in incoming.items():
        bucket = target.setdefault(prefix, {})
        for key, value in entries.items():
            if key not in bucket:
                bucket[key] = value
                added += 1
    return added


def extract_locales(session: AssetSession, langs: tuple[str, ...],
                    reporter: Reporter) -> tuple[dict[str, dict[str, dict[str, str]]], dict[str, Any]]:
    reporter.stage(4, 4, f"locale tables: {', '.join(langs)}")
    started = time.time()
    tables: dict[str, dict[str, dict[str, str]]] = {lang: {} for lang in langs}
    stats: dict[str, Any] = {"shards": 0, "lines": 0, "skipped": 0}
    for path, obj in session.iter_type("TextAsset"):
        lang = language_of(session.name(obj))
        if lang is None or lang not in tables:
            continue
        text = session.read_text(obj)
        if " = " not in text:
            stats["skipped"] += 1
            continue
        table, matched = parse_locale_text(text)
        if not matched:
            stats["skipped"] += 1
            continue
        stats["shards"] += 1
        stats["lines"] += matched
        merge_tables(tables[lang], table)
    reporter.info(
        f"{stats['shards']} locale shards, {stats['lines']} lines"
        f" ({stats['skipped']} skipped), {time.time() - started:.1f}s"
    )
    return tables, stats
