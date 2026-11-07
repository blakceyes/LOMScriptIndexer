import { t } from "../../i18n";
import type { QueryContext, QueryError, QueryField, QueryNode } from "../../types/query";
import { QueryIndex, compile } from "./evaluate";
import { FIELDS } from "./fields";
import { parse } from "./parser";
import { suggest } from "./suggest";

export type { CompileResult } from "./evaluate";
export type { SuggestResult } from "./suggest";
export { QueryIndex };

export const createIndex = (context: QueryContext): QueryIndex => new QueryIndex(context);

const needsText = (source: string): boolean => {
  const parsed = parse(source);
  if (!parsed.ok || !parsed.ast) return false;
  const walk = (node: QueryNode | null): boolean => {
    if (!node) return false;
    if (node.type === "term") return node.field === "text";
    if (node.type === "not") return walk(node.operand);
    return walk(node.left) || walk(node.right);
  };
  return walk(parsed.ast);
};

export const query = {
  compile,
  fields: (): QueryField[] => FIELDS.slice(),
  needsText,
  suggest,
  errorTextOf: (error: QueryError): string =>
    error.key ? t(error.key, error.params) : error.message,
};
