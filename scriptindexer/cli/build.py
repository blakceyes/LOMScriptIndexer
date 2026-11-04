from __future__ import annotations

import argparse

from ..build.pipeline import run_build
from ..console import Reporter
from ..languages import DEFAULT_LANG
from .common import EXIT_DATA, EXIT_OK, EXIT_USAGE, split_langs


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build graph and reader data for the script corpus")
    parser.add_argument("--langs", default=DEFAULT_LANG,
                        help="source language to export; derived languages are rebuilt in the browser")
    parser.add_argument("--default-lang", default=DEFAULT_LANG,
                        help="default language shown when the interface language has no text pack")
    parser.add_argument("--no-cache", action="store_true", help="ignore the analysis cache")
    parser.add_argument("--jobs", type=int, default=None,
                        help="worker processes for script analysis (default: min(cpu//2, 4))")
    args = parser.parse_args(argv)

    langs = split_langs(args.langs)
    if not langs:
        Reporter().error("no language selected; pass --langs zh-tw")
        return EXIT_USAGE
    default_lang = args.default_lang if args.default_lang in langs else langs[0]

    result = run_build(
        langs=langs,
        default_lang=default_lang,
        use_cache=not args.no_cache,
        jobs=args.jobs,
        reporter=Reporter(),
    )
    return EXIT_OK if result.ok else EXIT_DATA
