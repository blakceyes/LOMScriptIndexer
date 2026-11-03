import { languageMeta } from "../i18n/dict";
import type { BeatRow } from "../types/beats";
import { loadScript } from "../lib/dom";
import type { OpenccConfig } from "../i18n/types";

const RUNTIME = "vendor/opencc-t2cn.js";

type Converter = (text: string) => string;

const converters = new Map<string, Converter>();
let runtime: Promise<OpenccRuntime> | null = null;

type OpenccRuntime = NonNullable<Window["OpenCC"]>;

const configOf = (lang: string): OpenccConfig | null => {
  const entry = languageMeta[lang];
  return entry && entry.opencc ? entry.opencc : null;
};

const load = (): Promise<OpenccRuntime> => {
  if (window.OpenCC) return Promise.resolve(window.OpenCC);
  if (runtime) return runtime;
  runtime = loadScript(RUNTIME).then(() => {
    if (!window.OpenCC) throw new Error("OpenCC runtime is missing");
    return window.OpenCC;
  }).catch((error: unknown) => {
    runtime = null;
    throw error;
  });
  return runtime;
};

const build = (opencc: OpenccRuntime, config: OpenccConfig): Converter => {
  const base = opencc.Converter({ from: config.from, to: config.to });
  const variants = config.variants ? opencc.CustomConverter(config.variants) : null;
  return variants ? (text: string) => variants(base(text)) : base;
};

const ensure = (lang: string): Promise<boolean> => {
  if (converters.get(lang)) return Promise.resolve(true);
  const config = configOf(lang);
  if (!config) {
    converters.set(lang, (text: string) => text);
    return Promise.resolve(true);
  }
  return load().then((opencc) => {
    converters.set(lang, build(opencc, config));
    return true;
  }, () => false);
};

const ready = (lang: string): boolean => !!converters.get(lang);

const string = (lang: string, value: unknown): unknown => {
  const converter = converters.get(lang);
  if (!converter || typeof value !== "string" || !value) return value;
  return converter(value);
};

const convertRow = (lang: string, value: unknown): unknown => {
  if (typeof value === "string") return string(lang, value);
  if (Array.isArray(value)) {
    const out = new Array(value.length);
    for (let index = 0; index < value.length; index++) out[index] = convertRow(lang, value[index]);
    return out;
  }
  if (value && typeof value === "object") return convertGroup(lang, value as Record<string, unknown>);
  return value;
};

const convertGroup = (lang: string, value: unknown): unknown => {
  if (Array.isArray(value)) return value.map((item) => convertRow(lang, item));
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    const item = source[key];
    if (typeof item === "string") out[key] = string(lang, item);
    else if (item && typeof item === "object") out[key] = convertGroup(lang, item);
    else out[key] = item;
  }
  return out;
};

const rows = (lang: string, beats: BeatRow[] | null): BeatRow[] | null => {
  if (!converters.get(lang) || !Array.isArray(beats)) return beats;
  return convertRow(lang, beats) as BeatRow[];
};

const group = <T,>(lang: string, value: T): T => {
  if (!converters.get(lang) || !value || typeof value !== "object") return value;
  return convertGroup(lang, value) as T;
};

export const convert = {
  ensure,
  group,
  ready,
  rows,
  string: (lang: string, value: string): string => string(lang, value) as string,
};
