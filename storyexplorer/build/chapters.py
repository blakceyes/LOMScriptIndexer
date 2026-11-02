from __future__ import annotations

import re
from collections.abc import Sequence
from dataclasses import dataclass

from ..model import Chapter
from ..vocab import (
    CHAPTER_ACT,
    CHAPTER_CHAPTER,
    CHAPTER_EVENT,
    CHAPTER_OTHER,
    CHAPTER_PROLOGUE,
)


@dataclass(frozen=True)
class ChapterRule:
    pattern: re.Pattern[str]
    kind: str
    number_group: int | None = None
    zero_kind: str | None = None


CHAPTER_RULES: tuple[ChapterRule, ...] = (
    ChapterRule(re.compile(r"^ch(\d+)_", re.IGNORECASE), "chapter", 1, "prologue"),
    ChapterRule(re.compile(r"^act(\d+)", re.IGNORECASE), "act", 1),
    ChapterRule(re.compile(r"^[sS](\d{2})\d{2}_"), "event", 1),
    ChapterRule(re.compile(r"^(door|room|center|back|meeting|mall|teashop|fortress|talk|shop|inn)"),
                "scene"),
    ChapterRule(re.compile(r"^(kitchen|pharmacy|alchemy|craft|forge|chess|fish|farm|work|labour)"),
                "work"),
    ChapterRule(re.compile(r"^travel", re.IGNORECASE), "travel"),
    ChapterRule(re.compile(r"^section_\d+_free", re.IGNORECASE), "free"),
    ChapterRule(re.compile(r"^section_", re.IGNORECASE), "section"),
    ChapterRule(re.compile(r"^(legend|library|book|event|mission)", re.IGNORECASE), "misc"),
)

CHAPTER_PALETTE: tuple[str, ...] = (
    "#C8A96A", "#B4453B", "#6E8B8F", "#A8763E", "#7FA36B", "#8C7CA8",
    "#C98B6B", "#5B8FA8", "#A8A06B", "#9C6B8F", "#6B8FA8", "#B08A5B",
    "#8FA86B", "#A85B77", "#5B77A8", "#A88F5B",
)

CHAPTER_RANK: dict[str, int] = {
    "prologue": 0,
    "chapter": 1,
    "act": 2,
    "event": 3,
    "scene": 4,
    "work": 5,
    "travel": 6,
    "free": 7,
    "section": 8,
    "misc": 9,
    "other": 10,
}


def classify(script_id: str) -> tuple[str, int | None]:
    for rule in CHAPTER_RULES:
        match = rule.pattern.match(script_id)
        if not match:
            continue
        number = int(match.group(rule.number_group)) if rule.number_group else None
        kind = rule.zero_kind if number == 0 and rule.zero_kind else rule.kind
        return kind, number
    return CHAPTER_OTHER, None


def chapter_id(kind: str, number: int | None) -> str:
    if number is None:
        return kind
    if kind in (CHAPTER_CHAPTER, CHAPTER_PROLOGUE):
        return f"ch{number}"
    if kind == CHAPTER_ACT:
        return f"act{number}"
    if kind == CHAPTER_EVENT:
        return f"s{number:02d}"
    return f"{kind}{number}"


def build_chapters(script_ids: Sequence[str]) -> tuple[list[Chapter], dict[str, int]]:
    order: list[str] = []
    kinds: dict[str, tuple[str, int | None]] = {}
    counts: dict[str, int] = {}
    for sid in script_ids:
        kind, number = classify(sid)
        cid = chapter_id(kind, number)
        if cid not in kinds:
            order.append(cid)
            kinds[cid] = (kind, number)
            counts[cid] = 0
        counts[cid] += 1

    def sort_key(cid: str) -> tuple[int, int, str]:
        kind, number = kinds[cid]
        return CHAPTER_RANK.get(kind, len(CHAPTER_RANK)), number or 0, cid

    order.sort(key=sort_key)
    chapters = [
        Chapter(cid, kinds[cid][0], kinds[cid][1], CHAPTER_PALETTE[index % len(CHAPTER_PALETTE)],
                counts[cid])
        for index, cid in enumerate(order)
    ]
    return chapters, {cid: index for index, cid in enumerate(order)}
