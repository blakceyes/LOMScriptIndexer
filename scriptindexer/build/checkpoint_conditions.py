from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from ..vocab import COND_TAGS


def _drop_invalid_condition(condition: dict[str, Any]) -> dict[str, Any]:
    cleaned_condition = dict(condition)
    branches = []
    for branch in condition.get("branches") or []:
        if not isinstance(branch, dict):
            continue
        item = dict(branch)
        expression = item.get("expr")
        if expression is not None and not (
                isinstance(expression, dict) and expression.get("tag") in COND_TAGS):
            item.pop("expr", None)
        branches.append(item)
    cleaned_condition["branches"] = branches
    variants = condition.get("variants")
    if isinstance(variants, list):
        cleaned = [
            _drop_invalid_condition(variant)
            for variant in variants if isinstance(variant, dict)
        ]
        if cleaned:
            cleaned_condition["variants"] = cleaned
        else:
            cleaned_condition.pop("variants", None)
    return cleaned_condition


def drop_invalid_conditions(checkpoints: Any) -> dict[str, Any]:
    out: dict[str, Any] = {}
    if not isinstance(checkpoints, dict):
        return out
    for key, condition in checkpoints.items():
        if isinstance(condition, dict):
            out[key] = _drop_invalid_condition(condition)
    return out


def _strip_note(checkpoint: dict[str, Any]) -> None:
    checkpoint.pop("note", None)
    for variant in checkpoint.get("variants") or []:
        if isinstance(variant, dict):
            _strip_note(variant)


def strip_notes(checkpoints: Mapping[str, Any]) -> None:
    for checkpoint in checkpoints.values():
        if isinstance(checkpoint, dict):
            _strip_note(checkpoint)


def count_by_kind(checkpoints: Mapping[str, Any]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for condition in checkpoints.values():
        if not isinstance(condition, dict):
            continue
        kind = str(condition.get("kind") or "?")
        counts[kind] = counts.get(kind, 0) + 1
    return counts
