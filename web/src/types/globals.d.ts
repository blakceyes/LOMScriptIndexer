import type { RawGraph } from "./graph";
import type { TextPack } from "./text";

type OpenccConverter = (text: string) => string;

type OpenccRuntime = {
  Converter: (config: { from: string; to: string }) => OpenccConverter;
  CustomConverter: (variants: string) => OpenccConverter;
};

type LocalFontData = { family: string };

declare global {
  interface Window {
    SR_DATA?: RawGraph;
    SR_TEXT?: Record<string, TextPack>;
    SR_CHECKPOINTS?: Record<string, unknown>;
    SR_VARREADS?: Record<string, unknown>;
    SR_WORDCOUNT?: Record<string, unknown>;
    OpenCC?: OpenccRuntime;
    queryLocalFonts?: () => Promise<LocalFontData[]>;
  }
}

export {};
