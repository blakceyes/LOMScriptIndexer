from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from typing import Any

from ..script_model import BranchBeat, ChoiceBeat, Facets, MetaBeat, SayBeat
from ..vocab import COND_CHECK, COND_COMPARE, COND_GROUP, COND_LOGIC

_CHECK_TAGS = (COND_CHECK, COND_COMPARE, COND_LOGIC, COND_GROUP)


def _walk_checks(node: Any, out: set[str]) -> None:
    if not isinstance(node, dict):
        return
    if node.get("tag") == COND_CHECK:
        key = str(node.get("key") or "")
        if key:
            out.add(key)
        return
    if node.get("tag") not in _CHECK_TAGS:
        return
    for item in (node.get("left"), node.get("right")):
        _walk_checks(item, out)
    for item in node.get("items") or []:
        _walk_checks(item, out)


def collect_facets(beats: Sequence[object],
                   extra_check_keys: Iterable[str] | None = None) -> Facets:
    speakers: set[str] = set()
    flags: set[str] = set()
    checks: set[str] = set()
    stats: set[str] = set()
    relations: set[str] = set()
    option_count = 0
    lock_count = 0
    dice_check_count = 0

    def walk(rows: Sequence[object]) -> None:
        nonlocal option_count, lock_count, dice_check_count
        for beat in rows:
            if isinstance(beat, SayBeat):
                if beat.speaker:
                    speakers.add(beat.speaker)
            elif isinstance(beat, MetaBeat):
                if not beat.key:
                    continue
                if beat.kind in ("flag", "setflag"):
                    flags.add(beat.key)
                elif beat.kind in ("stat", "setstat"):
                    stats.add(beat.key)
                elif beat.kind in ("rel", "setrel"):
                    relations.add(beat.key)
                elif beat.kind == "dice":
                    checks.add(beat.key)
                    dice_check_count += 1
            elif isinstance(beat, BranchBeat):
                if beat.check:
                    checks.add(beat.check.key)
                _walk_checks(beat.cond, checks)
                walk(beat.beats)
            elif isinstance(beat, ChoiceBeat):
                option_count += len(beat.options)
                for option in beat.options:
                    if option.lock:
                        lock_count += 1
                    walk(option.beats)

    walk(beats)
    if extra_check_keys:
        checks.update(key for key in extra_check_keys if key)
    return Facets(
        speakers=tuple(sorted(speakers)),
        flags=tuple(sorted(flags)),
        checks=tuple(sorted(checks)),
        stats=tuple(sorted(stats)),
        relations=tuple(sorted(relations)),
        option_count=option_count,
        lock_count=lock_count,
        dice_check_count=dice_check_count,
    )


def merge(base: Facets, battle_facets: Mapping[str, Iterable[str]] | None) -> Facets:
    if not battle_facets:
        return base

    def combine(values: Iterable[str], field: str) -> tuple[str, ...]:
        merged = set(values)
        merged.update(value for value in battle_facets.get(field) or () if value)
        return tuple(sorted(merged))

    return Facets(
        speakers=combine(base.speakers, "speakers"),
        flags=combine(base.flags, "flags"),
        checks=combine(base.checks, "checks"),
        stats=combine(base.stats, "stats"),
        relations=combine(base.relations, "relations"),
        option_count=base.option_count,
        lock_count=base.lock_count,
        dice_check_count=base.dice_check_count,
    )
