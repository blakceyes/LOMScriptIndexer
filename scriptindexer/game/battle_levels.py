from __future__ import annotations

import time
from pathlib import Path
from typing import Any

from ..console import Reporter
from .assets import AssetSession
from .reading import collapse_text, dict_ref, to_int
from .schema import (
    BATTLE_ACTION_CLASS,
    BATTLE_CLASS,
    BATTLE_PREFIX,
    COMBAT_ACTION_CLASS,
    COMBAT_CLASS,
    COMBAT_CONDITION_CLASS,
    COMBAT_PREFIX,
)

BATTLE = "battle"
COMBAT = "combat"
THIRD_PARTY_SIDES = frozenset({5, 6, 7, 8})
TEAM_PEOPLE_MIN = 20
TEAM_PEOPLE_MAX = 100


class RefCache:
    def __init__(self, session: AssetSession) -> None:
        self.session = session
        self.failures = 0
        self._items: dict[tuple[str, int, int], dict[str, Any] | None] = {}

    def read(self, path: Path, ref: Any) -> dict[str, Any] | None:
        data = dict_ref(ref)
        if data is None:
            return None
        key = (str(path), to_int(data.get("m_FileID")), to_int(data.get("m_PathID")))
        if key in self._items:
            return self._items[key]
        value = None
        try:
            hit = self.session.resolve(path, data)
        except Exception:
            hit = None
        if hit is not None:
            obj, scope = hit
            tree: dict[str, Any] | None = None
            try:
                tree = self.session.tree(scope.path, obj)
            except Exception:
                tree = None
            if not isinstance(tree, dict):
                tree = None
            value = {
                "tree": tree,
                "name": self.session.name(obj),
                "class": self.session.class_name(scope.path, obj),
                "path": scope.path,
            }
        else:
            self.failures += 1
        self._items[key] = value
        return value


def _class_suffix(name: str, prefix: str) -> str:
    return name[len(prefix):] if name.startswith(prefix) else ""


def _stat_value(reader: RefCache, path: Path, ref: Any) -> int:
    hit = reader.read(path, ref)
    if hit is None or hit["tree"] is None:
        return 0
    tree = hit["tree"]
    value = to_int(tree.get("_value"))
    low = to_int(tree.get("_min"))
    high = to_int(tree.get("_max"), 100) + to_int(tree.get("_limitAddition"))
    if high < low:
        high = low
    return max(low, min(value, high))


def _team_label(name: str, ident: str) -> str:
    for prefix in (f"Enemy_{ident}_", f"Neutral_{ident}_", f"Player_{ident}_",
                   "Enemy_", "Neutral_"):
        if name.startswith(prefix):
            return name[len(prefix):]
    return ""


def _team(reader: RefCache, path: Path, ref: Any) -> dict[str, Any] | None:
    hit = reader.read(path, ref)
    if hit is None or hit["tree"] is None:
        return None
    tree = hit["tree"]
    ident = collapse_text(tree.get("_id"))
    people = _stat_value(reader, hit["path"], tree.get("_people"))
    team = _stat_value(reader, hit["path"], tree.get("_team"))
    return {
        "id": ident,
        "note": collapse_text(tree.get("_desc")),
        "label": _team_label(hit["name"], ident),
        "people": people,
        "team": team,
    }


def _teams(reader: RefCache, path: Path, refs: Any) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    if not isinstance(refs, list):
        return out
    for ref in refs:
        hit = reader.read(path, ref)
        if hit is None or hit["tree"] is None:
            continue
        team = _team(reader, hit["path"], hit["tree"].get("_teamStat"))
        if team is not None:
            out.append(team)
    return out


def _team_total(teams: list[dict[str, Any]]) -> int:
    total = 0
    for team in teams:
        if team["people"] <= 0 or team["team"] <= 0:
            continue
        count = round(team["people"] * team["team"] / 100)
        total += max(TEAM_PEOPLE_MIN, min(TEAM_PEOPLE_MAX, count))
    return total


def _forces(reader: RefCache, path: Path, tree: dict[str, Any]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for side, use_field, people_field, config_field in (
        ("friend", "_friendUsePeople", "_friendPeople", "_friendConfig"),
        ("enemy", "_enemyUsePeople", "_enemyPeople", "_enemyConfig"),
        ("neutral", "_neutralUsePeople", "_neutralPeople", "_neutralConfig"),
    ):
        payload: dict[str, Any] = {}
        if to_int(tree.get(use_field)):
            payload["people"] = to_int(tree.get(people_field))
        elif side == "neutral":
            payload["people"] = to_int(tree.get(people_field))
        teams = _teams(reader, path, tree.get(config_field))
        labels = [
            {"id": team["id"], "note": team["note"], "label": team["label"]}
            for team in teams if team["id"]
        ]
        if labels:
            payload["teams"] = labels
            if not payload.get("people"):
                total = _team_total(teams)
                if total:
                    payload["people"] = total
        if payload.get("people") or payload.get("teams"):
            out[side] = payload
    return out


def _battle_action(reader: RefCache, path: Path, ref: Any) -> dict[str, Any] | None:
    hit = reader.read(path, ref)
    if hit is None:
        return None
    tree = hit["tree"] or {}
    name = _class_suffix(hit["class"], BATTLE_ACTION_CLASS)
    if name == "Cinematic":
        return {"kind": "cinematic", "mode": to_int(tree.get("_mode"))}
    if name == "CallSupport":
        actor = reader.read(hit["path"], tree.get("_actorPrefab"))
        label = (actor or {}).get("name") or hit["name"]
        return {"kind": "support", "actor": label}
    if name == "SpawnReinforcement":
        return {
            "kind": "reinforcement",
            "side": to_int(tree.get("_team")),
            "count": to_int(tree.get("_count"), 1),
        }
    if name == "FlashGameOver":
        return {"kind": "result", "win": to_int(tree.get("_result")) == 0}
    return {"kind": "label", "text": hit["name"]}


def _battle_event(reader: RefCache, path: Path, ref: Any) -> dict[str, Any] | None:
    hit = reader.read(path, ref)
    if hit is None or hit["tree"] is None:
        return None
    tree = hit["tree"]
    event: dict[str, Any] = {}
    if to_int(tree.get("_checkTriggerSecond")):
        event["second"] = to_int(tree.get("_triggerSecond"))
    if to_int(tree.get("_checkCountThreshold")):
        event["count"] = {
            "side": to_int(tree.get("_thresholdTeam")),
            "value": to_int(tree.get("_countThreshold")),
        }
    if to_int(tree.get("_checkCondition")):
        condition = reader.read(hit["path"], tree.get("_condition"))
        if condition is not None:
            note = collapse_text((condition["tree"] or {}).get("_devNote"))
            event["condition"] = note or condition["name"]
    actions = [
        action for action in (
            _battle_action(reader, hit["path"], item)
            for item in tree.get("_actions") or [])
        if action is not None
    ]
    if actions:
        event["actions"] = actions
    if not event:
        return None
    return event


def _battle_level(reader: RefCache, path: Path, tree: dict[str, Any]) -> dict[str, Any]:
    entry: dict[str, Any] = {"kind": BATTLE}
    name_key = collapse_text(tree.get("_nameKey"))
    if name_key:
        entry["nameKey"] = name_key
    note = collapse_text(tree.get("_enemyNote"))
    if note:
        entry["note"] = note
    victory: list[str] = []
    if to_int(tree.get("_victoryTimeout")):
        victory.append("timeout")
        entry["limit"] = to_int(tree.get("_time"))
    if to_int(tree.get("_victoryDefeat")):
        victory.append("defeat")
    if victory:
        entry["victory"] = victory
    forces = _forces(reader, path, tree)
    if forces:
        entry["forces"] = forces
    events = [
        event for event in (
            _battle_event(reader, path, ref)
            for ref in tree.get("_events") or [])
        if event is not None
    ]
    if events:
        entry["events"] = events
    return entry


def _flag_name(reader: RefCache, path: Path, ref: Any) -> str:
    hit = reader.read(path, ref)
    if hit is None:
        return ""
    return hit["name"]


def _effect(reader: RefCache, path: Path, ref: Any) -> dict[str, Any] | None:
    hit = reader.read(path, ref)
    if hit is None or hit["tree"] is None:
        return None
    tree = hit["tree"]
    return {
        "name": hit["name"],
        "key": collapse_text(tree.get("_key")),
        "desc": collapse_text(tree.get("_desc")),
    }


def _dialog_lines(reader: RefCache, path: Path, tree: dict[str, Any]) -> list[dict[str, Any]]:
    lines: list[dict[str, Any]] = []
    for item in tree.get("_dialogs") or []:
        if not isinstance(item, dict):
            continue
        side = to_int(item.get("_character"), 1)
        character = ""
        if side in THIRD_PARTY_SIDES:
            mapping = reader.read(path, item.get("_characterKey"))
            if mapping is not None and mapping["tree"] is not None:
                character = collapse_text(mapping["tree"].get("Value")) or collapse_text(
                    mapping["tree"].get("Key"))
        lines.append({
            "side": side,
            "id": character,
            "key": collapse_text(item.get("_key")),
            "text": collapse_text(item.get("_text")),
        })
    return lines


def _combat_action(reader: RefCache, path: Path, ref: Any) -> dict[str, Any] | None:
    hit = reader.read(path, ref)
    if hit is None:
        return None
    tree = hit["tree"] or {}
    name = _class_suffix(hit["class"], COMBAT_ACTION_CLASS)
    base = hit["path"]
    if name == "Dialog":
        return {"kind": "dialog", "lines": _dialog_lines(reader, base, tree)}
    if name == "SetStoryScript":
        script = collapse_text(tree.get("_name"))
        return {"kind": "script", "name": script} if script else None
    if name == "ModifyFlag":
        flag = _flag_name(reader, base, tree.get("_flag"))
        return {"kind": "flag", "flag": flag, "state": to_int(tree.get("_state"))}
    if name == "ModifyStat":
        return {
            "kind": "stat",
            "side": to_int(tree.get("_character"), 1),
            "stat": to_int(tree.get("_type"), 1),
            "unit": to_int(tree.get("_valueType"), 1),
            "value": to_int(tree.get("_value")),
        }
    if name == "ModifyWeaponValue":
        return {
            "kind": "weapon",
            "side": to_int(tree.get("_character"), 1),
            "stat": to_int(tree.get("_type"), 1),
            "unit": to_int(tree.get("_valueType"), 1),
            "value": to_int(tree.get("_value")),
        }
    if name == "StateEffect":
        return {
            "kind": "effect",
            "side": to_int(tree.get("_character"), 1),
            "mode": to_int(tree.get("_type"), 1),
            "effect": _effect(reader, base, tree.get("_effect")),
        }
    if name == "RemoveAllStateEffect":
        return {"kind": "clearEffects", "side": to_int(tree.get("_character"), 1)}
    if name == "RemoveAllSupport":
        return {"kind": "clearSupport", "side": to_int(tree.get("_character"), 1)}
    if name == "PunchSupport":
        support = reader.read(base, tree.get("_support"))
        return {
            "kind": "support",
            "side": to_int(tree.get("_character"), 1),
            "support": (support or {}).get("name", ""),
        }
    if name == "VFX":
        return {"kind": "vfx", "side": to_int(tree.get("_character"), 1)}
    if name in ("ShowImage", "HideImage"):
        return {"kind": "image", "show": name == "ShowImage"}
    if name == "LoadScene":
        return {
            "kind": "scene",
            "mode": to_int(tree.get("_type")),
            "scene": collapse_text(tree.get("_sceneName")),
        }
    if name == "CrazyMode":
        return {
            "kind": "crazy",
            "side": to_int(tree.get("_character"), 1),
            "mode": to_int(tree.get("_mode")),
        }
    if name == "FlagRound":
        flag = _flag_name(reader, base, tree.get("_flag"))
        return {"kind": "flagRound", "flag": flag, "add": to_int(tree.get("_add"))}
    if name == "ReduceEffectCount":
        effect = _effect(reader, base, tree.get("_effect"))
        return {
            "kind": "reduceEffect",
            "side": to_int(tree.get("_character"), 1),
            "effect": effect,
            "amount": to_int(tree.get("_amount")),
        }
    if name == "RelationshipAttack":
        relationship = reader.read(base, tree.get("_relationshipData"))
        return {
            "kind": "relationship",
            "side": to_int(tree.get("_character"), 1),
            "count": to_int(tree.get("_attackCount")),
            "key": relationship["name"] if relationship is not None else "",
        }
    if name in ("Count", "Debug"):
        return {"kind": "label", "text": hit["name"]}
    return {"kind": "label", "text": hit["name"]}


def _value_label(reader: RefCache, path: Path, ref: Any, check: int) -> str:
    if check == 0:
        constant = to_int(ref.get("_constant"))
        return str(constant)
    field = {1: "_stat", 2: "_relationship", 3: "_flag"}.get(check)
    if field is None:
        return ""
    hit = reader.read(path, ref.get(field))
    return hit["name"] if hit is not None else ""


def _combat_condition(reader: RefCache, path: Path, ref: Any) -> dict[str, Any] | None:
    hit = reader.read(path, ref)
    if hit is None:
        return None
    tree = hit["tree"] or {}
    name = _class_suffix(hit["class"], COMBAT_CONDITION_CLASS)
    if name == "Round":
        return {"kind": "round", "op": to_int(tree.get("_op")), "value": to_int(tree.get("_round"))}
    if name == "Stat":
        return {
            "kind": "stat",
            "side": to_int(tree.get("_character"), 1),
            "stat": to_int(tree.get("_type"), 1),
            "op": to_int(tree.get("_op")),
            "value": to_int(tree.get("_value")),
        }
    if name == "PlayerStat":
        value_ref = tree.get("_stat") if isinstance(tree.get("_stat"), dict) else {}
        check = to_int(value_ref.get("_checkType"), 1)
        return {
            "kind": "playerStat",
            "check": check,
            "stat": _value_label(reader, hit["path"], value_ref, check),
            "op": to_int(tree.get("_op")),
            "value": to_int(tree.get("_value")),
        }
    if name == "Flag":
        return {
            "kind": "flag",
            "flag": _flag_name(reader, hit["path"], tree.get("_flagData")),
            "op": to_int(tree.get("_op")),
            "value": to_int(tree.get("_value")),
        }
    if name == "RoundFlag":
        return {
            "kind": "roundFlag",
            "flag": _flag_name(reader, hit["path"], tree.get("_flagData")),
            "op": to_int(tree.get("_op")),
        }
    if name == "EffectState":
        return {
            "kind": "effectState",
            "side": to_int(tree.get("_character"), 1),
            "effect": _effect(reader, hit["path"], tree.get("_effectState")),
        }
    if name == "ActionResult":
        return {
            "kind": "actionResult",
            "side": to_int(tree.get("_character"), 1),
            "result": to_int(tree.get("_type")),
        }
    if name == "ActionType":
        types = [to_int(item) for item in tree.get("_typeList") or [] if isinstance(item, int)]
        return {
            "kind": "actionType",
            "side": to_int(tree.get("_character"), 1),
            "types": types,
            "checkSuccess": to_int(tree.get("_checkSuccess")),
            "success": to_int(tree.get("_success")),
            "checkHit": to_int(tree.get("_checkHit")),
            "hit": to_int(tree.get("_hit")),
        }
    if name == "BlockCounterAttack":
        return {
            "kind": "block",
            "side": to_int(tree.get("_character"), 1),
            "attack": to_int(tree.get("_attackActionType")),
            "result": to_int(tree.get("_blockResult")),
        }
    return {"kind": "label", "text": hit["name"]}


def _actions(reader: RefCache, path: Path, refs: Any) -> list[dict[str, Any]]:
    if not isinstance(refs, list):
        return []
    return [
        action for action in (
            _combat_action(reader, path, ref) for ref in refs)
        if action is not None
    ]


def _conditions(reader: RefCache, path: Path, refs: Any) -> list[dict[str, Any]]:
    if not isinstance(refs, list):
        return []
    return [
        condition for condition in (
            _combat_condition(reader, path, ref) for ref in refs)
        if condition is not None
    ]


def _combat_rule(reader: RefCache, path: Path, ref: Any) -> dict[str, Any] | None:
    hit = reader.read(path, ref)
    if hit is None or hit["tree"] is None:
        return None
    tree = hit["tree"]
    base = hit["path"]
    rule: dict[str, Any] = {"logic": to_int(tree.get("_logic"))}
    conditions = _conditions(reader, base, tree.get("_conditions"))
    if conditions:
        rule["conditions"] = conditions
    actions = _actions(reader, base, tree.get("_actions"))
    if actions:
        rule["actions"] = actions
    after = _actions(reader, base, tree.get("_afterActions"))
    if after:
        rule["after"] = after
    result = _actions(reader, base, tree.get("_afterResult"))
    if result:
        rule["result"] = result
    return rule if len(rule) > 1 else None


def _flag_entries(reader: RefCache, path: Path, items: Any) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    if not isinstance(items, list):
        return out
    for item in items:
        if not isinstance(item, dict):
            continue
        flag = _flag_name(reader, path, item.get("_flag"))
        if flag:
            out.append({"flag": flag, "state": to_int(item.get("_state"))})
    return out


def _condition_flags(reader: RefCache, path: Path, items: Any) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    if not isinstance(items, list):
        return out
    for item in items:
        if not isinstance(item, dict):
            continue
        flags = _flag_entries(reader, path, item.get("_flags"))
        if not flags:
            continue
        out.append({
            "logic": to_int(item.get("_logic")),
            "conditions": _conditions(reader, path, item.get("_conditions")),
            "flags": flags,
        })
    return out


def _combat_events(reader: RefCache, path: Path, refs: Any) -> dict[str, Any]:
    init: list[dict[str, Any]] = []
    rules: list[dict[str, Any]] = []
    if not isinstance(refs, list):
        return {}
    for ref in refs:
        hit = reader.read(path, ref)
        if hit is None or hit["tree"] is None:
            continue
        tree = hit["tree"]
        base = hit["path"]
        init.extend(_actions(reader, base, tree.get("_initAction")))
        for item in tree.get("_conditionAction") or []:
            rule = _combat_rule(reader, base, item)
            if rule is not None:
                rules.append(rule)
    payload: dict[str, Any] = {}
    if init:
        payload["init"] = init
    if rules:
        payload["rules"] = rules
    return payload


def _combat_level(reader: RefCache, path: Path, tree: dict[str, Any]) -> dict[str, Any]:
    entry: dict[str, Any] = {"kind": COMBAT}
    desc = collapse_text(tree.get("_desc"))
    if desc:
        entry["desc"] = desc
    if to_int(tree.get("_deadEnd")):
        entry["deadEnd"] = True
    enemy = reader.read(path, tree.get("_enemyStat"))
    if enemy is not None and enemy["tree"] is not None:
        stat = enemy["tree"]
        payload: dict[str, Any] = {}
        name = collapse_text(stat.get("Name"))
        if name:
            payload["id"] = name
        hp = to_int(stat.get("MaxHealth"))
        if hp:
            payload["hp"] = hp
        stamina = to_int(stat.get("DefaultStamina"))
        if stamina:
            payload["stamina"] = stamina
        note = collapse_text(stat.get("_note"))
        if note:
            payload["note"] = note
        if payload:
            entry["enemy"] = payload
    win = _flag_entries(reader, path, tree.get("_winResult"))
    if win:
        entry["win"] = win
    lose = _flag_entries(reader, path, tree.get("_loseResult"))
    if lose:
        entry["lose"] = lose
    conditions = _condition_flags(reader, path, tree.get("_conditionResult"))
    if conditions:
        entry["condition"] = conditions
    events = _combat_events(reader, path, tree.get("Events"))
    if events:
        entry["events"] = events
    return entry


def extract(session: AssetSession,
            reporter: Reporter) -> tuple[dict[str, dict[str, Any]], dict[str, Any]]:
    started = time.time()
    warnings = session.warnings
    reader = RefCache(session)
    items: dict[str, dict[str, Any]] = {}
    failed = 0
    duplicates = 0
    for path, obj, cls in session.iter_class({BATTLE_CLASS, COMBAT_CLASS}):
        name = session.name(obj)
        if cls == BATTLE_CLASS:
            kind, prefix, scene = BATTLE, BATTLE_PREFIX, "Battle"
        else:
            kind, prefix, scene = COMBAT, COMBAT_PREFIX, "Combat"
        if not name.startswith(prefix):
            failed += 1
            continue
        key = name[len(prefix):]
        ident = f"{scene}:{key}"
        if ident in items:
            duplicates += 1
            continue
        tree = session.tree(path, obj)
        if not isinstance(tree, dict):
            failed += 1
            continue
        if kind == BATTLE:
            entry = _battle_level(reader, path, tree)
        else:
            entry = _combat_level(reader, path, tree)
        entry["key"] = key
        items[ident] = entry
    elapsed = round(time.time() - started, 1)
    stats = summarize(items, elapsed)
    stats["failed"] = failed
    stats["duplicates"] = duplicates
    stats["unresolved_refs"] = reader.failures
    reporter.info(
        f"battle levels: {stats['levels']} ({stats['by_kind']}),"
        f" {stats['events']} events, {stats['actions']} actions, {elapsed}s"
    )
    if failed or reader.failures:
        reporter.info(
            f"battle levels: {failed} unreadable assets,"
            f" {reader.failures} unresolved references")
    if session.warnings > warnings:
        reporter.warn(f"battle levels: {session.warnings - warnings} read warnings")
    return dict(sorted(items.items())), stats


def summarize(items: dict[str, dict[str, Any]], elapsed: float) -> dict[str, Any]:
    by_kind: dict[str, int] = {}
    events = 0
    actions = 0
    for entry in items.values():
        kind = str(entry.get("kind") or "")
        by_kind[kind] = by_kind.get(kind, 0) + 1
        if kind == BATTLE:
            for event in entry.get("events") or []:
                events += 1
                actions += len(event.get("actions") or [])
            continue
        payload = entry.get("events") or {}
        init = payload.get("init") or []
        if init:
            events += 1
            actions += len(init)
        for rule in payload.get("rules") or []:
            events += 1
            actions += len(rule.get("actions") or [])
            actions += len(rule.get("after") or [])
            actions += len(rule.get("result") or [])
    return {
        "levels": len(items),
        "by_kind": by_kind,
        "events": events,
        "actions": actions,
        "elapsed": round(elapsed, 1),
    }
