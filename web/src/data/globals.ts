import type { CheckpointModel } from "../types/condition";
import type { RawGraph } from "../types/graph";
import type { TextPack, WordCountPack } from "../types/text";

export const readRawGraph = (): RawGraph | undefined => window.SR_DATA;

export const readTextPacks = (): Record<string, TextPack> => window.SR_TEXT || {};

export const readCheckpointModels = (): Record<string, CheckpointModel> => (
  (window.SR_CHECKPOINTS || {}) as Record<string, CheckpointModel>
);

export const readWordCountPack = (): WordCountPack => (
  (window.SR_WORDCOUNT || {}) as WordCountPack
);
