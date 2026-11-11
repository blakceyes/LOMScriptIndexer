import argparse
from pathlib import Path

from ..console import Reporter
from ..game.layout import discover, game_root
from ..game.portraits import ensure_portraits


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Export local dialogue portraits and their exact config mapping")
    parser.add_argument("--game", type=Path, default=None)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args(argv)
    root = args.game or game_root()
    layout = discover(root)
    if layout is None:
        parser.error("game assets missing; pass --game or set MORTAL_GAME_DIR")
    ensure_portraits(layout, Reporter(), args.force)
    return 0
