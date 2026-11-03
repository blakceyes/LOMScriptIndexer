import { store } from "../state/store";
import { text } from "./text";

const tables = (): Record<string, Record<string, string>> => text.names(store.textLang()) || {};

const table = (kind: string): Record<string, string> => tables()[kind] || {};

const of = (kind: string, key: string): string => (key ? table(kind)[key] || "" : "");

const label = (kind: string, key: string, fallback?: string): string => (
  of(kind, key) || fallback || key || ""
);

const speaker = (id: string): string => {
  if (!id) return "";
  return text.characters(store.textLang())[id] || id;
};

const title = (id: string): string => (id ? text.titles(store.textLang())[id] || "" : "");

export const names = { label, of, speaker, table, title };
