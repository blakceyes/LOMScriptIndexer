from __future__ import annotations

from typing import Any

from ..vocab import COMPARE_OP_SYMBOL

SIDE_NAMES = {1: "我方", 2: "敵方"}
ENTITY_NAMES = {0: "玩家", 1: "我方", 2: "敵方", 3: "中立"}
STAT_NAMES = {
    1: "體力", 2: "內力", 3: "輕功", 4: "暗器", 5: "拳掌", 6: "刀劍",
    100: "嘴力", 101: "抗毒", 102: "抗麻", 103: "毒藥", 104: "麻痺", 105: "心相",
    106: "儒學", 107: "釋學", 108: "道學", 109: "形意", 200: "防禦", 201: "命中",
    202: "暗器命中", 203: "迴避", 204: "捅人格檔", 205: "備揍格檔", 206: "傷害減免",
    301: "暗器傷害", 302: "嘴功傷害", 303: "所有傷害", 304: "額外暗器骰",
    305: "額外武器骰", 306: "捅人傷害", 307: "絕招傷害", 401: "嘴攻機率",
    402: "捅人機率", 403: "暗器機率", 404: "備揍機率", 405: "絕招機率", 501: "命運",
}
ACTION_NAMES = {0: "無動作", 1: "嘴砲", 2: "捅人", 3: "暗器", 4: "備揍",
                5: "絕招", 6: "絕招", 7: "絕招"}
RESULT_NAMES = {0: "正常", 1: "自動攻擊", 2: "無氣力", 3: "無法動作",
                4: "行動失敗", 5: "絕對先制攻擊"}
WEAPON_NAMES = {1: "毒藥", 2: "麻痺"}
GENERIC_RESULT_FLAG = "C00000"
LOGIC_NAMES = {0: "且", 1: "或"}


def _side(value: Any) -> str:
    return SIDE_NAMES.get(value if isinstance(value, int) else 1, "我方")


def _entity(value: Any) -> str:
    return ENTITY_NAMES.get(value if isinstance(value, int) else 1, "我方")


def _stat(value: Any) -> str:
    return STAT_NAMES.get(value if isinstance(value, int) else 0, "數值")


def _compare(value: Any) -> str:
    return COMPARE_OP_SYMBOL.get(value if isinstance(value, int) else 0, "=")


def _signed(value: Any, unit: Any) -> str:
    number = value if isinstance(value, int) else 0
    text = f"{number:+d}"
    if unit == 2:
        text += "%"
    return text


def _number(value: Any, default: int = 0) -> int:
    return value if isinstance(value, int) and not isinstance(value, bool) else default


class BattleCards:
    def __init__(self, items: dict[str, Any], locale: dict[str, Any]) -> None:
        self.items = items
        self.enemy_teams = locale.get("EnemyTeam") or {}
        self.characters = locale.get("Character") or {}
        self.combat_names = locale.get("CombatCharacter") or {}
        self.talking = locale.get("CombatTalking") or {}
        self.flags = locale.get("Flag") or {}
        self.player_stats = locale.get("PlayerStat") or {}
        self.missing = 0

    def card(self, scene: str, key: str) -> dict[str, Any] | None:
        if scene not in ("Battle", "Combat") or not key:
            return None
        entry = self.items.get(f"{scene}:{key}")
        if not isinstance(entry, dict):
            self.missing += 1
            return None
        try:
            if scene == "Battle":
                return self._battle_card(entry)
            return self._combat_card(entry)
        except Exception:
            self.missing += 1
            return None

    def _team_name(self, key: Any, note: Any = "", label: Any = "") -> str:
        if not isinstance(key, str) or not key:
            for value in (note, label):
                if isinstance(value, str) and value:
                    return value
            return ""
        value = self.enemy_teams.get(key)
        if value:
            return str(value)
        for fallback in (note, label):
            if isinstance(fallback, str) and fallback:
                return fallback
        return key

    def _team_label(self, team: Any) -> str:
        if isinstance(team, dict):
            return self._team_name(team.get("id"), team.get("note"), team.get("label"))
        return self._team_name(team)

    def _combat_name(self, ident: Any) -> str:
        if not isinstance(ident, str) or not ident:
            return ""
        return str(self.combat_names.get(f"Name/{ident}")
                   or self.characters.get(ident) or ident)

    def _flag_name(self, name: Any) -> str:
        if not isinstance(name, str) or not name:
            return ""
        return str(self.flags.get(f"Name/{name}") or name)

    def _player_stat(self, name: Any) -> str:
        if not isinstance(name, str) or not name:
            return ""
        key = name[len("Player_"):].lower() if name.startswith("Player_") else name
        return str(self.player_stats.get(key) or name)

    def _talking_text(self, key: Any, fallback: Any) -> str:
        if isinstance(key, str) and key:
            text = self.talking.get(key)
            if isinstance(text, str) and text:
                return text
        return fallback if isinstance(fallback, str) else ""

    def _battle_title(self, entry: dict[str, Any]) -> str:
        name_key = entry.get("nameKey")
        if isinstance(name_key, str) and name_key:
            value = self.enemy_teams.get(name_key)
            if value:
                return str(value)
        forces = entry.get("forces") or {}
        enemy = forces.get("enemy") or {}
        teams = enemy.get("teams") or []
        names = [self._team_label(team) for team in teams]
        names = [name for name in names if name]
        if names:
            return "、".join(dict.fromkeys(names))
        return self._team_name(name_key) or "戰役"

    def _battle_card(self, entry: dict[str, Any]) -> dict[str, Any]:
        victory = entry.get("victory") or []
        goals: list[str] = []
        limit = _number(entry.get("limit"))
        if "timeout" in victory:
            goals.append(f"限時 {limit} 秒內人數不落後" if limit else "限時內人數不落後")
        if "defeat" in victory:
            goals.append("敵方全滅")
        if not goals:
            goals.append("擊敗敵方")
        chips: list[str] = []
        if "timeout" in victory and limit:
            chips.append(f"限時 {limit} 秒")
        forces = entry.get("forces") or {}
        for side in ("friend", "enemy", "neutral"):
            payload = forces.get(side) or {}
            people = _number(payload.get("people"))
            if people:
                chips.append(f"{_entity({'friend': 1, 'enemy': 2, 'neutral': 3}[side])} {people} 人")
        events: list[dict[str, Any]] = []
        for event in entry.get("events") or []:
            if not isinstance(event, dict):
                continue
            when = self._battle_when(event)
            lines = [self._battle_action(action)
                     for action in event.get("actions") or []]
            lines = [line for line in lines if line]
            if lines:
                events.append({"when": when, "lines": lines})
        card: dict[str, Any] = {
            "kind": "battle",
            "title": self._battle_title(entry),
            "goals": goals,
            "chips": chips,
            "events": events,
        }
        note = entry.get("note")
        if isinstance(note, str) and note:
            card["note"] = note
        return card

    def _battle_when(self, event: dict[str, Any]) -> str:
        triggers: list[str] = []
        second = _number(event.get("second"), -1)
        if second >= 0:
            triggers.append(f"第 {second} 秒")
        count = event.get("count")
        if isinstance(count, dict):
            triggers.append(f"{_entity(count.get('side'))} ≤ {_number(count.get('value'))} 人")
        text = " 或 ".join(triggers) or "觸發"
        condition = event.get("condition")
        if isinstance(condition, str) and condition:
            text += f" · 條件：{condition}"
        return text

    def _battle_action(self, action: Any) -> list[str] | None:
        if not isinstance(action, dict):
            return None
        kind = action.get("kind")
        if kind == "cinematic":
            return ["a", "電影橫幅：開啟" if action.get("mode") == 0 else "電影橫幅：關閉"]
        if kind == "support":
            actor = action.get("actor")
            return ["a", f"支援演出：{actor}" if actor else "支援演出"]
        if kind == "reinforcement":
            count = _number(action.get("count"), 1)
            return ["a", f"{_entity(action.get('side'))}增援 {count} 人"]
        if kind == "result":
            return ["a", "強制結算：我方勝利" if action.get("win") else "強制結算：敵方勝利"]
        text = action.get("text")
        return ["a", text] if isinstance(text, str) and text else None

    def _combat_card(self, entry: dict[str, Any]) -> dict[str, Any]:
        enemy = entry.get("enemy") or {}
        title = self._combat_name(enemy.get("id")) or "決鬥"
        goals: list[str] = ["擊敗對手"]
        if entry.get("deadEnd"):
            goals.append("落敗即死亡結局")
        goals.extend(self._flag_goals(entry.get("win"), "勝利"))
        goals.extend(self._flag_goals(entry.get("lose"), "失敗"))
        chips: list[str] = []
        hp = _number(enemy.get("hp"))
        if hp:
            chips.append(f"體力 {hp}")
        stamina = _number(enemy.get("stamina"))
        if stamina:
            chips.append(f"氣力 {stamina}")
        events: list[dict[str, Any]] = []
        payload = entry.get("events") or {}
        init = payload.get("init") or []
        if init:
            lines = self._action_lines(init, title)
            if lines:
                events.append({"when": "開場", "lines": lines})
        for rule in payload.get("rules") or []:
            if not isinstance(rule, dict):
                continue
            actions = list(rule.get("actions") or [])
            actions.extend(rule.get("after") or [])
            actions.extend(rule.get("result") or [])
            lines = self._action_lines(actions, title)
            if not lines:
                continue
            events.append({"when": self._rule_when(rule), "lines": lines})
        card: dict[str, Any] = {
            "kind": "combat",
            "title": title,
            "goals": goals,
            "chips": chips,
            "events": events,
        }
        note = entry.get("desc") or enemy.get("note")
        if isinstance(note, str) and note:
            card["note"] = note
        return card

    def _flag_goals(self, flags: Any, prefix: str) -> list[str]:
        out: list[str] = []
        if not isinstance(flags, list):
            return out
        for item in flags:
            if not isinstance(item, dict):
                continue
            name = item.get("flag")
            if not isinstance(name, str) or not name or name == GENERIC_RESULT_FLAG:
                continue
            label = self.flags.get(f"Name/{name}")
            if not label:
                continue
            out.append(f"{prefix}：{label} = {_number(item.get('state'))}")
        return out

    def _rule_when(self, rule: dict[str, Any]) -> str:
        parts = [self._condition_text(item) for item in rule.get("conditions") or []]
        parts = [part for part in parts if part]
        if not parts:
            return "事件"
        joiner = LOGIC_NAMES.get(_number(rule.get("logic")), "且")
        return f" {joiner} ".join(parts)

    def _condition_text(self, condition: Any) -> str:
        if not isinstance(condition, dict):
            return ""
        kind = condition.get("kind")
        if kind == "round":
            op = condition.get("op")
            value = _number(condition.get("value"))
            return f"第 {value} 回合" if op == 0 else f"回合數 {_compare(op)} {value}"
        if kind == "stat":
            return (f"{_side(condition.get('side'))} {_stat(condition.get('stat'))}"
                    f" {_compare(condition.get('op'))} {_number(condition.get('value'))}")
        if kind == "playerStat":
            label = condition.get("stat")
            text = self._player_stat(label) if condition.get("check") == 1 else str(label or "")
            return f"{text} {_compare(condition.get('op'))} {_number(condition.get('value'))}".strip()
        if kind == "flag":
            return (f"旗標 {self._flag_name(condition.get('flag'))}"
                    f" {_compare(condition.get('op'))} {_number(condition.get('value'))}")
        if kind == "roundFlag":
            return (f"當前回合 {_compare(condition.get('op'))}"
                    f" {self._flag_name(condition.get('flag'))}")
        if kind == "effectState":
            effect = condition.get("effect") or {}
            label = effect.get("desc") or effect.get("key") or effect.get("name") or "狀態"
            return f"{_side(condition.get('side'))} 狀態：{label}"
        if kind == "actionResult":
            result = RESULT_NAMES.get(_number(condition.get("result")), "行動結果")
            return f"{_side(condition.get('side'))} 行動結果：{result}"
        if kind == "actionType":
            types = [_number(item) for item in condition.get("types") or []]
            names = "、".join(dict.fromkeys(
                ACTION_NAMES.get(item, "行動") for item in types)) or "行動"
            text = f"{_side(condition.get('side'))} 行動：{names}"
            if condition.get("checkSuccess"):
                text += "成功" if condition.get("success") else "失敗"
            return text
        if kind == "block":
            return f"{_side(condition.get('side'))} 格擋反擊"
        text = condition.get("text")
        return text if isinstance(text, str) else ""

    def _action_lines(self, actions: list[Any], enemy: str) -> list[list[str]]:
        lines: list[list[str]] = []
        for action in actions:
            lines.extend(self._action_line(action, enemy))
        return lines

    def _action_line(self, action: Any, enemy: str) -> list[list[str]]:
        if not isinstance(action, dict):
            return []
        kind = action.get("kind")
        if kind == "dialog":
            return self._dialog_lines(action, enemy)
        if kind == "script":
            name = action.get("name")
            return [["j", "", name]] if isinstance(name, str) and name else []
        if kind == "flag":
            return [["a", f"旗標 {self._flag_name(action.get('flag'))}"
                          f" = {_number(action.get('state'))}"]]
        if kind == "stat":
            return [["a", f"{_side(action.get('side'))} {_stat(action.get('stat'))}"
                          f" {_signed(action.get('value'), action.get('unit'))}"]]
        if kind == "weapon":
            name = WEAPON_NAMES.get(_number(action.get("stat")), "累積值")
            return [["a", f"{_side(action.get('side'))} {name}"
                          f" {_signed(action.get('value'), action.get('unit'))}"]]
        if kind == "effect":
            effect = action.get("effect") or {}
            label = effect.get("desc") or effect.get("key") or effect.get("name") or "狀態"
            return [["a", f"{_side(action.get('side'))} 獲得狀態：{label}"]]
        if kind == "clearEffects":
            return [["a", f"{_side(action.get('side'))} 移除所有狀態"]]
        if kind == "clearSupport":
            return [["a", f"{_side(action.get('side'))} 移除所有支援"]]
        if kind == "support":
            support = action.get("support")
            return [["a", f"{_side(action.get('side'))} 支援打擊"
                          + (f"：{support}" if support else "")]]
        if kind == "vfx":
            return [["a", f"{_side(action.get('side'))} 特效"]]
        if kind == "image":
            return [["a", "顯示畫面" if action.get("show") else "隱藏畫面"]]
        if kind == "scene":
            scene = action.get("scene")
            return [["a", f"切換場景 {scene}" if scene else "切換場景"]]
        if kind == "crazy":
            return [["a", f"{_side(action.get('side'))} 自動行動"]]
        if kind == "flagRound":
            return [["a", f"記錄回合：{self._flag_name(action.get('flag'))}"]]
        if kind == "reduceEffect":
            effect = action.get("effect") or {}
            label = effect.get("desc") or effect.get("key") or effect.get("name") or "狀態"
            return [["a", f"{_side(action.get('side'))} 減少 {label}"
                          f" {_number(action.get('amount'))}"]]
        if kind == "relationship":
            return [["a", f"{_side(action.get('side'))} 好感度攻擊"]]
        text = action.get("text")
        return [["a", text]] if isinstance(text, str) and text else []

    def _dialog_lines(self, action: dict[str, Any], enemy: str) -> list[list[str]]:
        lines: list[list[str]] = []
        for item in action.get("lines") or []:
            if not isinstance(item, dict):
                continue
            side = _number(item.get("side"), 1)
            text = self._talking_text(item.get("key"), item.get("text"))
            if not text:
                continue
            if side == 9:
                lines.append(["n", "", text])
                continue
            if side in (1, 2):
                speaker = self._combat_name("player")
            elif side in (3, 4):
                speaker = enemy
            else:
                speaker = self._combat_name(item.get("id")) or "旁人"
            think = side in (2, 4, 6, 8)
            lines.append(["t" if think else "s", speaker, text])
        return lines
