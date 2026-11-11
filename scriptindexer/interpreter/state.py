from copy import deepcopy
from dataclasses import dataclass, field
from typing import Any

from .. import lua
from ..script_model import CharRef, CheckMark, PortraitRef, Requirement, TextRef


@dataclass(frozen=True)
class OptionDraft:
    ref: TextRef
    requirement: Requirement | None = None
    lock: TextRef | None = None
    condition: dict[str, Any] | None = None


@dataclass
class ChoiceDraft:
    index: int
    result_var: str = ""
    options: list[OptionDraft] = field(default_factory=list)


@dataclass
class EvalState:
    speaker: str | None = None
    dialog_style: str = ""
    is_think: bool = False
    env: dict[str, Any] = field(default_factory=dict)
    menu_options: list[OptionDraft] = field(default_factory=list)
    pending_story_script: str | None = None

    portraits: dict[str, PortraitRef | None] = field(default_factory=dict)
    portrait_dirty: set[str] = field(default_factory=set)
    portrait_revisions: dict[str, int] = field(default_factory=dict)

    def set_portrait(self, character: str, portrait: PortraitRef | None) -> None:
        if not character:
            return
        if character not in self.portraits or self.portraits[character] != portrait:
            self.portraits[character] = portrait
            self.portrait_dirty.add(character)
            self.portrait_revisions[character] = self.portrait_revisions.get(character, 0) + 1

    def reset_portraits(self) -> None:
        self.portrait_dirty.update(self.portraits)
        for character in self.portraits:
            self.portrait_revisions[character] = self.portrait_revisions.get(character, 0) + 1
        self.portraits.clear()

    def merge_visuals(self, branches: list[EvalState]) -> None:
        # Only a unanimous result is valid after mutually exclusive paths join.
        for name in ("speaker", "dialog_style", "is_think"):
            values = [getattr(branch, name) for branch in branches]
            fallback = None if name == "speaker" else (False if name == "is_think" else "")
            setattr(self, name, values[0] if all(v == values[0] for v in values) else fallback)
        keys = set().union(*(branch.portraits for branch in branches))
        self.portrait_revisions = {
            key: max(branch.portrait_revisions.get(key, 0) for branch in branches)
            for key in set().union(*(branch.portrait_revisions for branch in branches))
        }
        self.portraits = {}
        self.portrait_dirty = set().union(*(branch.portrait_dirty for branch in branches))
        for key in keys:
            values = [branch.portraits.get(key) for branch in branches]
            self.portraits[key] = values[0] if all(v == values[0] for v in values) else None
            if any(v != values[0] for v in values):
                self.portrait_dirty.add(key)

    def clone(self) -> EvalState:
        return EvalState(
            speaker=self.speaker,
            dialog_style=self.dialog_style,
            is_think=self.is_think,
            env=deepcopy(self.env),
            menu_options=list(self.menu_options),
            pending_story_script=self.pending_story_script,
            portraits=dict(self.portraits),
            portrait_dirty=set(self.portrait_dirty),
            portrait_revisions=dict(self.portrait_revisions),
        )


def unwrap_text(value: Any) -> str | None:
    if isinstance(value, str):
        return value
    if isinstance(value, TextRef):
        return value.text
    if isinstance(value, CharRef):
        return value.id
    if isinstance(value, CheckMark):
        return value.key
    return None


def source_snippet(expr: lua.Node, limit: int = 120) -> str:
    text = lua.render_source(expr)
    return text if len(text) <= limit else text[: limit - 1] + "…"


def number_text(value: Any) -> str:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return str(value)
    if number.is_integer():
        return str(int(number))
    return f"{number:g}"


def lua_key_sort_key(value: str) -> tuple[int, int | str]:
    try:
        return (0, int(value))
    except ValueError:
        return (1, value)
