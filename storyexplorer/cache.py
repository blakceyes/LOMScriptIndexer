from __future__ import annotations

import gzip
import pickle
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .jsonio import atomic_write_bytes, read_json, write_json


@dataclass(frozen=True)
class CacheKey:
    version: int
    fingerprint: str


def load_envelope(path: Path, key: CacheKey) -> Any | None:
    payload = read_json(path)
    if not isinstance(payload, dict):
        return None
    if payload.get("version") != key.version:
        return None
    if payload.get("fingerprint") != key.fingerprint:
        return None
    return payload.get("data")


def save_envelope(path: Path, key: CacheKey, data: Any) -> None:
    write_json(path, {"version": key.version, "fingerprint": key.fingerprint, "data": data},
               indent=None)


def load_pickle(path: Path, version: int) -> Any | None:
    try:
        with gzip.open(path, "rb") as fp:
            payload = pickle.load(fp)
    except Exception:
        return None
    if not isinstance(payload, dict) or payload.get("version") != version:
        return None
    return payload.get("data")


def save_pickle(path: Path, version: int, data: Any) -> None:
    payload = gzip.compress(pickle.dumps({"version": version, "data": data},
                                         protocol=pickle.HIGHEST_PROTOCOL))
    atomic_write_bytes(path, payload)
