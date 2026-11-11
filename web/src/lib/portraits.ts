import { shallowRef } from "vue";
import { selectPortraitFile, type PortraitCharacters } from "./portraitState";

export type PortraitManifest = {
  characters: PortraitCharacters;
};

export const portraitManifest = shallowRef<PortraitManifest | null>(null);
let loading: Promise<void> | null = null;

export const ensurePortraitManifest = (): Promise<void> => {
  if (!loading) {
    loading = fetch(new URL("data/portraits/manifest.json", document.baseURI))
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        if (!data || typeof data !== "object" || !("characters" in data)) return;
        const characters = data.characters;
        if (characters && typeof characters === "object" && !Array.isArray(characters)) {
          portraitManifest.value = { characters: characters as PortraitManifest["characters"] };
        }
      })
      .catch(() => {
        /* Text remains usable if local portraits were not exported. */
      });
  }
  return loading;
};

export const portraitSource = (
  character: string,
  expression: string,
  failed: readonly string[] = [],
) => {
  const selected = selectPortraitFile(
    portraitManifest.value?.characters || {},
    character,
    expression,
    failed,
  );
  return selected
    ? { ...selected, url: new URL("data/portraits/" + selected.file, document.baseURI).href }
    : null;
};
