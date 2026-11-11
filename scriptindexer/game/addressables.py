"""Resolve exact asset addresses through the game's compact Addressables catalog."""
import base64
import json
import struct
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class CatalogAsset:
    address: str
    bundles: tuple[str, ...]


def catalog_assets(path: Path) -> dict[str, CatalogAsset]:
    catalog = json.loads(path.read_text(encoding="utf-8-sig"))
    buckets_data = base64.b64decode(catalog["m_BucketDataString"])
    keys_data = base64.b64decode(catalog["m_KeyDataString"])
    entries_data = base64.b64decode(catalog["m_EntryDataString"])
    internal_ids = catalog["m_InternalIds"]
    asset_providers = {index for index, provider in enumerate(catalog["m_ProviderIds"])
                       if provider.endswith("BundledAssetProvider")}
    buckets: list[tuple[str | None, tuple[int, ...]]] = []
    position = 4
    for _ in range(struct.unpack_from("<i", buckets_data)[0]):
        offset, count = struct.unpack_from("<ii", buckets_data, position)
        position += 8
        if count < 0 or position + count * 4 > len(buckets_data):
            raise ValueError("invalid Addressables bucket")
        indices = struct.unpack_from(f"<{count}i", buckets_data, position)
        position += count * 4
        kind = keys_data[offset]
        key = None
        if kind in (0, 1):
            length = struct.unpack_from("<i", keys_data, offset + 1)[0]
            if length < 0 or offset + 5 + length > len(keys_data):
                raise ValueError("invalid Addressables key")
            key = keys_data[offset + 5:offset + 5 + length].decode(
                "ascii" if kind == 0 else "utf-16-le")
        buckets.append((key, indices))
    entries = [struct.unpack_from("<7i", entries_data, 4 + index * 28)
               for index in range(struct.unpack_from("<i", entries_data)[0])]

    def dependencies(index: int, seen: set[int]) -> set[str]:
        if index in seen:
            return set()
        seen.add(index)
        internal, _provider, dependency, *_rest = entries[index]
        address = internal_ids[internal].replace("\\", "/")
        found = {address.rsplit("/", 1)[-1]} if address.endswith(".bundle") else set()
        if 0 <= dependency < len(buckets):
            for target in buckets[dependency][1]:
                found.update(dependencies(target, seen))
        return found

    result = {}
    for key, indices in buckets:
        if not key:
            continue
        addresses = {internal_ids[entries[index][0]].replace("\\", "/").casefold()
                     for index in indices if entries[index][1] in asset_providers}
        if len(addresses) != 1:
            continue
        bundles = tuple(sorted(set().union(
            *(dependencies(index, set()) for index in indices))))
        result[key.replace("\\", "/").casefold()] = CatalogAsset(addresses.pop(), bundles)
    return result
