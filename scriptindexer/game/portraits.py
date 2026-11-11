"""Export locally installed portrait assets using character config and exact addresses."""
import hashlib
from collections import defaultdict
from io import BytesIO
from pathlib import Path
from typing import Any

from ..console import Reporter
from ..jsonio import atomic_write_bytes, read_json, write_json
from ..paths import SITE_DATA_DIR
from .addressables import catalog_assets
from .assets import AssetSession, _dispose, try_build_generator, unitypy
from .layout import GameLayout

PORTRAIT_VERSION = 2
PORTRAIT_DIR = SITE_DATA_DIR / "portraits"
THUMBNAIL_SIZE = (192, 224)


def fingerprint(layout: GameLayout) -> str:
    aa = layout.data_dir / "StreamingAssets" / "aa"
    parts = [str(PORTRAIT_VERSION), layout.fingerprint()]
    for p in sorted(aa.rglob("*")) if aa.is_dir() else ():
        if p.is_file() and (p.suffix == ".bundle" or p.name == "catalog.json"):
            stat = p.stat()
            parts.append(f"{p.relative_to(aa)}:{stat.st_size}:{stat.st_mtime_ns}")
    return hashlib.sha256("|".join(parts).encode()).hexdigest()[:24]


def cached_manifest(layout: GameLayout, output: Path = PORTRAIT_DIR) -> dict | None:
    cached = read_json(output / "manifest.json")
    if not isinstance(cached, dict) or cached.get("fingerprint") != fingerprint(layout):
        return None
    files = cached.get("files")
    if not isinstance(files, list) or not all(
            isinstance(name, str) and Path(name).name == name
            and (output / name).is_file() for name in files):
        return None
    return cached


def character_addresses(session: AssetSession) -> tuple[dict[str, dict[str, str]], list[dict]]:
    """Read the active config list; do not infer roles or expressions from filenames."""
    addresses: dict[str, dict[str, str]] = {}
    ambiguous: set[tuple[str, str]] = set()
    issues: list[dict] = []
    configs = list(session.iter_class({"StoryCharacterConfig"}))
    if not configs:
        raise ValueError("StoryCharacterConfig not found")
    for path, obj, _ in configs:
        config = session.typetree(path, obj) or {}
        scope = session.file_scope(path)
        if "_list" not in config:
            raise ValueError("StoryCharacterConfig._list is missing")
        for ref in config["_list"]:
            hit = scope.resolve(ref)
            if hit is None:
                issues.append({"reason": "missing_character_config"})
                continue
            data_obj, target = hit
            data = session.typetree(target.path, data_obj) or {}
            mapping = target.typetree(data.get("_mapping")) or {}
            character = mapping.get("Value")
            if not isinstance(character, str) or not character:
                issues.append({"reason": "missing_character_mapping", "name": data.get("m_Name")})
                continue
            for item in data.get("_portraitResourceList") or []:
                expression = (target.typetree(item.get("_mapping")) or {}).get("Value")
                address = item.get("_addressKey")
                if not isinstance(expression, str) or not expression or not isinstance(address, str) or not address:
                    issues.append({"character": character, "reason": "missing_portrait_mapping"})
                    continue
                key = (character, expression)
                normalized = address.replace("\\", "/").casefold()
                known = addresses.setdefault(character, {})
                if key in ambiguous:
                    continue
                if expression in known and known[expression] != normalized:
                    ambiguous.add(key)
                    del known[expression]
                    issues.append({"character": character, "expression": expression,
                                   "reason": "ambiguous_config"})
                else:
                    known[expression] = normalized
    return addresses, issues


def thumbnail(image: Any) -> bytes:
    from PIL import Image

    image = image.convert("RGBA")
    bounds = image.getchannel("A").getbbox()
    if bounds:
        image = image.crop(bounds)
    # Keep the upper part of the actual sprite, so expressions remain readable.
    width, height = image.size
    image = image.crop((0, 0, width, min(height, round(width * 7 / 6))))
    image.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
    output = BytesIO()
    image.save(output, format="WEBP", quality=84, method=4)
    return output.getvalue()


def export_portraits(session: AssetSession, reporter: Reporter, *, force: bool = False,
                    output: Path = PORTRAIT_DIR) -> dict:
    if not force and (cached := cached_manifest(session.layout, output)) is not None:
        reporter.info(f"portraits: {len(cached['files'])} images from cache")
        return cached
    aa = session.layout.data_dir / "StreamingAssets" / "aa"
    catalog = catalog_assets(aa / "catalog.json")
    addresses, issues = character_addresses(session)
    requested = {address for expressions in addresses.values() for address in expressions.values()}
    resolved = {key: asset.address for key in requested if (asset := catalog.get(key))}
    wanted = set(resolved.values())
    bundle_addresses: dict[str, set[str]] = defaultdict(set)
    for key in sorted(requested):
        asset = catalog.get(key)
        if asset is None or not asset.bundles:
            issues.append({"address": key, "reason": "address_not_in_catalog"})
            continue
        for bundle in asset.bundles:
            bundle_addresses[bundle].add(asset.address)
    output.mkdir(parents=True, exist_ok=True)
    images: dict[str, str] = {}
    errors: dict[str, str] = {}
    for index, (bundle, targets) in enumerate(sorted(bundle_addresses.items()), 1):
        pending = targets - images.keys()
        if not pending:
            continue
        file = aa / "StandaloneWindows64" / bundle
        env = None
        try:
            env = unitypy().load(str(file))
            # UnityPy's container can contain both a Texture2D and a Sprite for one path.
            candidates = sorted(env.container.items(), key=lambda pair: pair[1].type.name != "Sprite")
            for address, obj in candidates:
                key = address.replace("\\", "/").casefold()
                if key not in pending or key in images or obj.type.name not in ("Sprite", "Texture2D"):
                    continue
                try:
                    payload = thumbnail(obj.read().image)
                    name = hashlib.sha256(payload).hexdigest()[:24] + ".webp"
                    if not (output / name).is_file():
                        atomic_write_bytes(output / name, payload)
                    images[key] = name
                except Exception as exc:
                    errors[key] = type(exc).__name__
        except Exception as exc:
            issues.append({"bundle": bundle, "reason": "bundle_read_failed",
                           "error": type(exc).__name__})
        finally:
            if env is not None:
                _dispose(env)
        if index % 10 == 0 or index == len(bundle_addresses):
            reporter.info(f"portraits: {index}/{len(bundle_addresses)} bundles, {len(images)} addresses")
    for address in sorted(wanted - images.keys()):
        issues.append({"address": address, "reason": "image_unavailable",
                       "error": errors.get(address, "")})
    files = sorted(set(images.values()))
    manifest = {
        "version": PORTRAIT_VERSION,
        "fingerprint": fingerprint(session.layout),
        "size": list(THUMBNAIL_SIZE),
        "characters": {character: {expression: images[resolved[address]]
                                  for expression, address in sorted(expressions.items())
                                  if address in resolved and resolved[address] in images}
                       for character, expressions in sorted(addresses.items())},
        "files": files,
        "issues": issues,
    }
    write_json(output / "manifest.json", manifest, indent=None)
    # Only prune exporter-owned image names after the replacement manifest is complete.
    for stale in output.glob("*.webp"):
        if len(stale.stem) == 24 and all(c in "0123456789abcdef" for c in stale.stem) and stale.name not in files:
            stale.unlink()
    reporter.info(f"portraits: {len(addresses)} characters, {len(files)} images, {len(issues)} mapping issues")
    return manifest


def ensure_portraits(layout: GameLayout, reporter: Reporter, force: bool = False) -> dict:
    if not force and (cached := cached_manifest(layout)) is not None:
        reporter.info(f"portraits: {len(cached['files'])} images from cache")
        return cached
    session = AssetSession(layout, try_build_generator(layout), reporter.info)
    try:
        return export_portraits(session, reporter, force=force)
    finally:
        session.close()
