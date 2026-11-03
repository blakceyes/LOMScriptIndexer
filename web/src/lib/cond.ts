import { checkpoints } from "../data/checkpoints";
import { graph } from "../data/graph";
import { names } from "../data/names";
import { t } from "../i18n";
import type { CheckRef } from "../types/beats";
import type { CheckpointModel, CondNode } from "../types/cond";

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

const LOOKUP_KINDS = new Set(["stat", "rel", "flag"]);
const INLINE_LOOKUP_KINDS = new Set(["stat", "rel", "flag", "check"]);

export const kindText = (kind: string): string => t(`vk.${kind}`, { defaultValue: kind || "" });

export const checkKindText = (kind: string): string => t(`ck.${kind}`, { defaultValue: kind || "" });

const groupText = (op: string): string => t(`grp.${op}`, { defaultValue: op || "" });

const nameOf = (kind: string, key: string): string => names.label(kind, key);

const negativeSuffix = (node: CondNode): string => (
  "negative" in node && node.negative ? "×-1" : ""
);

const singleChild = (node: CondNode): CondNode | null => {
  if (node.tag !== "group") return null;
  const items = node.items || [];
  if (items.length !== 1 || node.negative) return null;
  if (node.op && node.op !== "sum") return null;
  return items[0];
};

export const condCount = (kind: string, key: string): number => {
  if (!key) return 0;
  if (kind === "flag") {
    const groups = graph.flagGroups(key);
    return groups.writes.length + groups.reads.length;
  }
  return graph.lookup(kind, key).length;
};

export const localizedName = (node: { kind?: string; key?: string } | null): string => (
  node && node.kind ? nameOf(node.kind, node.key || "") : ""
);

export const condText = (node: CondNode | null): string => {
  if (!node) return "";
  switch (node.tag) {
    case "const":
      return String(node.value ?? "");
    case "random":
      return t("cRandom", { min: node.min, max: node.max });
    case "dice":
      return t("cDice");
    case "var":
      return t("cVar", { type: kindText(node.kind), name: nameOf(node.kind, node.key) })
        + negativeSuffix(node);
    case "check":
      return t("cVar", { type: checkKindText(node.kind), name: nameOf("check", node.key) })
        + negativeSuffix(node);
    case "group": {
      const child = singleChild(node);
      if (child) return condText(child);
      const items = node.items || [];
      const op = node.op || "";
      return t("cGroup", {
        name: node.name || groupText(op),
        group: groupText(op),
        items: items.map(condText).join(" + ") || "—",
      }) + negativeSuffix(node);
    }
    case "compare":
      return `${condText(node.left || null)} ${node.op || "?"} ${condText(node.right || null)}`;
    case "logic": {
      const joiner = ` ${node.op === "or" ? t("cxOr") : t("cxAnd")} `;
      return (node.items || []).map(condText).join(joiner);
    }
    default:
      return "";
  }
};

const textPart = (value: string): CondPart => ({ text: value });

const span = (cls: string, children: CondPart[], title?: string): CondPart => ({
  tag: "span", cls, children, title,
});

const chipPart = (node: Extract<CondNode, { tag: "var" | "check" }>): CondPart => {
  const isCheck = node.tag === "check";
  const kind = isCheck ? "check" : node.kind;
  const key = node.key;
  const label = nameOf(kind, key);
  const type = isCheck ? checkKindText(kind) : kindText(kind);
  const children: CondPart[] = [
    span("cx-type", [textPart(type)]),
    span("cx-name", [textPart(label)]),
  ];
  if ((kind === "flag" || kind === "check") && key && key !== label) {
    children.push(span("cx-id", [textPart(key)]));
  }
  if (node.negative) children.push(span("cx-neg", [textPart("×-1")]));
  const count = condCount(kind, key);
  const hint = count
    ? t("cxVarTip", { type, name: label, n: count })
    : t("cxVarTipNone", { type, name: label });
  if (INLINE_LOOKUP_KINDS.has(kind) && count > 0) {
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

const groupPart = (node: Extract<CondNode, { tag: "group" }>): CondPart => {
  const child = singleChild(node);
  if (child) {
    const leaf = valuePart(child);
    if (node.name && !("text" in leaf) && !leaf.title) leaf.title = node.name;
    return leaf;
  }
  const op = node.op || "";
  const children: CondPart[] = [];
  if (op) children.push(span("cx-gtag", [textPart(groupText(op))]));
  const items: CondPart[] = [span("cx-bracket", [textPart("[")])];
  const list = node.items || [];
  list.forEach((item, index) => {
    if (index) items.push(span("cx-gsep", [textPart(" + ")]));
    items.push(valuePart(item));
  });
  if (!list.length) items.push(span("cx-const", [textPart(node.name || "—")]));
  items.push(span("cx-bracket", [textPart("]")]));
  children.push(span("cx-gitems", items));
  if (node.negative) children.push(span("cx-neg", [textPart("×-1")]));
  return span("cx-group", children, node.name || undefined);
};

const valuePart = (node: CondNode): CondPart => {
  switch (node.tag) {
    case "const":
      return span("cx-const", [textPart(String(node.value ?? ""))]);
    case "random":
      return span("cx-const cx-rand", [textPart(t("cRandom", { min: node.min, max: node.max }))]);
    case "dice":
      return span("cx-dice", [textPart(t("cDice"))]);
    case "var":
    case "check":
      return chipPart(node);
    case "group":
      return groupPart(node);
    default:
      return span("cx-const", [textPart("")]);
  }
};

const inlinePart = (input: CondNode | null): CondPart => {
  if (!input) return span("cx-empty", [textPart(t("lookupCondEmpty"))]);
  if (input.tag === "compare") {
    return span("cx-cmp", [
      inlinePart(input.left || null),
      span("cx-op", [textPart(input.op || "?")]),
      inlinePart(input.right || null),
    ]);
  }
  if (input.tag === "logic") {
    const joiner = input.op === "or" ? t("cxOr") : t("cxAnd");
    const children: CondPart[] = [];
    (input.items || []).forEach((child, index) => {
      if (index) children.push(span("cx-op", [textPart(joiner)]));
      children.push(inlinePart(child));
    });
    return span("cx-cmp", children);
  }
  return valuePart(input);
};

export const condParts = (expr: CondNode | null): CondPart => {
  if (!expr) return span("cx-expr", []);
  const joiner = expr.tag === "logic" ? (expr.op === "or" ? t("cxOr") : t("cxAnd")) : "";
  const items = expr.tag === "logic" ? (expr.items || []) : [expr];
  const lines: CondPart[] = items.map((node, index) => {
    const children: CondPart[] = [];
    if (index && joiner) children.push(span("cx-logic", [textPart(joiner)]));
    children.push(inlinePart(node));
    return span("cx-line", children);
  });
  return span("cx-expr", lines);
};

const checkpointModel = (check: CheckRef | null): { model: CheckpointModel; type: string } | null => {
  if (!check || !check.key) return null;
  const model = checkpoints.get(check.key, check.kind);
  if (!model) return null;
  return { model, type: model.kind || check.kind };
};

export const checkpointExpr = (check: CheckRef | null, result?: number | null): CondNode | null => {
  const hit = checkpointModel(check);
  if (!hit) return null;
  const branches = hit.model.branches || [];
  if (!branches.length) return null;
  const wanted = result === undefined ? check?.result : result;
  if (hit.type === "condition") return branches[0].expr || null;
  if (hit.type !== "switch" && hit.type !== "dice") return null;
  if (wanted === null || wanted === undefined) return null;
  for (const branch of branches) {
    if (branch.result === wanted) return branch.expr || null;
  }
  return null;
};

export type CondFallback = { n: number; excluded: CondNode[] };

export const checkpointFallback = (check: CheckRef | null,
                                   result?: number | null): CondFallback | null => {
  const hit = checkpointModel(check);
  if (!hit) return null;
  if (hit.type !== "switch" && hit.type !== "dice") return null;
  const wanted = result === undefined ? check?.result : result;
  if (wanted === null || wanted === undefined) return null;
  if (hit.model.fallback === undefined || wanted !== hit.model.fallback) return null;
  const branches = hit.model.branches || [];
  const excluded: CondNode[] = [];
  for (const branch of branches) if (branch && branch.expr) excluded.push(branch.expr);
  return { n: branches.length, excluded };
};

const signed = (value: number | null | undefined): string => {
  if (typeof value !== "number") return "";
  return value > 0 ? `+${value}` : String(value);
};

const gain = (label: string, count: number | null): string => {
  if (typeof count === "number" && count < 0) return t("metaLose", { label });
  if (typeof count === "number" && count > 1) return t("metaGainCount", { label, count });
  return t("metaGain", { label });
};

export const metaText = (kind: string, key: string, value: number | null): string => {
  if (kind === "stat") {
    const name = nameOf("stat", key);
    const delta = signed(value);
    return delta ? t("metaValue", { name, delta }) : name;
  }
  if (kind === "rel") {
    const name = nameOf("rel", key);
    const delta = signed(value);
    return delta ? t("metaRelation", { name, delta }) : t("metaRelation", { name, delta: "" }).trim();
  }
  if (kind === "flag") {
    const name = nameOf("flag", key);
    const delta = signed(value);
    return delta ? t("metaFlag", { name, delta }) : name;
  }
  if (kind === "setflag") return t("metaAssignFlag", { name: nameOf("flag", key), value });
  if (kind === "setstat") return t("metaAssign", { name: nameOf("stat", key), value });
  if (kind === "setrel") return t("metaAssignRelation", { name: nameOf("rel", key), value });
  if (kind === "book") return gain(t("metaBook", { name: nameOf("book", key) }), value);
  if (kind === "misc") return gain(t("metaItem", { name: nameOf("misc", key) }), value);
  if (kind === "special") return gain(t("metaItem", { name: nameOf("special", key) }), value);
  if (kind === "talent") return t("metaTalent", { name: nameOf("talent", key), value });
  if (kind === "library") return t("metaLibrary", { name: nameOf("chronicle", key) });
  if (kind === "mission") return t("metaMission", { key });
  if (kind === "dice") return t("metaDice", { name: nameOf("check", key) });
  return "";
};

export const metaTarget = (kind: string, key: string): { kind: string; key: string } | null => {
  if (!key) return null;
  if (kind === "setflag") return { kind: "flag", key };
  return LOOKUP_KINDS.has(kind) ? { kind, key } : null;
};

export const optionCondText = (condition: Record<string, unknown> | null): string => {
  if (!condition || typeof condition !== "object") return "";
  const value = condition.value === undefined ? "" : String(condition.value);
  const op = typeof condition.op === "string" ? condition.op : "";
  if (!op) return value;
  return t("oCond", { op, value });
};

export const needText = (detail: Record<string, unknown> | null): string => {
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

export const optionHeadText = (text: string, detail: Record<string, unknown> | null): string => {
  const action = detail && typeof detail.action === "string" && detail.action
    ? t(`menu.${detail.action}`, { defaultValue: detail.action }) : "";
  if (action && text) return t("optionActionJoin", { action, title: text });
  return action || text || t("optionOther");
};
