from __future__ import annotations

import re
from collections.abc import Sequence
from dataclasses import dataclass

from ..script_model import Chapter
from ..vocab import (
    CHAPTER_ACT,
    CHAPTER_CHAPTER,
    CHAPTER_EVENT,
    CHAPTER_FREE,
    CHAPTER_MISC,
    CHAPTER_OTHER,
    CHAPTER_PROLOGUE,
    CHAPTER_SCENE,
    CHAPTER_SECTION,
    CHAPTER_TRAVEL,
    CHAPTER_WORK,
    CHAPTER_KINDS,
)


@dataclass(frozen=True)
class ChapterRule:
    pattern: re.Pattern[str]
    kind: str
    number_group: int | None = None
    kind_when_zero: str | None = None


CHAPTER_RULES: tuple[ChapterRule, ...] = (
    ChapterRule(re.compile(r"^ch(\d+)_", re.IGNORECASE), CHAPTER_CHAPTER, 1, CHAPTER_PROLOGUE),
    ChapterRule(re.compile(r"^act(\d+)", re.IGNORECASE), CHAPTER_ACT, 1),
    ChapterRule(re.compile(r"^[sS](\d{2})\d{2}_"), CHAPTER_EVENT, 1),
    ChapterRule(re.compile(r"^(door|room|center|back|meeting|mall|teashop|fortress|talk|shop|inn)"),
                CHAPTER_SCENE),
    ChapterRule(re.compile(r"^(kitchen|pharmacy|alchemy|craft|forge|chess|fish|farm|work|labour)"),
                CHAPTER_WORK),
    ChapterRule(re.compile(r"^travel", re.IGNORECASE), CHAPTER_TRAVEL),
    ChapterRule(re.compile(r"^section_\d+_free", re.IGNORECASE), CHAPTER_FREE),
    ChapterRule(re.compile(r"^section_", re.IGNORECASE), CHAPTER_SECTION),
    ChapterRule(re.compile(r"^(legend|library|book|event|mission)", re.IGNORECASE), CHAPTER_MISC),
)

CHAPTER_PALETTE: tuple[str, ...] = (
    "#C8A96A", "#B4453B", "#6E8B8F", "#A8763E", "#7FA36B", "#8C7CA8",
    "#C98B6B", "#5B8FA8", "#A8A06B", "#9C6B8F", "#6B8FA8", "#B08A5B",
    "#8FA86B", "#A85B77", "#5B77A8", "#A88F5B",
)

CHAPTER_RANK: dict[str, int] = {kind: index for index, kind in enumerate(CHAPTER_KINDS)}


def classify(script_id: str) -> tuple[str, int | None]:
    for rule in CHAPTER_RULES:
        match = rule.pattern.match(script_id)
        if not match:
            continue
        number = int(match.group(rule.number_group)) if rule.number_group else None
        kind = rule.kind_when_zero if number == 0 and rule.kind_when_zero else rule.kind
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
        chapter_key = chapter_id(kind, number)
        if chapter_key not in kinds:
            order.append(chapter_key)
            kinds[chapter_key] = (kind, number)
            counts[chapter_key] = 0
        counts[chapter_key] += 1

    def sort_key(chapter_key: str) -> tuple[int, int, str]:
        kind, number = kinds[chapter_key]
        return CHAPTER_RANK.get(kind, len(CHAPTER_RANK)), number or 0, chapter_key

    order.sort(key=sort_key)
    chapters = [
        Chapter(chapter_key, kinds[chapter_key][0], kinds[chapter_key][1],
                CHAPTER_PALETTE[index % len(CHAPTER_PALETTE)], counts[chapter_key])
        for index, chapter_key in enumerate(order)
    ]
    return chapters, {chapter_key: index for index, chapter_key in enumerate(order)}
