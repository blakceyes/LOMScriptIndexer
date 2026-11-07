import { pinia } from "../stores";
import { useScriptStore } from "../stores/script";

import { textStore } from "./text";

let scriptHandle: ReturnType<typeof useScriptStore> | null = null;
const script = (): ReturnType<typeof useScriptStore> => (scriptHandle ??= useScriptStore(pinia));

const allTables = (): Record<string, Record<string, string>> =>
  textStore.names(script().textLang()) || {};

const tableOfKind = (kind: string): Record<string, string> => allTables()[kind] || {};

const lookup = (kind: string, key: string): string => (key ? tableOfKind(kind)[key] || "" : "");

const label = (kind: string, key: string, fallback?: string): string =>
  lookup(kind, key) || fallback || key || "";

const speaker = (id: string): string => {
  if (!id) return "";
  return textStore.characters(script().textLang())[id] || id;
};

const title = (id: string): string => (id ? textStore.titles(script().textLang())[id] || "" : "");

export const names = { label, speaker, title };
