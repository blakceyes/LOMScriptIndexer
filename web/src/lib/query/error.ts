import type { QueryError } from "../../types/cond";

export class QueryFail extends Error {
  key: string;
  params: Record<string, unknown>;
  at: number;

  constructor(key: string, at: number, params?: Record<string, unknown>) {
    super(key);
    this.key = key;
    this.params = params || {};
    this.at = at || 0;
  }
}

export const describeError = (error: unknown): QueryError => {
  const fail = error as Partial<QueryFail>;
  return {
    key: fail.key || "",
    params: fail.params || {},
    message: fail.message || String(error),
    column: (fail.at || 0) + 1,
  };
};
