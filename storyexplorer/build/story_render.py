from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from ..model import (
    BranchBeat,
    CheckRef,
    ChoiceBeat,
    JumpBeat,
    LoreBeat,
    MetaBeat,
    OptionCond,
    SayBeat,
    SceneBeat,
    TextRef,
)
from ..vocab import (
    BATTLE_SCENES,
    BEAT_BATTLE,
    BEAT_BRANCH,
    BEAT_CHOICE,
    BEAT_JUMP,
    BEAT_LORE,
    BEAT_META,
    BEAT_SAY,
    BEAT_SCENE,
)
from . import labels
from .wordcount import KINDS, WordCounter
from .options import OptionView, decode

RICH_MARKER = "{size"
MISSING_SAMPLE_LIMIT = 400
LORE_SAMPLE_LIMIT = 120
TITLE_PLACEHOLDERS = frozenset({"(title)", "{title}", "title", "（title）"})


def cond_to_wire(cond: OptionCond | None) -> dict[str, Any] | None:
    if cond is None:
        return None
    return {"op": cond.op, "value": cond.value}


def check_to_wire(check: CheckRef | None) -> dict[str, Any] | None:
    if check is None:
        return None
    payload: dict[str, Any] = {"kind": check.kind, "key": check.key}
    if check.result is not None:
        payload["result"] = check.result
    return payload


class Renderer:
    def __init__(self, locale: dict[str, dict[str, str]],
                 lore_fallback: dict[str, str] | None = None,
                 used: labels.NameTables | None = None,
                 stat_notes: dict[str, str] | None = None,
                 battles: Any = None) -> None:
        self.counter = WordCounter()
        self.locale = locale
        self.battles = battles
        self.battle_count = 0
        self.battle_missing = 0
        self.used = used if used is not None else {}
        self.stat_notes = stat_notes or {}
        self.lore_fallback = lore_fallback or {}
        self.story = locale.get("Story", {})
        self.chars = locale.get("Character", {})
        self.titles = locale.get("CharacterTitle", {})
        self.legend = locale.get("LegendInfo", {})
        self.missing: list[str] = []
        self.missing_count = 0
        self.option_count = 0
        self.locked_count = 0
        self.rich_count = 0
        self.think_count = 0
        self.think_named_count = 0
        self.lore_count = 0
        self.lore_fallback_count = 0
        self.lore_missing_count = 0
        self.lore_missing: list[str] = []
        self.character_ids: set[str] = set()

    def _story_text(self, key: str) -> str | None:
        text = self.story.get(key)
        if text is None:
            self.missing_count += 1
            if len(self.missing) < MISSING_SAMPLE_LIMIT:
                self.missing.append(key)
        return text

    def _ref(self, ref: TextRef | None) -> str:
        if ref is None:
            return ""
        if ref.keyed:
            text = self._story_text(ref.value)
            return text if text is not None else ref.value
        text = self.story.get(ref.value)
        if text is not None:
            return text
        return ref.value

    def _option(self, ref: TextRef) -> OptionView:
        if ref.keyed:
            return OptionView(self._ref(ref))
        return decode(ref.value, self.story)

    def _lock_text(self, ref: TextRef | None) -> str:
        if ref is None:
            return ""
        if ref.keyed:
            text = self._story_text(ref.value) if ref.value in self.story else None
        else:
            text = self.story.get(ref.value)
        if not text or len(text.strip()) <= 1:
            return ""
        self.locked_count += 1
        return text

    def render(self, beats: Sequence[object]) -> list[list[Any]]:
        out: list[list[Any]] = []
        for beat in beats:
            if isinstance(beat, SayBeat):
                out.append(self._say(beat))
            elif isinstance(beat, ChoiceBeat):
                out.append(self._choice(beat))
            elif isinstance(beat, BranchBeat):
                out.append([
                    BEAT_BRANCH,
                    check_to_wire(beat.check),
                    beat.cond,
                    beat.text,
                    self.render(beat.beats),
                    beat.group,
                ])
            elif isinstance(beat, JumpBeat):
                out.append([BEAT_JUMP, beat.target or "", beat.label or ""])
            elif isinstance(beat, MetaBeat):
                if beat.kind == "story":
                    self._lore(beat.key, out)
                    continue
                key = beat.key
                if beat.kind == "dice":
                    labels.resolve_check(beat.key, self.locale, self.used)
                elif beat.kind != "mission":
                    key = labels.resolve(labels.META_NAME_KINDS.get(beat.kind, beat.kind),
                                         beat.key, "", self.locale, self.used, self.stat_notes)
                out.append([BEAT_META, beat.kind, key, beat.value])
            elif isinstance(beat, LoreBeat):
                self._lore(beat.key, out)
            elif isinstance(beat, SceneBeat):
                if beat.name in BATTLE_SCENES and self.battles is not None:
                    card = self.battles.card(beat.name, beat.key, beat.next, beat.after)
                    if card is not None:
                        self.battle_count += 1
                        for speaker in self._battle_speakers(card):
                            self.character_ids.add(speaker)
                        out.append([BEAT_BATTLE, beat.name, beat.key, beat.next, card, beat.after])
                        continue
                    self.battle_missing += 1
                out.append([BEAT_SCENE, beat.name, beat.key, beat.next, beat.after])
        return out

    @staticmethod
    def _battle_speakers(card: dict[str, Any]) -> set[str]:
        out: set[str] = set()
        speaker = card.get("speaker")
        if isinstance(speaker, str) and speaker:
            out.add(speaker)
        for event in card.get("events") or []:
            if not isinstance(event, dict):
                continue
            for line in event.get("lines") or []:
                if not isinstance(line, dict) or line.get("kind") != "say":
                    continue
                value = line.get("speaker")
                if isinstance(value, str) and value:
                    out.add(value)
        return out

    def _say(self, beat: SayBeat) -> list[Any]:
        speaker = beat.speaker or ""
        if speaker:
            self.character_ids.add(speaker)
        text = self._ref(beat.ref)
        if RICH_MARKER in text:
            self.rich_count += 1
        if beat.mode == "think":
            self.think_count += 1
            if speaker:
                self.think_named_count += 1
        self.counter.add(beat.mode if beat.mode in KINDS else "dialog", text)
        return [BEAT_SAY, speaker, text, beat.mode]

    def _choice(self, beat: ChoiceBeat) -> list[Any]:
        branches: list[list[Any]] = []
        for option in beat.options:
            view = self._option(option.ref)
            text = view.text
            if RICH_MARKER in text:
                self.rich_count += 1
            self.option_count += 1
            self.counter.add("option", text)
            detail = None
            if view.action or view.need:
                detail = {"action": view.action, "need": [dict(item) for item in view.need]}
            branches.append([
                text,
                cond_to_wire(view.cond or option.cond),
                self.render(option.beats),
                self._lock_text(option.lock),
                detail,
            ])
        return [BEAT_CHOICE, branches]

    def _lore(self, key: str, out: list[list[Any]]) -> None:
        text = self.legend.get(key) or ""
        if not text:
            fallback = self.lore_fallback.get(key) or ""
            if fallback:
                text = fallback
                self.lore_fallback_count += 1
            else:
                self.lore_missing_count += 1
                if len(self.lore_missing) < LORE_SAMPLE_LIMIT:
                    self.lore_missing.append(key)
                return
        self.counter.add("lore", text)
        self.lore_count += 1
        out.append([BEAT_LORE, text])

    def edge_label(self, raw: str) -> str:
        if not raw:
            return ""
        pieces = [piece.strip() for piece in raw.split(" / ")]
        out = []
        for piece in pieces:
            hit = self.story.get(piece)
            out.append(hit if hit else piece)
        return " / ".join(out)

    def character_table(self) -> dict[str, str]:
        return {cid: self.chars.get(cid, cid) for cid in sorted(self.character_ids)}

    def title_table(self) -> dict[str, str]:
        out: dict[str, str] = {}
        for cid in sorted(self.character_ids):
            title = self.titles.get(cid)
            if not title:
                continue
            if title.strip().lower() in TITLE_PLACEHOLDERS:
                continue
            out[cid] = title
        return out
