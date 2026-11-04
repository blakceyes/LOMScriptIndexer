from __future__ import annotations

from ..model import ScriptAnalysis
from .analyzer import Analyzer, analyze
from .spec import Effect, Semantics


def analyze_task(item: tuple[Semantics, str, str]) -> tuple[str, bool, ScriptAnalysis]:
    semantics, sid, source = item
    try:
        return sid, False, analyze(sid, source, semantics)
    except Exception as exc:
        return sid, True, ScriptAnalysis(id=sid, error=f"{type(exc).__name__}: {exc}")


__all__ = ["Analyzer", "Effect", "Semantics", "analyze", "analyze_task"]
