from pathlib import Path

from ..paths import LUA_DIR

__all__ = ["load_lua_sources"]


def load_lua_sources(lua_dir: Path = LUA_DIR) -> dict[str, str]:
    base = Path(lua_dir)
    if not base.is_dir():
        return {}
    return {path.stem: path.read_text(encoding="utf-8") for path in sorted(base.glob("*.lua"))}
