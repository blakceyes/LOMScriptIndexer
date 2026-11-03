import { checkpoints } from "../data/checkpoints";
import { graph } from "../data/graph";
import { names } from "../data/names";
import { t } from "../i18n";
import type { CheckpointModel, CondNode } from "../types/cond";
import type { CheckRef } from "../types/beats";

const typeText = (kind: string): string => t(`vk.${kind}`, { defaultValue: kind || "" });

const checkText = (kind: string): string => t(`ck.${kind}`, { defaultValue: kind || "" });

const displayName = (kind: string, key: string): string => names.label(kind, key);

const countOf = (kind: string, key: string): number => {
  if (!key) return 0;
  if (kind === "flag") {
    const groups = graph.flagGroups(key);
    return groups.writes.length + groups.reads.length;
  }
  if (kind === "check") return graph.lookup("check", key).length;
  return graph.lookup(kind, key).length;
};

const singleChild = (node: CondNode): CondNode | null => {
  const narrow = node as Record<string, unknown>;
  const children = Array.isArray(narrow.items) ? narrow.items as CondNode[] : [];
  if (children.length !== 1) return null;
  if (narrow.negative) return null;
  if (narrow.op && narrow.op !== "sum") return null;
  return children[0];
};

const valueLabel = (input: CondNode | null): string => {
  if (!input) return "";
  const node = input as Record<string, unknown>;
  if (node.tag === "const") return String(node.value);
  if (node.tag === "random") return t("cRandom", { min: node.min as number, max: node.max as number });
  if (node.tag === "dice") return t("cDice");
  if (node.tag === "var" || node.tag === "check") {
    const kind = node.tag === "check" ? "check" : String(node.kind ?? "");
    const type = node.tag === "check" ? checkText(kind) : typeText(kind);
    const name = displayName(kind, String(node.key ?? ""));
    return t("cxValue", { type, name }) + (node.negative ? "×-1" : "");
  }
  if (node.tag === "group") {
    const child = singleChild(input);
    if (child) return valueLabel(child);
    const groupKey = node.op ? `grp.${String(node.op)}` : "";
    const items = Array.isArray(node.items) ? node.items as CondNode[] : [];
    const inner = items.map(valueLabel).join(" + ");
    return t("cGroup", {
      name: (node.name as string) || (groupKey ? t(groupKey) : ""),
      group: groupKey ? t(groupKey) : "",
      items: inner,
    }) + (node.negative ? "×-1" : "");
  }
  return "";
};

const label = (expr: CondNode | null): string => {
  if (!expr) return "";
  const node = expr as Record<string, unknown>;
  if (node.tag === "compare") {
    return `${label(node.left as CondNode)} ${(node.op as string) || "?"} ${label(node.right as CondNode)}`;
  }
  if (node.tag === "logic") {
    const joiner = ` ${node.op === "or" ? t("cxOr") : t("cxAnd")} `;
    const items = Array.isArray(node.items) ? node.items as CondNode[] : [];
    return items.map(label).join(joiner);
  }
  return valueLabel(expr);
};

const pick = (check: CheckRef | null, result?: number | null): CondNode | null => {
  if (!check || !check.key) return null;
  const model = checkpoints.get(check.key, check.kind);
  if (!model) return null;
  const branches = model.branches || [];
  if (!branches.length) return null;
  const type = model.kind || check.kind;
  const wanted = result === undefined ? check.result : result;
  if (type === "condition") return branches[0].expr || null;
  if (type !== "switch" && type !== "dice") return null;
  if (wanted === null || wanted === undefined) return null;
  for (const branch of branches) {
    if (branch.result === wanted) return branch.expr || null;
  }
  return null;
};

const fallback = (check: CheckRef | null, result?: number | null): { n: number; excluded: CondNode[] } | null => {
  if (!check || !check.key) return null;
  const model = checkpoints.get(check.key, check.kind);
  if (!model) return null;
  const type = model.kind || check.kind;
  if (type !== "switch" && type !== "dice") return null;
  const wanted = result === undefined ? check.result : result;
  if (wanted === null || wanted === undefined) return null;
  if (model.fallback === undefined || wanted !== model.fallback) return null;
  const branches = model.branches || [];
  const excluded: CondNode[] = [];
  for (const branch of branches) if (branch && branch.expr) excluded.push(branch.expr);
  return { n: branches.length, excluded };
};

const localizedName = (node: { kind?: string; key?: string } | null): string => {
  if (!node || !node.kind) return "";
  return displayName(node.kind, node.key || "");
};

export const condexpr = {
  fallback,
  label,
  localizedName,
  pick,
  valueLabel,
  countOf,
};

export type CondModel = CheckpointModel;
