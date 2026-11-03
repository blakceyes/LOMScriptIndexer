import type { CheckpointModel } from "../types/cond";
import type { RawGraph } from "../types/graph";
import type { TextPack, WordCountPack } from "../types/text";

export const rawGraph = (): RawGraph | undefined => window.SR_DATA;

export const textPacks = (): Record<string, TextPack> => window.SR_TEXT || {};

export const checkpointModels = (): Record<string, CheckpointModel> => (
  (window.SR_CHECKPOINTS || {}) as Record<string, CheckpointModel>
);

export const wordCountPack = (): WordCountPack => (
  (window.SR_WORDCOUNT || {}) as WordCountPack
);
