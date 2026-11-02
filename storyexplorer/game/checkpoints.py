from __future__ import annotations

import time
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from ..console import Reporter
from ..model import ScriptAnalysis
from ..vocab import COMPARE_OP_SYMBOL
from .assets import AssetSession, FileScope
from .conditions import (
    condition_node,
    dice_addition,
    dice_branch_node,
    label_of,
)
from .schema import CHECKPOINT_CLASSES

GAP_NOT_FOUND = "not_found"
GAP_NO_TREE = "no_tree"
GAP_PARSE_ERROR = "parse_error"
GAP_UNMATCHED = "unmatched"
GAP_FILE_ERROR = "file_error"
GAP_UNKNOWN_CLASS = "unknown_class"


def collect_keys(models: Mapping[str, ScriptAnalysis]) -> set[str]:
    return {key for model in models.values() for key in model.checks}


def collect_hints(models: Mapping[str, ScriptAnalysis]) -> dict[str, set[str]]:
    hints: dict[str, set[str]] = {}
    for model in models.values():
        for key, kinds in model.checks.items():
            hints.setdefault(key, set()).update(kinds)
    return hints


def choose_model(models: list[dict[str, Any]], hinted: set[str] | None = None) -> dict[str, Any]:
    if hinted:
        for model in models:
            if model.get("kind") in hinted:
                return model
    return models[0]


def _distinct_models(models: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for model in models:
        kind = str(model.get("kind") or "")
        if not kind or kind in seen:
            continue
        seen.add(kind)
        out.append(model)
    return out


def _model_with_variants(models: list[dict[str, Any]],
                         hinted: set[str] | None = None) -> dict[str, Any]:
    distinct = _distinct_models(models)
    primary = choose_model(distinct, hinted)
    variants = [model for model in distinct if model is not primary]
    if not variants:
        return primary
    merged = dict(primary)
    merged["variants"] = variants
    return merged


def scan(session: AssetSession, wanted: set[str], reporter: Reporter) -> dict[str, list[Path]]:
    found: dict[str, list[Path]] = {}
    files = session.layout.files
    for index, path in enumerate(files, 1):
        try:
            objects = session.objects(path)
        except Exception as exc:
            reporter.warn(f"failed to read {path.name}: {type(exc).__name__}")
            continue
        hits = 0
        for obj in objects:
            if obj.type.name != "MonoBehaviour":
                continue
            name = session.name(obj)
            if name not in wanted:
                continue
            paths = found.setdefault(name, [])
            if path not in paths:
                paths.append(path)
                hits += 1
        reporter.info(f"[{index}/{len(files)}] {path.name}: {hits} hits ({len(found)} total)")
    return found


def _branch(result: int, expr: dict[str, Any] | None) -> dict[str, Any]:
    branch: dict[str, Any] = {"result": result}
    if expr:
        branch["expr"] = expr
    return branch


def _parse_switch(tree: dict[str, Any], scope: FileScope) -> dict[str, Any]:
    branches = [
        _branch(index + 1, condition_node(item, scope))
        for index, item in enumerate(tree.get("_items") or [])
    ]
    count_items = tree.get("_countItems") or []
    return {
        "kind": "switch",
        "useCount": bool(tree.get("_useCount", 0)),
        "note": (tree.get("_devNote") or "").strip(),
        "branches": branches,
        "fallback": len(branches) + 1,
        "countItems": [
            {"op": COMPARE_OP_SYMBOL.get(item.get("_compareOp", 0), "?"),
             "value": item.get("_value"), "result": index + 1}
            for index, item in enumerate(count_items)
        ],
    }


def _parse_condition(tree: dict[str, Any], scope: FileScope) -> dict[str, Any]:
    branches = [_branch(1, condition_node(item, scope)) for item in tree.get("_items") or []]
    return {
        "kind": "condition",
        "note": (tree.get("_devNote") or "").strip(),
        "branches": branches,
    }


def _parse_dice(tree: dict[str, Any], scope: FileScope) -> dict[str, Any]:
    additions = [dice_addition(item, scope) for item in tree.get("_propertyItems") or []]
    branches = [
        _branch(index + 1, dice_branch_node(item))
        for index, item in enumerate(tree.get("_resultItems") or [])
    ]
    return {
        "kind": "dice",
        "note": (tree.get("_devNote") or "").strip(),
        "additions": additions,
        "branches": branches,
        "fallback": len(branches) + 1,
    }


def _parse_position(tree: dict[str, Any], scope: FileScope) -> dict[str, Any]:
    candidates = []
    for item in tree.get("_list") or []:
        ref = item.get("_config")
        target = scope(ref)
        candidates.append({
            "name": label_of(target, (ref or {}).get("m_PathID")),
            "rate": item.get("_defaultRate", 0),
            "note": (item.get("_devNote") or "").strip(),
        })
    return {
        "kind": "position",
        "note": (tree.get("_devNote") or "").strip(),
        "prefix": tree.get("_scriptPrefix") or "",
        "candidates": candidates,
    }


def _parse_flag(tree: dict[str, Any], scope: FileScope) -> dict[str, Any]:
    return {
        "kind": "flag",
        "note": (tree.get("_devNote") or "").strip(),
        "default": tree.get("_default", 0),
    }


PARSERS = {
    "switch": _parse_switch,
    "condition": _parse_condition,
    "dice": _parse_dice,
    "position": _parse_position,
    "flag": _parse_flag,
}


def extract(session: AssetSession, found: dict[str, list[Path]], reporter: Reporter,
            hints: dict[str, set[str]] | None = None) -> tuple[dict[str, dict[str, Any]],
                                                               list[dict[str, Any]]]:
    if not found:
        return {}, []
    by_file: dict[Path, list[str]] = {}
    for key, paths in found.items():
        for path in paths:
            by_file.setdefault(path, []).append(key)

    models: dict[str, dict[str, Any]] = {}
    gaps: list[dict[str, Any]] = []
    started = time.time()
    reporter.info(f"parsing {len(found)} checkpoint configs ({len(by_file)} files)...")
    for path, keys in sorted(by_file.items(), key=lambda item: str(item[0])):
        try:
            objects = session.objects(path)
        except Exception as exc:
            reporter.warn(f"failed to open {path.name}: {type(exc).__name__}")
            gaps.extend({"key": key, "reason": GAP_FILE_ERROR, "detail": type(exc).__name__}
                        for key in keys)
            continue
        wanted = set(keys)
        candidates: dict[str, list[Any]] = {}
        for obj in objects:
            name = session.name(obj)
            if name in wanted:
                candidates.setdefault(name, []).append(obj)
        scope = session.scope(path)
        for key in keys:
            parsed_models: list[dict[str, Any]] = []
            reasons: list[str] = []
            for obj in candidates.get(key) or []:
                kind = CHECKPOINT_CLASSES.get(session.class_name(path, obj))
                if kind is None:
                    reasons.append(GAP_UNKNOWN_CLASS)
                    continue
                tree = session.tree(path, obj)
                if not tree:
                    reasons.append(GAP_NO_TREE)
                    continue
                try:
                    parsed = PARSERS[kind](tree, scope)
                except Exception as exc:
                    reporter.warn(f"failed to parse {key}: {type(exc).__name__}")
                    reasons.append(GAP_PARSE_ERROR)
                    continue
                parsed_models.append(parsed)
            if not parsed_models:
                gaps.append({"key": key, "reason": reasons[0] if reasons else GAP_NOT_FOUND})
                continue
            models[key] = _model_with_variants(parsed_models, (hints or {}).get(key))
    by_reason: dict[str, int] = {}
    for gap in gaps:
        by_reason[gap["reason"]] = by_reason.get(gap["reason"], 0) + 1
    reporter.info(
        f"checkpoint conditions: {len(models)} resolved, {len(gaps)} failed"
        + (f" ({', '.join(f'{key} {value}' for key, value in sorted(by_reason.items()))})"
           if gaps else "")
        + f", {time.time() - started:.1f}s"
    )
    for gap in gaps[:8]:
        reporter.info(f"gap {gap['key']}: {gap['reason']}"
                      + (f" ({gap['detail']})" if gap.get("detail") else ""))
    if len(gaps) > 8:
        reporter.info(f"... {len(gaps) - 8} more gaps, see data/checkpoints.json")
    return models, gaps


def summarize(models: dict[str, dict[str, Any]], wanted: int,
              gaps: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    by_kind: dict[str, int] = {}
    variant_count = 0
    for model in models.values():
        by_kind[model["kind"]] = by_kind.get(model["kind"], 0) + 1
        variant_count += len(model.get("variants") or [])
    out: dict[str, Any] = {
        "resolved": len(models),
        "wanted": wanted,
        "missing": max(wanted - len(models), 0),
        "by_kind": by_kind,
        "variants": variant_count,
    }
    if gaps is not None:
        by_reason: dict[str, int] = {}
        for gap in gaps:
            by_reason[gap["reason"]] = by_reason.get(gap["reason"], 0) + 1
        out["gaps"] = {"total": len(gaps), "by_reason": by_reason}
    return out
