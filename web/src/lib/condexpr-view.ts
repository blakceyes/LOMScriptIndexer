import { t } from "../i18n";
import type { CondNode } from "../types/cond";
import { condexpr } from "./condexpr";
import { names } from "../data/names";

export type CondPart =
  | { text: string }
  | {
    tag: "span" | "button";
    cls: string;
    title?: string;
    role?: string;
    kind?: string;
    lookup?: { kind: string; key: string };
    children: CondPart[];
  };

const LOOKUP_KINDS: Record<string, boolean> = { stat: true, rel: true, flag: true, check: true };

const textPart = (value: string): CondPart => ({ text: value });

const span = (cls: string, children: CondPart[], title?: string): CondPart => ({
  tag: "span", cls, children, title,
});

const typeText = (kind: string): string => t(`vk.${kind}`, { defaultValue: kind || "" });

const checkText = (kind: string): string => t(`ck.${kind}`, { defaultValue: kind || "" });

const displayName = (kind: string, key: string): string => names.label(kind, key);

const singleChild = (node: CondNode): CondNode | null => {
  const narrow = node as Record<string, unknown>;
  const children = Array.isArray(narrow.items) ? narrow.items as CondNode[] : [];
  if (children.length !== 1) return null;
  if (narrow.negative) return null;
  if (narrow.op && narrow.op !== "sum") return null;
  return children[0];
};

const chipPart = (node: CondNode): CondPart => {
  const narrow = node as Record<string, unknown>;
  const isCheck = narrow.tag === "check";
  const kind = isCheck ? "check" : String(narrow.kind ?? "");
  const key = String(narrow.key ?? "");
  const label = displayName(kind, key);
  const children: CondPart[] = [
    span("cx-type", [textPart(isCheck ? checkText(kind) : typeText(kind))]),
    span("cx-name", [textPart(label)]),
  ];
  if ((kind === "flag" || kind === "check") && key && key !== label) {
    children.push(span("cx-id", [textPart(key)]));
  }
  if (narrow.negative) children.push(span("cx-neg", [textPart("×-1")]));
  const type = isCheck ? checkText(kind) : typeText(kind);
  const count = condexpr.countOf(kind, key);
  const hint = count
    ? t("cxVarTip", { type, name: label, n: count })
    : t("cxVarTipNone", { type, name: label });
  if (LOOKUP_KINDS[kind] && count > 0) {
    return {
      tag: "button",
      cls: "cx-var is-link",
      children,
      title: hint,
      role: "button",
      kind,
      lookup: { kind, key },
    };
  }
  return { tag: "span", cls: "cx-var", children, title: hint };
};

const groupPart = (node: CondNode): CondPart => {
  const narrow = node as Record<string, unknown>;
  const child = singleChild(node);
  if (child) {
    const leaf = valuePart(child);
    if (narrow.name && !("text" in leaf) && !leaf.title) leaf.title = String(narrow.name);
    return leaf;
  }
  const groupKey = narrow.op ? `grp.${String(narrow.op)}` : "";
  const children: CondPart[] = [];
  if (groupKey) children.push(span("cx-gtag", [textPart(t(groupKey))]));
  const items: CondPart[] = [span("cx-bracket", [textPart("[")])];
  const list = Array.isArray(narrow.items) ? narrow.items as CondNode[] : [];
  list.forEach((item, index) => {
    if (index) items.push(span("cx-gsep", [textPart(" + ")]));
    items.push(valuePart(item));
  });
  if (!list.length) {
    items.push(span("cx-const", [textPart(String(narrow.name || "—"))]));
  }
  items.push(span("cx-bracket", [textPart("]")]));
  children.push(span("cx-gitems", items));
  if (narrow.negative) children.push(span("cx-neg", [textPart("×-1")]));
  return span("cx-group", children, narrow.name ? String(narrow.name) : undefined);
};

const valuePart = (node: CondNode): CondPart => {
  const narrow = node as Record<string, unknown>;
  if (narrow.tag === "const") return span("cx-const", [textPart(String(narrow.value))]);
  if (narrow.tag === "random") {
    return span("cx-const cx-rand", [textPart(t("cRandom", { min: narrow.min as number, max: narrow.max as number }))]);
  }
  if (narrow.tag === "dice") return span("cx-dice", [textPart(t("cDice"))]);
  if (narrow.tag === "var" || narrow.tag === "check") return chipPart(node);
  if (narrow.tag === "group") return groupPart(node);
  return span("cx-const", [textPart(String(narrow.value === undefined ? "" : narrow.value))]);
};

const inlinePart = (input: CondNode | null): CondPart => {
  if (!input) return span("cx-empty", [textPart(t("lookupCondEmpty"))]);
  const narrow = input as Record<string, unknown>;
  if (narrow.tag === "compare") {
    return span("cx-cmp", [
      inlinePart(narrow.left as CondNode),
      span("cx-op", [textPart((narrow.op as string) || "?")]),
      inlinePart(narrow.right as CondNode),
    ]);
  }
  if (narrow.tag === "logic") {
    const joiner = narrow.op === "or" ? t("cxOr") : t("cxAnd");
    const items = Array.isArray(narrow.items) ? narrow.items as CondNode[] : [];
    const children: CondPart[] = [];
    items.forEach((child, index) => {
      if (index) children.push(span("cx-op", [textPart(joiner)]));
      children.push(inlinePart(child));
    });
    return span("cx-cmp", children);
  }
  return valuePart(input);
};

export const condParts = (expr: CondNode | null, method?: string): CondPart => {
  void method;
  if (!expr) return span("cx-expr", []);
  const narrow = expr as Record<string, unknown>;
  const joiner = narrow.tag === "logic"
    ? (narrow.op === "or" ? t("cxOr") : t("cxAnd"))
    : "";
  const items = narrow.tag === "logic" ? (Array.isArray(narrow.items) ? narrow.items as CondNode[] : []) : [expr];
  const lines: CondPart[] = items.map((node, index) => {
    const children: CondPart[] = [];
    if (index && joiner) children.push(span("cx-logic", [textPart(joiner)]));
    children.push(inlinePart(node));
    return span("cx-line", children);
  });
  return span("cx-expr", lines);
};

export const condLabelOf = (expr: CondNode | null): string => condexpr.label(expr);
