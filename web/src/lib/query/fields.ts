import { all as i18nAll } from "../../i18n";
import type { QueryField } from "../../types/query";

const FIELD_SPECS: QueryField[] = [
  { id: "speaker", kind: "text", aliases: ["speaker", "say"] },
  { id: "flag", kind: "text", aliases: ["flag", "flags"] },
  { id: "check", kind: "text", aliases: ["check", "checks"] },
  { id: "stat", kind: "text", aliases: ["stat", "stats"] },
  { id: "rel", kind: "text", aliases: ["rel"] },
  { id: "option", kind: "number", aliases: ["option", "options"] },
  { id: "lock", kind: "number", aliases: ["lock", "locks"] },
  { id: "dice", kind: "number", aliases: ["dice"] },
  { id: "out", kind: "number", node: "outDegree", aliases: ["out"] },
  { id: "in", kind: "number", node: "inDegree", aliases: ["in"] },
  { id: "saycount", kind: "number", node: "sayCount", aliases: ["saycount"] },
  { id: "id", kind: "string", aliases: ["id", "script"] },
  { id: "chapter", kind: "string", aliases: ["chapter"] },
  { id: "text", kind: "string", aliases: ["text"] },
  { id: "kind", kind: "enum", aliases: ["kind", "type"] },
  { id: "via", kind: "enum", aliases: ["via"] },
];

export const FACET_KEY: Record<string, string> = {
  speaker: "speakers",
  flag: "flags",
  check: "checks",
  stat: "stats",
  rel: "relations",
  option: "optionCount",
  lock: "lockCount",
  dice: "diceCheckCount",
};

export const ROOTS = ["AND", "OR", "NOT", "XOR"];

export const KIND_VALUES = ["entry", "leaf", "orphan", "temp", "sys", "jump"];

export const VIA_VALUES = ["combat", "free", "position"];

const aliasPairs = (key: string): Map<string, string> => {
  const map = new Map<string, string>();
  for (const pair of i18nAll(key)) {
    const parts = String(pair).split("=");
    if (parts.length === 2) map.set(parts[0].trim().toLowerCase(), parts[1].trim());
  }
  return map;
};

const build = (): {
  list: QueryField[];
  byId: Record<string, QueryField>;
  byAlias: Record<string, QueryField>;
} => {
  const list = FIELD_SPECS.map((field) => {
    const aliases = field.aliases.slice();
    for (const extra of i18nAll(`q.${field.id}`)) {
      if (aliases.indexOf(extra) < 0) aliases.push(extra);
    }
    return { ...field, aliases };
  });
  const byId: Record<string, QueryField> = {};
  const byAlias: Record<string, QueryField> = {};
  for (const field of list) {
    byId[field.id] = field;
    for (const alias of field.aliases) byAlias[String(alias).toLowerCase()] = field;
  }
  return { list, byId, byAlias };
};

const built = build();

export const FIELDS = built.list;

export const FIELD_BY_ID = built.byId;

export const FIELD_BY_ALIAS = built.byAlias;

export const LOGIC_ALIAS = aliasPairs("q.logic");

export const KIND_ALIAS = aliasPairs("q.enum.kind");

export const VIA_ALIAS = aliasPairs("q.enum.via");

export const YES_WORDS = ["yes", "y", "true"].concat(i18nAll("q.yes"));

export const NO_WORDS = ["no", "n", "false"].concat(i18nAll("q.no"));

export const facetKey = (field: QueryField): string => FACET_KEY[field.id] || field.id;
