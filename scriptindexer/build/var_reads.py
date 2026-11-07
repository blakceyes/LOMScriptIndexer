from collections.abc import Mapping
from typing import Any

from ..vocab import (
    COND_COMPARE,
    COND_GROUP,
    COND_LOGIC,
    COND_VAR,
    VALUE_FLAG,
    VALUE_REL,
    VALUE_STAT,
)

READ_KINDS = (VALUE_FLAG, VALUE_STAT, VALUE_REL)
CHECKPOINT_KIND_FLAG = "flag"

type ReadIndex = dict[str, dict[str, list[str]]]


def _add(index: dict[str, dict[str, set[str]]], kind: str, key: str, checkpoint: str) -> None:
    if not key or not checkpoint:
        return
    bucket = index.get(kind)
    if bucket is None:
        return
    bucket.setdefault(key, set()).add(checkpoint)


def _walk(node: Any, checkpoint: str, index: dict[str, dict[str, set[str]]]) -> None:
    if not isinstance(node, Mapping):
        return
    tag = node.get("tag")
    if tag == COND_VAR:
        _add(index, str(node.get("kind") or ""), str(node.get("key") or ""), checkpoint)
        return
    if tag in (COND_COMPARE, COND_LOGIC):
        _walk(node.get("left"), checkpoint, index)
        _walk(node.get("right"), checkpoint, index)
        for item in node.get("items") or []:
            _walk(item, checkpoint, index)
        return
    if tag == COND_GROUP:
        for item in node.get("items") or []:
            _walk(item, checkpoint, index)


def _walk_checkpoint(checkpoint: Mapping[str, Any], key: str,
                     index: dict[str, dict[str, set[str]]]) -> None:
    if checkpoint.get("kind") == CHECKPOINT_KIND_FLAG:
        _add(index, VALUE_FLAG, key, key)
    for branch in checkpoint.get("branches") or []:
        if isinstance(branch, Mapping):
            _walk(branch.get("expr"), key, index)
    for addition in checkpoint.get("additions") or []:
        if isinstance(addition, Mapping):
            _add(index, str(addition.get("kind") or ""), str(addition.get("key") or ""), key)
    for variant in checkpoint.get("variants") or []:
        if isinstance(variant, Mapping):
            _walk_checkpoint(variant, key, index)


def collect_reads(checkpoints: Mapping[str, Any]) -> ReadIndex:
    index: dict[str, dict[str, set[str]]] = {kind: {} for kind in READ_KINDS}
    for key, checkpoint in checkpoints.items():
        if isinstance(checkpoint, Mapping):
            _walk_checkpoint(checkpoint, str(key), index)
    return {
        kind: {value: sorted(keys) for value, keys in sorted(bucket.items())}
        for kind, bucket in index.items()
    }
