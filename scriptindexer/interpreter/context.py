from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from ..script_model import Edge, ScriptAnalysis


@dataclass
class AnalysisContext:
    id: str
    beats: list[Any] = field(default_factory=list)
    edges: list[Edge] = field(default_factory=list)
    checks: dict[str, set[str]] = field(default_factory=dict)
    positions: set[str] = field(default_factory=set)
    lore_keys: set[str] = field(default_factory=set)
    unresolved_jumps: list[str] = field(default_factory=list)
    time: int | None = None
    say_count: int = 0
    scene_count: int = 0
    branch_seq: int = 0
    edge_keys: set[tuple[str, str, str]] = field(default_factory=set)

    def add_edge(self, target: str, kind: str, label: str) -> None:
        key = (target, kind, label)
        if key in self.edge_keys:
            return
        self.edge_keys.add(key)
        self.edges.append(Edge(self.id, target, kind, label))

    def add_check(self, kind: str, key: str) -> None:
        if not key:
            return
        self.checks.setdefault(key, set()).add(kind)

    def add_position(self, key: str) -> None:
        if key:
            self.positions.add(key)

    def add_lore_key(self, key: str) -> None:
        if key:
            self.lore_keys.add(key)

    def set_time(self, rounds: int | None) -> None:
        if rounds is not None and self.time is None:
            self.time = rounds

    def snapshot(self) -> ScriptAnalysis:
        return ScriptAnalysis(
            id=self.id,
            beats=[beat for beat in self.beats if beat is not None],
            edges=list(self.edges),
            checks={key: tuple(sorted(kinds)) for key, kinds in sorted(self.checks.items())},
            positions=tuple(sorted(self.positions)),
            lore_keys=tuple(sorted(self.lore_keys)),
            unresolved_jumps=list(self.unresolved_jumps),
            time=self.time,
            say_count=self.say_count,
            scene_count=self.scene_count,
        )
