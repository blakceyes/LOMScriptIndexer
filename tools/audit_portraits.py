"""Audit generated dialogue portrait coverage without copying game data into source control."""
import json
from collections import Counter, defaultdict

from scriptindexer.analysis_cache import analyze_all
from scriptindexer.build import load_lua_sources
from scriptindexer.console import Reporter
from scriptindexer.game.portraits import PORTRAIT_DIR
from scriptindexer.jsonio import read_json, write_json
from scriptindexer.paths import CACHE_DIR, LUA_DIR
from scriptindexer.script_model import BranchBeat, ChoiceBeat, SayBeat


def walk(beats):
    for beat in beats:
        if isinstance(beat, BranchBeat):
            yield from walk(beat.beats)
        elif isinstance(beat, ChoiceBeat):
            for option in beat.options:
                yield from walk(option.beats)
        elif isinstance(beat, SayBeat):
            yield beat


def main():
    manifest = read_json(PORTRAIT_DIR / "manifest.json")
    if not manifest:
        raise SystemExit("No portrait manifest; run scriptindexer-portraits first")
    sources = load_lua_sources(LUA_DIR)
    models, _, _ = analyze_all(sources, True, Reporter())
    failed = sum(bool(model.error) for model in models.values())
    counts = Counter()
    missing = defaultdict(list)
    for sid, model in models.items():
        for beat in walk(model.beats):
            counts["say_lines"] += 1
            if not beat.speaker:
                counts["unnamed_or_narration"] += 1
                continue
            counts["named_lines"] += 1
            portrait = beat.portrait
            if portrait is None or not portrait.character or not portrait.expression:
                counts["unknown_expression"] += 1
                continue
            counts["known_expression"] += 1
            if manifest["characters"].get(portrait.character, {}).get(portrait.expression):
                counts["image_available"] += 1
            else:
                counts["missing_image"] += 1
                if manifest["characters"].get(portrait.character, {}).get("normal"):
                    counts["default_image_available"] += 1
                key = f"{portrait.character}:{portrait.expression}"
                if sid not in missing[key]:
                    missing[key].append(sid)
    payload = {"scripts": len(models), "failed": failed, "counts": dict(counts),
               "missing": dict(sorted(missing.items())), "mapping_issues": manifest["issues"]}
    output = CACHE_DIR / "portrait-coverage.json"
    write_json(output, payload)
    print(json.dumps({"scripts": len(models), "failed": failed, **counts,
                      "missing_pairs": len(missing)}, ensure_ascii=False))
    print(f"Report: {output}")
    return int(bool(failed))


if __name__ == "__main__":
    raise SystemExit(main())
