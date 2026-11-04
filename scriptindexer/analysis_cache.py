from __future__ import annotations

import hashlib
import os
import time
from concurrent.futures import ProcessPoolExecutor
from typing import Any

from . import interpreter
from .cache import load_pickle_stamp, save_pickle_stamp
from .console import Reporter
from .game.lua_bindings import LUA_BINDINGS
from .paths import ANALYSIS_CACHE_PATH
from .script_model import ScriptAnalysis
from .versions import INTERPRETER_VERSION

STAGE_ANALYSIS = "semantic analysis"


def default_jobs() -> int:
    cores = os.cpu_count() or 1
    return max(1, min(cores // 2, 4))


def _run_pending(jobs: list[interpreter.AnalyzeJob], workers: int,
                 reporter: Reporter) -> list[interpreter.AnalysisOutcome]:
    if workers <= 1 or len(jobs) < max(8, workers * 2):
        return [interpreter.analyze_job(job) for job in jobs]
    chunk = max(1, len(jobs) // (workers * 8))
    try:
        with ProcessPoolExecutor(max_workers=min(workers, len(jobs))) as pool:
            return list(pool.map(interpreter.analyze_job, jobs, chunksize=chunk))
    except Exception as exc:
        reporter.warn(f"parallel analysis unavailable, falling back to serial: {exc}")
        return [interpreter.analyze_job(job) for job in jobs]


def _signature(source: str) -> str:
    return hashlib.blake2b(source.encode("utf-8"), digest_size=8).hexdigest()


def analyze_all(sources: dict[str, str], use_cache: bool,
                reporter: Reporter, jobs: int | None = None,
                ) -> tuple[dict[str, ScriptAnalysis], int, int]:
    reporter.stage(STAGE_ANALYSIS)
    cached = load_pickle_stamp(ANALYSIS_CACHE_PATH, INTERPRETER_VERSION) if use_cache else None
    cache_entries: dict[str, Any] = cached if isinstance(cached, dict) else {}
    analyses: dict[str, ScriptAnalysis] = {}
    signatures: dict[str, str] = {}
    pending: list[interpreter.AnalyzeJob] = []
    reused = 0
    failed = 0
    started = time.time()
    for sid, source in sorted(sources.items()):
        signature = _signature(source)
        cached_entry = cache_entries.get(sid)
        if isinstance(cached_entry, dict) and cached_entry.get("signature") == signature:
            analysis = cached_entry.get("analysis")
            if isinstance(analysis, ScriptAnalysis):
                analyses[sid] = analysis
                reused += 1
                continue
        signatures[sid] = signature
        pending.append(interpreter.AnalyzeJob(LUA_BINDINGS, sid, source))
    workers = max(1, jobs) if jobs is not None else default_jobs()
    for outcome in _run_pending(pending, workers, reporter):
        analyses[outcome.script_id] = outcome.analysis
        if outcome.is_failed:
            failed += 1
        cache_entries[outcome.script_id] = {
            "signature": signatures[outcome.script_id],
            "analysis": outcome.analysis,
        }
    if use_cache:
        save_pickle_stamp(
            ANALYSIS_CACHE_PATH,
            INTERPRETER_VERSION,
            {sid: entry for sid, entry in cache_entries.items() if sid in sources},
        )
    reporter.info(
        f"{len(sources)} scripts (reused {reused}, analyzed {len(pending)},"
        f" failed {failed}, workers {workers}), {time.time() - started:.1f}s"
    )
    return analyses, reused, failed
