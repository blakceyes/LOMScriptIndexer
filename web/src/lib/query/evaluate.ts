import { chapterTitle } from "../../i18n";
import type {
  QueryContext, QueryError, QueryField, QueryNode, QueryTerm, QueryValue,
} from "../../types/cond";
import { QueryFail, describeError } from "./error";
import {
  FIELD_BY_ID, KIND_ALIAS, KIND_VALUES, NO_WORDS, VIA_ALIAS, VIA_VALUES, YES_WORDS, facetKey,
} from "./fields";
import { parse, type ParseResult } from "./parser";

const union = (a: Set<number> | null, b: Set<number> | null): Set<number> | null => {
  if (!a) return b;
  if (!b) return a;
  const out = new Set(a);
  for (const value of b) out.add(value);
  return out;
};

const intersect = (a: Set<number> | null, b: Set<number> | null): Set<number> | null => {
  if (!a) return b ? new Set(b) : null;
  if (!b) return new Set(a);
  const small = a.size <= b.size ? a : b;
  const big = small === a ? b : a;
  const out = new Set<number>();
  for (const value of small) if (big.has(value)) out.add(value);
  return out;
};

const valuesOf = (row: unknown, field: QueryField): string[] => {
  const raw = row ? (row as Record<string, unknown>)[facetKey(field)] : undefined;
  if (!raw) return [];
  return Array.isArray(raw) ? raw.map(String) : String(raw).split(",");
};

const kindKey = (raw: string): string => {
  const value = KIND_ALIAS.get(raw) || raw;
  return value === "ending" ? "leaf" : value === "place" ? "sys" : value;
};

const kindPass = (kind: string, index: number, ctx: QueryContext): boolean => {
  const node = ctx.nodes[index];
  switch (kind) {
    case "entry":
      return node.in === 0;
    case "leaf":
      return node.out === 0;
    case "orphan":
      return node.in === 0 && node.out === 0;
    case "temp":
      return ctx.edgeGroup(index, "temp");
    case "sys":
      return ctx.edgeGroup(index, "position") || (node.systemIn || 0) > 0;
    case "jump":
      return node.out > 0;
    default:
      return false;
  }
};

const viaPass = (index: number, ctx: QueryContext, value: string): boolean => {
  const node = ctx.nodes[index];
  if (value === "combat") return node.entry === "combat";
  if (value === "free") return node.entry === "free";
  return ctx.edgeGroup(index, "position") || (node.systemIn || 0) > 0;
};

export class QueryIndex {
  private ctx: QueryContext;
  private all: Set<number> | null = null;
  private facets = new Map<string, Map<string, Set<number>>>();
  private cache = new Map<string, QueryValue[]>();

  constructor(ctx: QueryContext) {
    this.ctx = ctx;
  }

  universe(): Set<number> {
    if (!this.all) {
      const set = new Set<number>();
      for (let index = 0; index < this.ctx.count; index++) set.add(index);
      this.all = set;
    }
    return this.all;
  }

  complement(set: Set<number> | null): Set<number> {
    const out = new Set<number>();
    for (const value of this.universe()) if (!set || !set.has(value)) out.add(value);
    return out;
  }

  facetIndex(field: QueryField): Map<string, Set<number>> {
    const cached = this.facets.get(field.id);
    if (cached) return cached;
    const map = new Map<string, Set<number>>();
    for (let index = 0; index < this.ctx.count; index++) {
      for (const key of valuesOf(this.ctx.facets[index], field)) {
        if (!key) continue;
        const lower = key.toLowerCase();
        let bucket = map.get(lower);
        if (!bucket) {
          bucket = new Set<number>();
          map.set(lower, bucket);
        }
        bucket.add(index);
      }
    }
    const labels = this.ctx.names[facetKey(field)];
    if (labels) {
      for (const key of Object.keys(labels)) {
        const bucket = map.get(key.toLowerCase());
        if (!bucket) continue;
        const label = String(labels[key] || "").toLowerCase();
        if (!label || label === key.toLowerCase()) continue;
        let named = map.get(label);
        if (!named) {
          named = new Set<number>();
          map.set(label, named);
        }
        for (const value of bucket) named.add(value);
      }
    }
    this.facets.set(field.id, map);
    return map;
  }

  facetValues(field: QueryField): QueryValue[] {
    const cached = this.cache.get(field.id);
    if (cached) return cached;
    if (field.id === "kind") {
      const out = KIND_VALUES.map((value) => ({ value, label: "", count: this.kindCount(value) }))
        .sort((a, b) => b.count - a.count);
      this.cache.set(field.id, out);
      return out;
    }
    if (field.id === "via") {
      const out = VIA_VALUES.map((value) => {
        let count = 0;
        for (let index = 0; index < this.ctx.count; index++) {
          if (viaPass(index, this.ctx, value)) count++;
        }
        return { value, label: "", count };
      });
      this.cache.set(field.id, out);
      return out;
    }
    if (field.id === "chapter") {
      const out = this.ctx.chapters.map((chapter) => ({
        value: String(chapter.id),
        label: chapterTitle(chapter as { kind?: string; number?: number | null }),
        count: Number(chapter.count) || 0,
      }));
      this.cache.set(field.id, out);
      return out;
    }
    const counts = new Map<string, number>();
    for (let index = 0; index < this.ctx.count; index++) {
      for (const key of valuesOf(this.ctx.facets[index], field)) {
        if (!key) continue;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    const labels = this.ctx.names[facetKey(field)] || {};
    const out: QueryValue[] = [];
    for (const [key, count] of counts) {
      out.push({ value: key, label: labels[key] || "", count });
    }
    out.sort((a, b) => b.count - a.count || (a.value < b.value ? -1 : 1));
    this.cache.set(field.id, out);
    return out;
  }

  kindCount(kind: string): number {
    let count = 0;
    for (let index = 0; index < this.ctx.count; index++) {
      if (kindPass(kind, index, this.ctx)) count++;
    }
    return count;
  }

  textSet(term: QueryTerm, field: QueryField): Set<number> {
    const map = this.facetIndex(field);
    const needle = String(term.value).toLowerCase();
    const out = new Set<number>();
    if (needle === "*") {
      for (const bucket of map.values()) for (const value of bucket) out.add(value);
      return term.op === "ne" ? this.complement(out) : out;
    }
    if (term.op === "eq" || term.op === "ne") {
      const hit = map.get(needle);
      if (hit) for (const value of hit) out.add(value);
      return term.op === "ne" ? this.complement(out) : out;
    }
    for (const [key, bucket] of map) {
      if (key.indexOf(needle) >= 0) for (const value of bucket) out.add(value);
    }
    return out;
  }

  numberSet(term: QueryTerm, field: QueryField): Set<number> {
    const text = String(term.value).trim().toLowerCase();
    let op = term.op;
    let needle: number;
    if (YES_WORDS.indexOf(text) >= 0) {
      needle = 1;
      if (op === "contains" || op === "eq") op = "ge";
    } else if (NO_WORDS.indexOf(text) >= 0) {
      needle = 0;
      if (op === "contains") op = "eq";
    } else {
      needle = Number(text);
    }
    if (!Number.isFinite(needle)) throw new QueryFail("qErrNumber", term.at, { field: field.id });

    const out = new Set<number>();
    for (let index = 0; index < this.ctx.count; index++) {
      const node = this.ctx.nodes[index];
      const facet = this.ctx.facets[index] as Record<string, number> | undefined;
      const value = field.node ? node[field.node as "out" | "in" | "say"] : (facet?.[facetKey(field)] || 0);
      let pass = false;
      switch (op) {
        case "contains":
        case "eq":
          pass = value === needle;
          break;
        case "ne":
          pass = value !== needle;
          break;
        case "gt":
          pass = value > needle;
          break;
        case "ge":
          pass = value >= needle;
          break;
        case "lt":
          pass = value < needle;
          break;
        case "le":
          pass = value <= needle;
          break;
        default:
          break;
      }
      if (pass) out.add(index);
    }
    return out;
  }

  viaSet(term: QueryTerm): Set<number> {
    const value = VIA_ALIAS.get(String(term.value).toLowerCase()) || String(term.value).toLowerCase();
    if (VIA_VALUES.indexOf(value) < 0) {
      throw new QueryFail("qErrVia", term.at, {
        value: term.value, allowed: VIA_VALUES.join("/"),
      });
    }
    const out = new Set<number>();
    for (let index = 0; index < this.ctx.count; index++) {
      if (viaPass(index, this.ctx, value)) out.add(index);
    }
    return term.op === "ne" ? this.complement(out) : out;
  }

  enumSet(term: QueryTerm, field: QueryField): Set<number> {
    if (field.id === "via") return this.viaSet(term);
    const raw = String(term.value).toLowerCase();
    const value = kindKey(raw);
    if (KIND_VALUES.indexOf(value) < 0) {
      throw new QueryFail("qErrKind", term.at, {
        value: term.value, allowed: KIND_VALUES.join("/"),
      });
    }
    const out = new Set<number>();
    for (let index = 0; index < this.ctx.count; index++) {
      if (kindPass(value, index, this.ctx)) out.add(index);
    }
    return term.op === "ne" ? this.complement(out) : out;
  }

  stringSet(term: QueryTerm, field: QueryField): Set<number> {
    const needle = String(term.value).toLowerCase();
    const out = new Set<number>();
    for (let index = 0; index < this.ctx.count; index++) {
      let haystack: string;
      if (field.id === "id") {
        haystack = this.ctx.nodes[index].id.toLowerCase();
      } else if (field.id === "chapter") {
        const chapter = this.ctx.chapters[this.ctx.nodes[index].chapter] || { id: "" };
        const title = chapterTitle(chapter as { kind?: string; number?: number | null });
        haystack = `${title} ${String(chapter.id || "")}`.toLowerCase();
      } else {
        haystack = this.ctx.textOf(index) || "";
      }
      let pass = term.op === "eq" ? haystack === needle : haystack.indexOf(needle) >= 0;
      if (term.op === "ne") pass = !pass;
      if (pass) out.add(index);
    }
    return out;
  }

  evaluate(node: QueryNode | null): Set<number> {
    if (!node) return this.universe();
    switch (node.t) {
      case "or":
        return union(this.evaluate(node.l), this.evaluate(node.r)) as Set<number>;
      case "xor": {
        const a = this.evaluate(node.l);
        const b = this.evaluate(node.r);
        const only = new Set<number>();
        for (const value of a) if (!b.has(value)) only.add(value);
        for (const value of b) if (!a.has(value)) only.add(value);
        return only;
      }
      case "and":
        return intersect(this.evaluate(node.l), this.evaluate(node.r)) as Set<number>;
      case "not":
        return this.complement(this.evaluate(node.x));
      case "term": {
        const field = FIELD_BY_ID[node.field];
        if (field.kind === "number") return this.numberSet(node, field);
        if (field.kind === "enum") return this.enumSet(node, field);
        if (field.kind === "string") return this.stringSet(node, field);
        return this.textSet(node, field);
      }
      default:
        return this.universe();
    }
  }
}

export type CompileResult =
  | { ok: true; ast: QueryNode | null; set: Set<number> | null }
  | { ok: false; error: QueryError };

export const compile = (source: string, index: QueryIndex): CompileResult => {
  const parsed: ParseResult = parse(source);
  if (!parsed.ok) return parsed;
  if (!parsed.ast) return { ok: true, ast: null, set: null };
  try {
    return { ok: true, ast: parsed.ast, set: index.evaluate(parsed.ast) };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
};
