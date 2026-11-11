import type { ReaderBlock } from "../types/beats";

export type PortraitCharacters = Record<string, Record<string, string>>;

export const selectPortraitFile = (
  characters: PortraitCharacters,
  character: string,
  expression: string,
  failed: readonly string[] = [],
): { file: string; fallback: boolean } | null => {
  if (!expression) return null;
  const expressions = characters[character];
  const valid = (file: unknown): file is string =>
    typeof file === "string" && /^[a-f0-9]{24}\.webp$/.test(file) && !failed.includes(file);
  const exact = expressions?.[expression];
  if (valid(exact)) return { file: exact, fallback: false };
  const normal = expressions?.normal;
  return valid(normal) ? { file: normal, fallback: true } : null;
};

// A BlockList is an independent visible reading fragment. Filter before calling,
// so a hidden line cannot consume a character's first portrait.
export const portraitVisibility = (blocks: ReaderBlock[]): boolean[] => {
  const seen = new Map<string, { key: string; revision: number }>();
  return blocks.map((block) => {
    if (block.kind !== "say") {
      if (["branches", "choice", "scene", "battle", "jump"].includes(block.kind)) seen.clear();
      return false;
    }
    if (!block.speaker || block.mode === "narration" || !block.portrait) return false;
    const portrait = block.portrait;
    const key = JSON.stringify([portrait.character, portrait.expression]);
    const previous = seen.get(block.speaker);
    seen.set(block.speaker, { key, revision: portrait.revision });
    return (
      !previous ||
      previous.key !== key ||
      previous.revision !== portrait.revision ||
      portrait.changed
    );
  });
};
