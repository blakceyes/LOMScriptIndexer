import type { RawGraph } from "./graph";
import type { TextPack } from "./text";

type LocalFontData = { family: string };

type ScriptIndexerApi = {
  exportScripts: () => Promise<void>;
};

declare global {
  interface Window {
    SR?: ScriptIndexerApi;
    SR_DATA?: RawGraph;
    SR_TEXT?: Record<string, TextPack>;
    SR_CHECKPOINTS?: Record<string, unknown>;
    SR_VARREADS?: Record<string, unknown>;
    SR_WORDCOUNT?: Record<string, unknown>;
    queryLocalFonts?: () => Promise<LocalFontData[]>;
  }
}

export {};
