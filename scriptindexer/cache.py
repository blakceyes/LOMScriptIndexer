from __future__ import annotations

import gzip
import pickle
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .jsonio import atomic_write_bytes, read_json, write_json


@dataclass(frozen=True)
class CacheStamp:
    version: int
    fingerprint: str


def load_json_stamp(path: Path, stamp: CacheStamp) -> Any | None:
    payload = read_json(path)
    if not isinstance(payload, dict):
        return None
    if payload.get("version") != stamp.version:
        return None
    if payload.get("fingerprint") != stamp.fingerprint:
        return None
    return payload.get("data")


def save_json_stamp(path: Path, stamp: CacheStamp, data: Any) -> None:
    write_json(
        path,
        {"version": stamp.version, "fingerprint": stamp.fingerprint, "data": data},
        indent=None,
    )


def load_pickle_stamp(path: Path, version: int) -> Any | None:
    try:
        with gzip.open(path, "rb") as handle:
            payload = pickle.load(handle)
    except Exception:
        return None
    if not isinstance(payload, dict) or payload.get("version") != version:
        return None
    return payload.get("data")


def save_pickle_stamp(path: Path, version: int, data: Any) -> None:
    payload = gzip.compress(pickle.dumps({"version": version, "data": data},
                                         protocol=pickle.HIGHEST_PROTOCOL))
    atomic_write_bytes(path, payload)
