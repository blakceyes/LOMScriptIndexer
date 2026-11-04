import { checkpoints } from "../data/checkpoints";
import { graph } from "../data/graph";
import { names } from "../data/names";
import { t } from "../i18n";
import type { CheckRef } from "../types/beats";
import type { CheckpointModel, ConditionNode } from "../types/condition";

export type ConditionPart =
  | { text: string }
  | {
    htmlTag: "span" | "button";
    className: string;
    title?: string;
    role?: string;
    kind?: string;
    lookup?: { kind: string; key: string };
    children: ConditionPart[];
  };

const LOOKUP_KINDS = new Set(["stat", "rel", "flag"]);
const INLINE_LOOKUP_KINDS = new Set(["stat", "rel", "flag", "check"]);

export const kindText = (kind: string): string => t(`vk.${kind}`, { defaultValue: kind || "" });

export const checkKindText = (kind: string): string => (
  t(`ck.${kind}`, { defaultValue: kind || "" })
);

const groupText = (op: string): string => t(`grp.${op}`, { defaultValue: op || "" });

const displayNameOf = (kind: string, key: string): string => names.label(kind, key);

const negativeSuffix = (node: ConditionNode): string => (
  "negative" in node && node.negative ? "×-1" : ""
);

const singleChild = (node: ConditionNode): ConditionNode | null => {
  if (node.tag !== "group") return null;
  const items = node.items || [];
  if (items.length !== 1 || node.negative) return null;
  if (node.op && node.op !== "sum") return null;
  return items[0];
};

export const facetUsageCount = (kind: string, key: string): number => {
  if (!key) return 0;
  if (kind === "flag") {
    const usage = graph.flagUsage(key);
    return usage.writers.length + usage.checkers.length;
  }
  return graph.nodesWithFacet(kind, key).length;
};

export const localizedName = (node: { kind?: string; key?: string } | null): string => (
  node && node.kind ? displayNameOf(node.kind, node.key || "") : ""
);

export const condText = (node: ConditionNode | null): string => {
  if (!node) return "";
  switch (node.tag) {
    case "const":
      return String(node.value ?? "");
    case "random":
      return t("cRandom", { min: node.min, max: node.max });
    case "dice":
      return t("cDice");
    case "var":
      return t("cVar", {
        type: kindText(node.kind),
        name: displayNameOf(node.kind, node.key),
      }) + negativeSuffix(node);
    case "check":
      return t("cVar", {
        type: checkKindText(node.kind),
        name: displayNameOf("check", node.key),
      }) + negativeSuffix(node);
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

const textPart = (value: string): ConditionPart => ({ text: value });

const span = (className: string, children: ConditionPart[], title?: string): ConditionPart => ({
  htmlTag: "span", className, children, title,
});

const chipPart = (node: Extract<ConditionNode, { tag: "var" | "check" }>): ConditionPart => {
  const isCheck = node.tag === "check";
  const kind = isCheck ? "check" : node.kind;
  const key = node.key;
  const label = displayNameOf(kind, key);
  const type = isCheck ? checkKindText(kind) : kindText(kind);
  const children: ConditionPart[] = [
    span("cx-type", [textPart(type)]),
    span("cx-name", [textPart(label)]),
  ];
  if ((kind === "flag" || kind === "check") && key && key !== label) {
    children.push(span("cx-id", [textPart(key)]));
  }
  if (node.negative) children.push(span("cx-neg", [textPart("×-1")]));
  const count = facetUsageCount(kind, key);
  const hint = count
    ? t("cxVarTip", { type, name: label, n: count })
    : t("cxVarTipNone", { type, name: label });
  if (INLINE_LOOKUP_KINDS.has(kind) && count > 0) {
    return {
      htmlTag: "button",
      className: "cx-var is-link",
      children,
      title: hint,
      role: "button",
      kind,
      lookup: { kind, key },
    };
  }
  return { htmlTag: "span", className: "cx-var", children, title: hint };
};

const groupPart = (node: Extract<ConditionNode, { tag: "group" }>): ConditionPart => {
  const child = singleChild(node);
  if (child) {
    const leaf = nodePart(child);
    if (node.name && !("text" in leaf) && !leaf.title) leaf.title = node.name;
    return leaf;
  }
  const op = node.op || "";
  const children: ConditionPart[] = [];
  if (op) children.push(span("cx-gtag", [textPart(groupText(op))]));
  const items: ConditionPart[] = [span("cx-bracket", [textPart("[")])];
  const list = node.items || [];
  list.forEach((item, index) => {
    if (index) items.push(span("cx-gsep", [textPart(" + ")]));
    items.push(nodePart(item));
  });
  if (!list.length) items.push(span("cx-const", [textPart(node.name || "—")]));
  items.push(span("cx-bracket", [textPart("]")]));
  children.push(span("cx-gitems", items));
  if (node.negative) children.push(span("cx-neg", [textPart("×-1")]));
  return span("cx-group", children, node.name || undefined);
};

const nodePart = (node: ConditionNode): ConditionPart => {
  switch (node.tag) {
    case "const":
      return span("cx-const", [textPart(String(node.value ?? ""))]);
    case "random":
      return span("cx-const cx-rand", [
        textPart(t("cRandom", { min: node.min, max: node.max })),
      ]);
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

const inlineNodePart = (input: ConditionNode | null): ConditionPart => {
  if (!input) return span("cx-empty", [textPart(t("lookupCondEmpty"))]);
  if (input.tag === "compare") {
    return span("cx-cmp", [
      inlineNodePart(input.left || null),
      span("cx-op", [textPart(input.op || "?")]),
      inlineNodePart(input.right || null),
    ]);
  }
  if (input.tag === "logic") {
    const joiner = input.op === "or" ? t("cxOr") : t("cxAnd");
    const children: ConditionPart[] = [];
    (input.items || []).forEach((child, index) => {
      if (index) children.push(span("cx-op", [textPart(joiner)]));
      children.push(inlineNodePart(child));
    });
    return span("cx-cmp", children);
  }
  return nodePart(input);
};

export const condParts = (expr: ConditionNode | null): ConditionPart => {
  if (!expr) return span("cx-expr", []);
  const joiner = expr.tag === "logic" ? (expr.op === "or" ? t("cxOr") : t("cxAnd")) : "";
  const items = expr.tag === "logic" ? (expr.items || []) : [expr];
  const lines: ConditionPart[] = items.map((node, index) => {
    const children: ConditionPart[] = [];
    if (index && joiner) children.push(span("cx-logic", [textPart(joiner)]));
    children.push(inlineNodePart(node));
    return span("cx-line", children);
  });
  return span("cx-expr", lines);
};

const checkpointOf = (
  check: CheckRef | null,
): { checkpoint: CheckpointModel; kind: string } | null => {
  if (!check || !check.key) return null;
  const checkpoint = checkpoints.getByKey(check.key, check.kind);
  if (!checkpoint) return null;
  return { checkpoint, kind: checkpoint.kind || check.kind };
};

export const checkpointExpr = (
  check: CheckRef | null,
  result?: number | null,
): ConditionNode | null => {
  const found = checkpointOf(check);
  if (!found) return null;
  const branches = found.checkpoint.branches || [];
  if (!branches.length) return null;
  const expectedResult = result === undefined ? check?.expectedResult : result;
  if (found.kind === "condition") return branches[0].expr || null;
  if (found.kind !== "switch" && found.kind !== "dice") return null;
  if (expectedResult === null || expectedResult === undefined) return null;
  for (const branch of branches) {
    if (branch.result === expectedResult) return branch.expr || null;
  }
  return null;
};

export type ConditionFallback = { lineCount: number; excluded: ConditionNode[] };

export const checkpointFallback = (check: CheckRef | null,
                                   result?: number | null,
                                   ): ConditionFallback | null => {
  const found = checkpointOf(check);
  if (!found) return null;
  if (found.kind !== "switch" && found.kind !== "dice") return null;
  const expectedResult = result === undefined ? check?.expectedResult : result;
  if (expectedResult === null || expectedResult === undefined) return null;
  if (found.checkpoint.fallback === undefined
    || expectedResult !== found.checkpoint.fallback) return null;
  const branches = found.checkpoint.branches || [];
  const excluded: ConditionNode[] = [];
  for (const branch of branches) if (branch && branch.expr) excluded.push(branch.expr);
  return { lineCount: branches.length, excluded };
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
    const name = displayNameOf("stat", key);
    const delta = signed(value);
    return delta ? t("metaValue", { name, delta }) : name;
  }
  if (kind === "rel") {
    const name = displayNameOf("rel", key);
    const delta = signed(value);
    return delta
      ? t("metaRelation", { name, delta })
      : t("metaRelation", { name, delta: "" }).trim();
  }
  if (kind === "flag") {
    const name = displayNameOf("flag", key);
    const delta = signed(value);
    return delta ? t("metaFlag", { name, delta }) : name;
  }
  if (kind === "setflag") {
    return t("metaAssignFlag", { name: displayNameOf("flag", key), value });
  }
  if (kind === "setstat") {
    return t("metaAssign", { name: displayNameOf("stat", key), value });
  }
  if (kind === "setrel") {
    return t("metaAssignRelation", { name: displayNameOf("rel", key), value });
  }
  if (kind === "book") return gain(t("metaBook", { name: displayNameOf("book", key) }), value);
  if (kind === "misc") return gain(t("metaItem", { name: displayNameOf("misc", key) }), value);
  if (kind === "special") {
    return gain(t("metaItem", { name: displayNameOf("special", key) }), value);
  }
  if (kind === "talent") {
    return t("metaTalent", { name: displayNameOf("talent", key), value });
  }
  if (kind === "library") return t("metaLibrary", { name: displayNameOf("chronicle", key) });
  if (kind === "mission") return t("metaMission", { key });
  if (kind === "dice") return t("metaDice", { name: displayNameOf("check", key) });
  return "";
};

export const metaTarget = (
  kind: string,
  key: string,
): { kind: string; key: string } | null => {
  if (!key) return null;
  if (kind === "setflag") return { kind: "flag", key };
  return LOOKUP_KINDS.has(kind) ? { kind, key } : null;
};

export const optionCondText = (condition: Record<string, unknown> | null): string => {
  if (!condition || typeof condition !== "object") return "";
  const operand = condition.operand === undefined ? "" : String(condition.operand);
  const op = typeof condition.op === "string" ? condition.op : "";
  if (!op) return operand;
  return t("option.cond", { op, value: operand });
};

export const optionRequirementsText = (
  detail: Record<string, unknown> | null,
): string => {
  const requirements = detail && Array.isArray(detail.requirements)
    ? detail.requirements : [];
  return requirements.filter((item: unknown) => (
    item && typeof item === "object"
    && typeof (item as Record<string, unknown>).kind === "string"
    && (item as Record<string, unknown>).kind
  )).map((item: unknown) => {
    const row = item as Record<string, unknown>;
    return t("option.need", {
      label: t(`need.${String(row.kind)}`, { defaultValue: String(row.kind) }),
      op: row.op === undefined ? "" : row.op,
      value: row.value === undefined ? "" : row.value,
    });
  }).join(" · ");
};

export const optionHeadText = (
  text: string,
  detail: Record<string, unknown> | null,
): string => {
  const action = detail && typeof detail.action === "string" && detail.action
    ? t(`action.${detail.action}`, { defaultValue: detail.action }) : "";
  if (action && text) return t("optionActionJoin", { action, title: text });
  return action || text || t("optionOther");
};
