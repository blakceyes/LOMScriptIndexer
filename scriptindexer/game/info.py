from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path

from ..model import GameInfo
from .assets import AssetSession

ACF_QUOTE = r'"{field}"\s+"([^"]*)"'
BUNDLE_VERSION_PATTERN = re.compile(r"^release_(\d+(?:\.\d+)+)$")


def _acf_value(text: str, field: str) -> str | None:
    match = re.search(ACF_QUOTE.format(field=re.escape(field)), text)
    return match.group(1) if match else None


def read_bundle_version(session: AssetSession) -> str | None:
    found = session.find_type("PlayerSettings")
    if found is None:
        return None
    path, obj = found
    tree = session.tree(path, obj)
    value = (tree or {}).get("bundleVersion")
    if not isinstance(value, str):
        return None
    text = value.strip()
    match = BUNDLE_VERSION_PATTERN.match(text)
    return match.group(1) if match else (text or None)


def read_steam_build(steamapps: Path, install_dir: str) -> dict[str, str | None]:
    found: dict[str, str | None] = {"build": None, "updated": None}
    try:
        manifests = sorted(Path(steamapps).glob("appmanifest_*.acf"))
    except OSError:
        return found
    for path in manifests:
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        if _acf_value(text, "installdir") != install_dir:
            continue
        build = _acf_value(text, "buildid")
        if build and build.isdigit():
            found["build"] = build
        stamp = _acf_value(text, "LastUpdated")
        if stamp and stamp.isdigit():
            try:
                found["updated"] = datetime.fromtimestamp(int(stamp)).strftime("%Y-%m-%d")
            except (OverflowError, OSError, ValueError):
                found["updated"] = None
        break
    return found


def read_game_info(session: AssetSession, steamapps: Path | None,
                   install_dir: str) -> GameInfo:
    version = read_bundle_version(session)
    if steamapps is None:
        return GameInfo(version)
    steam = read_steam_build(steamapps, install_dir)
    return GameInfo(version, steam.get("build"), steam.get("updated"))
