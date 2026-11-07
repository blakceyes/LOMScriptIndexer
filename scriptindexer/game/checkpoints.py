import time
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from ..console import Reporter
from ..script_model import ScriptAnalysis
from ..vocab import COMPARE_OP_SYMBOL
from .assets import AssetSession, FileScope
from .conditions import (
    condition_node,
    dice_addition,
    dice_branch_node,
    display_name_of,
)
from .unity_fields import CHECKPOINT_CLASSES, CHECKPOINT_FIELDS
from .unity_objects import absent_fields, count_by_reason

GAP_NOT_FOUND = "not_found"
GAP_NO_TREE = "no_tree"
GAP_PARSE_ERROR = "parse_error"
GAP_UNMATCHED = "unmatched"
GAP_FILE_ERROR = "file_error"
GAP_UNKNOWN_CLASS = "unknown_class"


def collect_check_keys(analyses: Mapping[str, ScriptAnalysis]) -> set[str]:
    return {key for analysis in analyses.values() for key in analysis.checks}


def collect_kind_hints(analyses: Mapping[str, ScriptAnalysis]) -> dict[str, set[str]]:
    kind_hints: dict[str, set[str]] = {}
    for analysis in analyses.values():
        for key, kinds in analysis.checks.items():
            kind_hints.setdefault(key, set()).update(kinds)
    return kind_hints


def pick_condition(conditions: list[dict[str, Any]],
                   kind_hints: set[str] | None = None) -> dict[str, Any]:
    if kind_hints:
        for condition in conditions:
            if condition.get("kind") in kind_hints:
                return condition
    return conditions[0]


def _distinct_conditions(conditions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for condition in conditions:
        kind = str(condition.get("kind") or "")
        if not kind or kind in seen:
            continue
        seen.add(kind)
        out.append(condition)
    return out


def _condition_with_variants(conditions: list[dict[str, Any]],
                             kind_hints: set[str] | None = None) -> dict[str, Any]:
    distinct = _distinct_conditions(conditions)
    primary = pick_condition(distinct, kind_hints)
    variants = [condition for condition in distinct if condition is not primary]
    if not variants:
        return primary
    merged = dict(primary)
    merged["variants"] = variants
    return merged


def locate_checkpoint_assets(session: AssetSession, wanted_keys: set[str],
                             reporter: Reporter) -> dict[str, list[Path]]:
    located: dict[str, list[Path]] = {}
    by_file: dict[Path, list[str]] = {}
    for path, obj in session.iter_type("MonoBehaviour"):
        name = session.object_name(obj)
        if name in wanted_keys:
            by_file.setdefault(path, []).append(name)
    for path, names in sorted(by_file.items(), key=lambda item: str(item[0])):
        for name in names:
            bucket = located.setdefault(name, [])
            if path not in bucket:
                bucket.append(path)
        reporter.info(f"{path.name}: {len(names)} hits ({len(located)} total)")
    return located


def _branch(expected_result: int, expression: dict[str, Any] | None) -> dict[str, Any]:
    branch: dict[str, Any] = {"result": expected_result}
    if expression:
        branch["expr"] = expression
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
    branches = [
        _branch(1, condition_node(item, scope)) for item in tree.get("_items") or []
    ]
    return {
        "kind": "condition",
        "note": (tree.get("_devNote") or "").strip(),
        "branches": branches,
    }


def _parse_dice(tree: dict[str, Any], scope: FileScope) -> dict[str, Any]:
    additions = [
        dice_addition(item, scope) for item in tree.get("_propertyItems") or []
    ]
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
            "name": display_name_of(target, (ref or {}).get("m_PathID")),
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


def extract(session: AssetSession, located: dict[str, list[Path]], reporter: Reporter,
            kind_hints: dict[str, set[str]]
            ) -> tuple[dict[str, dict[str, Any]], list[dict[str, Any]]]:
    if not located:
        return {}, []
    by_file: dict[Path, list[str]] = {}
    for key, paths in located.items():
        for path in paths:
            by_file.setdefault(path, []).append(key)

    conditions: dict[str, dict[str, Any]] = {}
    parsed_by_key: dict[str, list[dict[str, Any]]] = {}
    reasons_by_key: dict[str, list[str]] = {}
    gaps: list[dict[str, Any]] = []
    started = time.time()
    reporter.info(f"parsing {len(located)} checkpoint configs ({len(by_file)} files)...")
    for path, keys in sorted(by_file.items(), key=lambda item: str(item[0])):
        try:
            objects = session.objects(path)
        except Exception as exc:
            reporter.warn(f"failed to open {path.name}: {type(exc).__name__}")
            for key in keys:
                reasons_by_key.setdefault(key, []).append(GAP_FILE_ERROR)
            continue
        wanted_keys = set(keys)
        candidates: dict[str, list[Any]] = {}
        for obj in objects:
            name = session.object_name(obj)
            if name in wanted_keys:
                candidates.setdefault(name, []).append(obj)
        scope = session.file_scope(path)
        for key in keys:
            parsed_conditions = parsed_by_key.setdefault(key, [])
            reasons = reasons_by_key.setdefault(key, [])
            for obj in candidates.get(key) or []:
                kind = CHECKPOINT_CLASSES.get(session.monobehaviour_class(path, obj))
                if kind is None:
                    reasons.append(GAP_UNKNOWN_CLASS)
                    continue
                tree = session.typetree(path, obj)
                if not tree:
                    reasons.append(GAP_NO_TREE)
                    continue
                missing = absent_fields(tree, CHECKPOINT_FIELDS.get(kind, ()))
                if missing:
                    session.warn_once(
                        ("fields", kind, *missing),
                        f"{kind} checkpoint is missing {', '.join(missing)};"
                        " its conditions may render empty")
                try:
                    parsed = PARSERS[kind](tree, scope)
                except Exception as exc:
                    reporter.warn(f"failed to parse {key}: {type(exc).__name__}")
                    reasons.append(GAP_PARSE_ERROR)
                    continue
                parsed_conditions.append(parsed)
    for key in sorted(located):
        parsed_conditions = parsed_by_key.get(key) or []
        if not parsed_conditions:
            reasons = reasons_by_key.get(key) or [GAP_NOT_FOUND]
            gaps.append({"key": key, "reason": reasons[0]})
            continue
        conditions[key] = _condition_with_variants(parsed_conditions, kind_hints.get(key))
    by_reason = count_by_reason(gaps)
    reporter.info(
        f"checkpoint conditions: {len(conditions)} resolved, {len(gaps)} failed"
        + (f" ({', '.join(f'{key} {value}' for key, value in sorted(by_reason.items()))})"
           if gaps else "")
        + f", {time.time() - started:.1f}s"
    )
    for gap in gaps[:8]:
        reporter.info(f"gap {gap['key']}: {gap['reason']}"
                      + (f" ({gap['detail']})" if gap.get("detail") else ""))
    if len(gaps) > 8:
        reporter.info(f"... {len(gaps) - 8} more gaps, see data/checkpoints.json")
    return conditions, gaps


def summarize(conditions: dict[str, dict[str, Any]], wanted_count: int,
              gaps: list[dict[str, Any]]) -> dict[str, Any]:
    by_kind: dict[str, int] = {}
    variant_count = 0
    for condition in conditions.values():
        by_kind[condition["kind"]] = by_kind.get(condition["kind"], 0) + 1
        variant_count += len(condition.get("variants") or [])
    return {
        "resolved": len(conditions),
        "wanted": wanted_count,
        "missing": max(wanted_count - len(conditions), 0),
        "by_kind": by_kind,
        "variants": variant_count,
        "gaps": {"total": len(gaps), "by_reason": count_by_reason(gaps)},
    }
