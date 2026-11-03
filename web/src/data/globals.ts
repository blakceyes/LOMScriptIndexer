import type { TextPack } from "../types/text";

export const rawGraph = () => window.SR_DATA;

export const textPackOf = (): Record<string, TextPack> => window.SR_TEXT || {};

export const checkpointsOf = (): Record<string, unknown> => window.SR_CHECKPOINTS || {};

export const wordcountOf = (): Record<string, unknown> => window.SR_WORDCOUNT || {};

export const fillAsset = (
  template: string,
  vars?: Record<string, string | number>,
): string => template.replace(/\{(\w+)\}/g, (whole, name: string) => (
  vars && vars[name] !== undefined ? String(vars[name]) : whole
));
