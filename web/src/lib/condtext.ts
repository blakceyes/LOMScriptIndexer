import { names } from "../data/names";
import { t } from "../i18n";
import type { CondNode } from "../types/cond";

const LOOKUP_KINDS = ["stat", "rel", "flag"];

const valueKind = (kind: string): string => t(`vk.${kind}`, { defaultValue: kind || "" });

const checkKind = (kind: string): string => t(`ck.${kind}`, { defaultValue: kind || "" });

const groupKind = (op: string): string => t(`grp.${op}`, { defaultValue: op || "" });

const negative = (node: CondNode, text: string): string => {
  const flag = (node as { negative?: boolean }).negative;
  return flag ? `${text}×-1` : text;
};

const signed = (value: number | null | undefined): string => {
  if (typeof value !== "number") return "";
  return value > 0 ? `+${value}` : String(value);
};

const asNode = (value: unknown): CondNode | null => (
  value && typeof value === "object" ? value as CondNode : null
);

const cond = (input: CondNode | null): string => {
  const node = input;
  if (!node || typeof node !== "object") return "";
  const narrow = node as Record<string, unknown>;
  if (narrow.tag === "const") return String(narrow.value === undefined ? "" : narrow.value);
  if (narrow.tag === "random") return t("cRandom", { min: narrow.min as number, max: narrow.max as number });
  if (narrow.tag === "dice") return t("cDice");
  if (narrow.tag === "var") {
    return negative(node, t("cVar", {
      type: valueKind(String(narrow.kind ?? "")),
      name: names.label(String(narrow.kind ?? ""), String(narrow.key ?? "")),
    }));
  }
  if (narrow.tag === "check") {
    return t("cVar", {
      type: checkKind(String(narrow.kind ?? "")),
      name: names.label("check", String(narrow.key ?? "")),
    });
  }
  if (narrow.tag === "group") {
    const items = Array.isArray(narrow.items) ? narrow.items as CondNode[] : [];
    if (items.length === 1 && narrow.op === "sum" && !narrow.negative) return cond(items[0]);
    const inner = items.map(cond).join(" + ");
    return negative(node, t("cGroup", {
      name: (narrow.name as string) || groupKind(String(narrow.op ?? "")),
      group: groupKind(String(narrow.op ?? "")),
      items: inner || "—",
    }));
  }
  if (narrow.tag === "compare") {
    return `${cond(asNode(narrow.left))} ${(narrow.op as string) || "?"} ${cond(asNode(narrow.right))}`;
  }
  if (narrow.tag === "logic") {
    const joiner = ` ${narrow.op === "or" ? t("cxOr") : t("cxAnd")} `;
    const items = Array.isArray(narrow.items) ? narrow.items as CondNode[] : [];
    return items.map(cond).join(joiner);
  }
  return typeof narrow.text === "string" ? narrow.text : "";
};

const gain = (label: string, count: number | null): string => {
  if (typeof count === "number" && count < 0) return t("metaLose", { label });
  if (typeof count === "number" && count > 1) return t("metaGainCount", { label, count });
  return t("metaGain", { label });
};

const meta = (kind: string, key: string, value: number | null): string => {
  if (kind === "stat") {
    const name = names.label("stat", key);
    const delta = signed(value);
    return delta ? t("metaValue", { name, delta }) : name;
  }
  if (kind === "rel") {
    const name = names.label("rel", key);
    const delta = signed(value);
    return delta ? t("metaRelation", { name, delta }) : t("metaRelation", { name, delta: "" }).trim();
  }
  if (kind === "flag") {
    const name = names.label("flag", key);
    const delta = signed(value);
    return delta ? t("metaFlag", { name, delta }) : name;
  }
  if (kind === "setflag") return t("metaAssignFlag", { name: names.label("flag", key), value });
  if (kind === "setstat") return t("metaAssign", { name: names.label("stat", key), value });
  if (kind === "setrel") return t("metaAssignRelation", { name: names.label("rel", key), value });
  if (kind === "book") return gain(t("metaBook", { name: names.label("book", key) }), value);
  if (kind === "misc") return gain(t("metaItem", { name: names.label("misc", key) }), value);
  if (kind === "special") return gain(t("metaItem", { name: names.label("special", key) }), value);
  if (kind === "talent") return t("metaTalent", { name: names.label("talent", key), value });
  if (kind === "library") return t("metaLibrary", { name: names.label("chronicle", key) });
  if (kind === "mission") return t("metaMission", { key });
  if (kind === "dice") return t("metaDice", { name: names.label("check", key) });
  return "";
};

const metaTarget = (kind: string, key: string): { kind: string; key: string } | null => {
  if (!key) return null;
  if (kind === "setflag") return { kind: "flag", key };
  return LOOKUP_KINDS.indexOf(kind) >= 0 ? { kind, key } : null;
};

const optionCond = (condition: Record<string, unknown> | null): string => {
  if (!condition || typeof condition !== "object") return "";
  const value = typeof condition.value === "string" ? condition.value : String(condition.value ?? "");
  const op = typeof condition.op === "string" ? condition.op : "";
  if (!op) return value;
  return t("oCond", { op, value });
};

const needText = (detail: Record<string, unknown> | null): string => {
  const need = detail && Array.isArray(detail.need) ? detail.need : [];
  return need.filter((item: unknown) => (
    item && typeof item === "object" && typeof (item as Record<string, unknown>).kind === "string"
    && (item as Record<string, unknown>).kind
  )).map((item: unknown) => {
    const row = item as Record<string, unknown>;
    return t("oNeed", {
      label: t(`need.${String(row.kind)}`, { defaultValue: String(row.kind) }),
      op: row.op === undefined ? "" : row.op,
      value: row.value === undefined ? "" : row.value,
    });
  }).join(" · ");
};

const optionHead = (text: string, detail: Record<string, unknown> | null): string => {
  const action = detail && typeof detail.action === "string" && detail.action
    ? t(`menu.${detail.action}`, { defaultValue: detail.action }) : "";
  if (action && text) return t("optionActionJoin", { action, title: text });
  return action || text || t("optionOther");
};

export const condtext = {
  checkKind,
  cond,
  meta,
  metaTarget,
  needText,
  optionCond,
  optionHead,
  valueKind,
};
