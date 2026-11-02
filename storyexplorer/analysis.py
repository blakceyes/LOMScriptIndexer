from __future__ import annotations

import hashlib
import os
import time
from concurrent.futures import ProcessPoolExecutor
from typing import Any

from . import flow
from .cache import load_pickle, save_pickle
from .console import Reporter
from .model import ScriptAnalysis
from .paths import ANALYSIS_CACHE_PATH
from .versions import FLOW_VERSION


def default_jobs() -> int:
    cores = os.cpu_count() or 1
    return max(1, min(cores // 2, 4))


def _run_pending(pending: list[tuple[Any, str, str]], jobs: int,
                 reporter: Reporter) -> list[tuple[str, bool, ScriptAnalysis]]:
    if jobs <= 1 or len(pending) < max(8, jobs * 2):
        return [flow.analyze_task(item) for item in pending]
    chunk = max(1, len(pending) // (jobs * 8))
    try:
        with ProcessPoolExecutor(max_workers=min(jobs, len(pending))) as pool:
            return list(pool.map(flow.analyze_task, pending, chunksize=chunk))
    except Exception as exc:
        reporter.warn(f"parallel analysis unavailable, falling back to serial: {exc}")
        return [flow.analyze_task(item) for item in pending]


def _signature(source: str) -> str:
    return hashlib.sha1(source.encode("utf-8")).hexdigest()[:16]


def analyze_all(sources: dict[str, str], semantics: Any, use_cache: bool,
                reporter: Reporter, jobs: int | None = None,
                announce: bool = True) -> tuple[dict[str, ScriptAnalysis], int, int]:
    cached = load_pickle(ANALYSIS_CACHE_PATH, FLOW_VERSION) if use_cache else None
    entries: dict[str, Any] = cached if isinstance(cached, dict) else {}
    models: dict[str, ScriptAnalysis] = {}
    signatures: dict[str, str] = {}
    pending: list[tuple[Any, str, str]] = []
    reused = 0
    failed = 0
    started = time.time()
    for sid, source in sorted(sources.items()):
        signature = _signature(source)
        hit = entries.get(sid)
        if isinstance(hit, dict) and hit.get("sig") == signature:
            model = hit.get("model")
            if isinstance(model, ScriptAnalysis):
                models[sid] = model
                reused += 1
                continue
        signatures[sid] = signature
        pending.append((semantics, sid, source))
    workers = max(1, jobs) if jobs is not None else default_jobs()
    for sid, is_failed, model in _run_pending(pending, workers, reporter):
        models[sid] = model
        if is_failed:
            failed += 1
        entries[sid] = {"sig": signatures[sid], "model": model}
    if use_cache:
        save_pickle(
            ANALYSIS_CACHE_PATH,
            FLOW_VERSION,
            {sid: entry for sid, entry in entries.items() if sid in sources},
        )
    if announce:
        reporter.stage(1, 4, "semantic analysis")
    reporter.info(
        f"{len(sources)} scripts (reused {reused}, analyzed {len(pending)},"
        f" failed {failed}, workers {workers}), {time.time() - started:.1f}s"
    )
    return models, reused, failed
