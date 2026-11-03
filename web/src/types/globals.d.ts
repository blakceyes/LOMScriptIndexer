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
    SR_WORDCOUNT?: Record<string, unknown>;
    SR_I18N?: Record<string, Record<string, string>>;
    SR_I18N_META?: Record<string, Record<string, unknown>>;
    OpenCC?: OpenccRuntime;
    queryLocalFonts?: () => Promise<LocalFontData[]>;
  }
}

export {};
