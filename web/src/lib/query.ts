import { t, all as i18nAll, chapterTitle } from "../i18n";
import type {
  QueryContext, QueryError, QueryField, QueryNode, QuerySuggestion, QueryTerm, QueryValue,
} from "../types/cond";

const FIELD_SPECS: QueryField[] = [
  { id: "speaker", kind: "text", aliases: ["speaker", "say"] },
  { id: "flag", kind: "text", aliases: ["flag", "flags"] },
  { id: "check", kind: "text", aliases: ["check", "checks"] },
  { id: "stat", kind: "text", aliases: ["stat", "stats"] },
  { id: "rel", kind: "text", aliases: ["rel"] },
  { id: "option", kind: "number", aliases: ["option", "options"] },
  { id: "lock", kind: "number", aliases: ["lock", "locks"] },
  { id: "dice", kind: "number", aliases: ["dice"] },
  { id: "out", kind: "number", node: "out", aliases: ["out"] },
  { id: "in", kind: "number", node: "in", aliases: ["in"] },
  { id: "saycount", kind: "number", node: "say", aliases: ["saycount"] },
  { id: "id", kind: "string", aliases: ["id", "script"] },
  { id: "chapter", kind: "string", aliases: ["chapter"] },
  { id: "text", kind: "string", aliases: ["text"] },
  { id: "kind", kind: "enum", aliases: ["kind", "type"] },
  { id: "via", kind: "enum", aliases: ["via"] },
];

const ROOTS = ["AND", "OR", "NOT", "XOR"];

const KIND_VALUES = ["entry", "leaf", "orphan", "temp", "sys", "jump"];
const VIA_VALUES = ["combat", "free", "position"];

const FACET_KEY: Record<string, string> = {
  speaker: "speakers", flag: "flags", check: "checks", stat: "stats",
  rel: "rels", option: "options", lock: "locks", dice: "dice",
};

const buildFields = (): { fields: QueryField[]; byId: Record<string, QueryField>; byAlias: Record<string, QueryField> } => {
  const fields = FIELD_SPECS.map((field) => {
    const aliases = field.aliases.slice();
    for (const extra of i18nAll(`q.${field.id}`)) {
      if (aliases.indexOf(extra) < 0) aliases.push(extra);
    }
    return { ...field, aliases };
  });
  const byId: Record<string, QueryField> = {};
  const byAlias: Record<string, QueryField> = {};
  for (const field of fields) {
    byId[field.id] = field;
    for (const alias of field.aliases) byAlias[String(alias).toLowerCase()] = field;
  }
  return { fields, byId, byAlias };
};

const built = buildFields();
const FIELDS = built.fields;
const BY_ID = built.byId;
const BY_ALIAS = built.byAlias;

const aliasPairs = (key: string): Map<string, string> => {
  const map = new Map<string, string>();
  for (const pair of i18nAll(key)) {
    const parts = String(pair).split("=");
    if (parts.length === 2) map.set(parts[0].trim().toLowerCase(), parts[1].trim());
  }
  return map;
};

const LOGIC_ALIAS = aliasPairs("q.logic");
const KIND_ALIAS = aliasPairs("q.enum.kind");
const VIA_ALIAS = aliasPairs("q.enum.via");
const YES_WORDS = ["yes", "y", "true"].concat(i18nAll("q.yes"));
const NO_WORDS = ["no", "n", "false"].concat(i18nAll("q.no"));

class QueryFail extends Error {
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

const err = (key: string, at: number, params?: Record<string, unknown>): QueryFail => (
  new QueryFail(key, at, params)
);

type Token = {
  type: string;
  value: string | number;
  at: number;
};

const isSpace = (ch: string): boolean => ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
const isStop = (ch: string): boolean => isSpace(ch) || "()!:,=\"'<>".indexOf(ch) >= 0;

const tokenize = (source: string): Token[] => {
  const tokens: Token[] = [];
  let index = 0;
  const size = source.length;
  while (index < size) {
    const ch = source[index];
    if (isSpace(ch)) {
      index++;
      continue;
    }
    if (ch === "(" || ch === ")") {
      tokens.push({ type: ch === "(" ? "lparen" : "rparen", value: ch, at: index });
      index++;
      continue;
    }
    if (ch === "'" || ch === '"') {
      const quote = ch;
      const start = ++index;
      let piece = "";
      while (index < size && source[index] !== quote) {
        if (source[index] === "\\" && index + 1 < size) {
          piece += source[index + 1];
          index += 2;
          continue;
        }
        piece += source[index++];
      }
      if (index >= size) throw err("qErrQuote", start - 1);
      index++;
      tokens.push({ type: "string", value: piece, at: start });
      continue;
    }
    if (ch === "&" && source[index + 1] === "&") {
      tokens.push({ type: "op", value: "AND", at: index });
      index += 2;
      continue;
    }
    if (ch === "|" && source[index + 1] === "|") {
      tokens.push({ type: "op", value: "OR", at: index });
      index += 2;
      continue;
    }
    if (ch === "!" && source[index + 1] === "=") {
      tokens.push({ type: "op", value: "!=", at: index });
      index += 2;
      continue;
    }
    if (ch === "!") {
      tokens.push({ type: "op", value: "NOT", at: index });
      index++;
      continue;
    }
    if (ch === ">") {
      if (source[index + 1] === "=") {
        tokens.push({ type: "op", value: ">=", at: index });
        index += 2;
      } else {
        tokens.push({ type: "op", value: ">", at: index });
        index++;
      }
      continue;
    }
    if (ch === "<") {
      if (source[index + 1] === "=") {
        tokens.push({ type: "op", value: "<=", at: index });
        index += 2;
      } else {
        tokens.push({ type: "op", value: "<", at: index });
        index++;
      }
      continue;
    }
    if (ch === "\u2265") {
      tokens.push({ type: "op", value: ">=", at: index });
      index++;
      continue;
    }
    if (ch === "\u2264") {
      tokens.push({ type: "op", value: "<=", at: index });
      index++;
      continue;
    }
    if (ch === "=") {
      tokens.push({ type: "op", value: "=", at: index });
      index++;
      continue;
    }
    if (ch === ":") {
      tokens.push({ type: "op", value: ":", at: index });
      index++;
      continue;
    }
    if (ch === ",") {
      tokens.push({ type: "comma", value: ",", at: index });
      index++;
      continue;
    }
    const from = index;
    while (index < size && !isStop(source[index])) index++;
    const word = source.slice(from, index);
    if (!word) throw err("qErrChar", index, { ch });
    if (/^-?\d+(\.\d+)?$/.test(word)) tokens.push({ type: "number", value: Number(word), at: from });
    else if (ROOTS.indexOf(word.toUpperCase()) >= 0) tokens.push({ type: "op", value: word.toUpperCase(), at: from });
    else if (LOGIC_ALIAS.has(word.toLowerCase())) {
      tokens.push({ type: "op", value: LOGIC_ALIAS.get(word.toLowerCase()) as string, at: from });
    } else tokens.push({ type: "ident", value: word, at: from });
  }
  tokens.push({ type: "eof", value: "", at: size });
  return tokens;
};

class Parser {
  source: string;
  tokens: Token[];
  pos: number;

  constructor(source: string) {
    this.source = source;
    this.tokens = tokenize(source);
    this.pos = 0;
  }

  peek(offset?: number): Token {
    return this.tokens[this.pos + (offset || 0)];
  }

  next(): Token {
    return this.tokens[this.pos++];
  }

  isOp(value: string, offset?: number): boolean {
    const token = this.peek(offset);
    return !!token && token.type === "op" && token.value === value;
  }

  parseOr(): QueryNode {
    let node = this.parseAnd();
    while (this.isOp("OR") || this.isOp("XOR")) {
      const op = this.next().value;
      node = { t: op === "OR" ? "or" : "xor", l: node, r: this.parseAnd() } as QueryNode;
    }
    return node;
  }

  startsTerm(): boolean {
    const token = this.peek();
    if (!token) return false;
    if (token.type === "lparen") return true;
    if (token.type === "op" && token.value === "NOT") return true;
    return token.type === "ident";
  }

  parseAnd(): QueryNode {
    let node = this.parseUnary();
    for (;;) {
      if (this.isOp("AND")) {
        this.next();
        node = { t: "and", l: node, r: this.parseUnary() };
        continue;
      }
      if (this.startsTerm()) {
        node = { t: "and", l: node, r: this.parseUnary() };
        continue;
      }
      return node;
    }
  }

  parseUnary(): QueryNode {
    if (this.isOp("NOT")) {
      this.next();
      return { t: "not", x: this.parseUnary() };
    }
    const token = this.peek();
    if (token.type === "lparen") {
      this.next();
      const inner = this.parseOr();
      if (this.peek().type !== "rparen") throw err("qErrParen", this.peek().at);
      this.next();
      return inner;
    }
    return this.parseTerm();
  }

  parseTerm(): QueryNode {
    const token = this.peek();
    if (token.type !== "ident") throw err("qErrFieldName", token.at);
    this.next();
    const field = BY_ALIAS[String(token.value).toLowerCase()];
    if (!field) throw err("qErrUnknownField", token.at, { field: token.value });

    const opToken = this.peek();
    if (opToken.type !== "op" || [":", "=", "!=", ">", ">=", "<", "<="].indexOf(String(opToken.value)) < 0) {
      throw err("qErrOperator", opToken.at, { field: field.id });
    }
    this.next();

    const valueToken = this.peek();
    if (valueToken.type === "op" && valueToken.value === "NOT") throw err("qErrNeedValue", valueToken.at);
    let raw: string | number;
    if (valueToken.type === "string") raw =String(valueToken.value);
    else if (valueToken.type === "number") raw = Number(valueToken.value);
    else if (valueToken.type === "ident") raw = String(valueToken.value);
    else throw err("qErrCompareValue", valueToken.at);
    this.next();

    const opMap: Record<string, string> = {
      "=": "eq", "!=": "ne", ">": "gt", ">=": "ge", "<": "lt", "<=": "le",
    };
    const op = opToken.value === ":" ? "contains" : opMap[String(opToken.value)];

    if (field.kind !== "number" && ["gt", "ge", "lt", "le"].indexOf(op) >= 0) {
      throw err("qErrNoCompare", opToken.at, { field: field.id });
    }
    return { t: "term", field: field.id, op, value: raw, at: token.at };
  }
}

const describeError = (error: unknown): QueryError => {
  const fail = error as Partial<QueryFail>;
  return {
    key: fail.key || "",
    params: fail.params || {},
    message: fail.message || String(error),
    column: (fail.at || 0) + 1,
  };
};

export type ParseResult =
  | { ok: true; ast: QueryNode | null }
  | { ok: false; error: QueryError };

const parse = (source: string): ParseResult => {
  try {
    const parser = new Parser(String(source || ""));
    if (parser.peek().type === "eof") return { ok: true, ast: null };
    const ast = parser.parseOr();
    const rest = parser.peek();
    if (rest.type !== "eof") throw err("qErrTrailing", rest.at, { value: rest.value });
    return { ok: true, ast };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
};

const allSet = (ctx: QueryContext): Set<number> => {
  if (!ctx._all) {
    const set = new Set<number>();
    for (let index = 0; index < ctx.count; index++) set.add(index);
    ctx._all = set;
  }
  return ctx._all;
};

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

const complement = (set: Set<number> | null, ctx: QueryContext): Set<number> => {
  const out = new Set<number>();
  for (const value of allSet(ctx)) if (!set || !set.has(value)) out.add(value);
  return out;
};

const facetKey = (field: QueryField): string => FACET_KEY[field.id] || field.id;

const valuesOf = (row: unknown, field: QueryField): string[] => {
  const raw = row ? (row as Record<string, unknown>)[facetKey(field)] : undefined;
  if (!raw) return [];
  return Array.isArray(raw) ? raw.map(String) : String(raw).split(",");
};

const valueIndex = (ctx: QueryContext, field: QueryField): Map<string, Set<number>> => {
  if (!ctx._index) ctx._index = {};
  const cached = ctx._index[field.id];
  if (cached) return cached;
  const map = new Map<string, Set<number>>();
  for (let index = 0; index < ctx.count; index++) {
    for (const key of valuesOf(ctx.facets[index], field)) {
      if (!key) continue;
      let bucket = map.get(key.toLowerCase());
      if (!bucket) {
        bucket = new Set<number>();
        map.set(key.toLowerCase(), bucket);
      }
      bucket.add(index);
    }
  }
  const names = ctx.names && ctx.names[field.id === "speaker" ? "speakers" : `${field.id}s`];
  if (names) {
    for (const key of Object.keys(names)) {
      const bucket = map.get(key.toLowerCase());
      if (!bucket) continue;
      const label = String(names[key] || "").toLowerCase();
      if (!label || label === key.toLowerCase()) continue;
      let named = map.get(label);
      if (!named) {
        named = new Set<number>();
        map.set(label, named);
      }
      for (const value of bucket) named.add(value);
    }
  }
  ctx._index[field.id] = map;
  return map;
};

const textSet = (term: QueryTerm, ctx: QueryContext, field: QueryField): Set<number> => {
  const map = valueIndex(ctx, field);
  const needle = String(term.value).toLowerCase();
  const out = new Set<number>();
  if (needle === "*") {
    for (const bucket of map.values()) for (const value of bucket) out.add(value);
    return term.op === "ne" ? complement(out, ctx) : out;
  }
  if (term.op === "eq" || term.op === "ne") {
    const hit = map.get(needle);
    if (hit) for (const value of hit) out.add(value);
    return term.op === "ne" ? complement(out, ctx) : out;
  }
  for (const [key, bucket] of map) {
    if (key.indexOf(needle) >= 0) for (const value of bucket) out.add(value);
  }
  return out;
};

const numberSet = (term: QueryTerm, ctx: QueryContext, field: QueryField): Set<number> => {
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
  if (!Number.isFinite(needle)) throw err("qErrNumber", term.at, { field: field.id });

  const out = new Set<number>();
  for (let index = 0; index < ctx.count; index++) {
    const node = ctx.nodes[index] as unknown as Record<string, number>;
    const facet = ctx.facets[index] as Record<string, number> | undefined;
    const value = field.node
      ? node[field.node]
      : (facet && facet[facetKey(field)]) || 0;
    let pass = false;
    switch (op) {
      case "contains": case "eq": pass = value === needle; break;
      case "ne": pass = value !== needle; break;
      case "gt": pass = value > needle; break;
      case "ge": pass = value >= needle; break;
      case "lt": pass = value < needle; break;
      case "le": pass = value <= needle; break;
      default: break;
    }
    if (pass) out.add(index);
  }
  return out;
};

const viaCanon = (value: string | number): string => {
  const text = String(value).toLowerCase();
  return VIA_ALIAS.get(text) || text;
};

const viaPass = (node: QueryContext["nodes"][number], index: number, ctx: QueryContext, value: string): boolean => {
  if (value === "combat") return node.entry === "combat";
  if (value === "free") return node.entry === "free";
  return ctx.edgeGroup(index, "position") || (node.systemIn || 0) > 0;
};

const viaSet = (term: QueryTerm, ctx: QueryContext): Set<number> => {
  const value = viaCanon(term.value);
  if (VIA_VALUES.indexOf(value) < 0) {
    throw err("qErrVia", term.at, { value: term.value, allowed: VIA_VALUES.join("/") });
  }
  const out = new Set<number>();
  for (let index = 0; index < ctx.count; index++) {
    if (viaPass(ctx.nodes[index], index, ctx, value)) out.add(index);
  }
  return term.op === "ne" ? complement(out, ctx) : out;
};

const enumSet = (term: QueryTerm, ctx: QueryContext, field: QueryField): Set<number> => {
  if (field.id === "via") return viaSet(term, ctx);
  const raw = String(term.value).toLowerCase();
  const value = KIND_ALIAS.get(raw) || raw;
  const out = new Set<number>();
  for (let index = 0; index < ctx.count; index++) {
    const node = ctx.nodes[index];
    let pass = false;
    switch (value) {
      case "entry": pass = node.in === 0; break;
      case "leaf": case "ending": pass = node.out === 0; break;
      case "orphan": pass = node.in === 0 && node.out === 0; break;
      case "temp": pass = ctx.edgeGroup(index, "temp"); break;
      case "sys": case "place":
        pass = ctx.edgeGroup(index, "position") || (node.systemIn || 0) > 0;
        break;
      case "jump": pass = node.out > 0; break;
      default:
        throw err("qErrKind", term.at, {
          value: term.value, allowed: KIND_VALUES.join("/"),
        });
    }
    if (pass) out.add(index);
  }
  return term.op === "ne" ? complement(out, ctx) : out;
};

const stringSet = (term: QueryTerm, ctx: QueryContext, field: QueryField): Set<number> => {
  const needle = String(term.value).toLowerCase();
  const out = new Set<number>();
  for (let index = 0; index < ctx.count; index++) {
    let haystack: string;
    if (field.id === "id") {
      haystack = ctx.nodes[index].id.toLowerCase();
    } else if (field.id === "chapter") {
      const chapter = ctx.chapters[ctx.nodes[index].chapter] || {};
      haystack = `${chapterTitle(chapter as { kind?: string; number?: number | null })} ${String(chapter.id || "")}`.toLowerCase();
    } else {
      haystack = ctx.textOf(index) || "";
    }
    let pass = term.op === "eq" ? haystack === needle : haystack.indexOf(needle) >= 0;
    if (term.op === "ne") pass = !pass;
    if (pass) out.add(index);
  }
  return out;
};

const evalNode = (node: QueryNode | null, ctx: QueryContext): Set<number> => {
  if (!node) return allSet(ctx);
  switch (node.t) {
    case "or": return union(evalNode(node.l, ctx), evalNode(node.r, ctx)) as Set<number>;
    case "xor": {
      const a = evalNode(node.l, ctx);
      const b = evalNode(node.r, ctx);
      const only = new Set<number>();
      for (const value of a) if (!b.has(value)) only.add(value);
      for (const value of b) if (!a.has(value)) only.add(value);
      return only;
    }
    case "and": return intersect(evalNode(node.l, ctx), evalNode(node.r, ctx)) as Set<number>;
    case "not": return complement(evalNode(node.x, ctx), ctx);
    case "term": {
      const field = BY_ID[node.field];
      if (field.kind === "number") return numberSet(node, ctx, field);
      if (field.kind === "enum") return enumSet(node, ctx, field);
      if (field.kind === "string") return stringSet(node, ctx, field);
      return textSet(node, ctx, field);
    }
    default: break;
  }
  return allSet(ctx);
};

export type CompileResult =
  | { ok: true; ast: QueryNode | null; set: Set<number> | null }
  | { ok: false; error: QueryError };

const compile = (source: string, ctx: QueryContext): CompileResult => {
  const parsed = parse(source);
  if (!parsed.ok) return parsed;
  if (!parsed.ast) return { ok: true, ast: null, set: null };
  try {
    return { ok: true, ast: parsed.ast, set: evalNode(parsed.ast, ctx) };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
};

const kindCount = (ctx: QueryContext, value: string): number => {
  let count = 0;
  for (let index = 0; index < ctx.count; index++) {
    const node = ctx.nodes[index];
    let pass = false;
    switch (value) {
      case "entry": pass = node.in === 0; break;
      case "leaf": pass = node.out === 0; break;
      case "orphan": pass = node.in === 0 && node.out === 0; break;
      case "temp": pass = ctx.edgeGroup(index, "temp"); break;
      case "sys": pass = ctx.edgeGroup(index, "position") || (node.systemIn || 0) > 0; break;
      case "jump": pass = node.out > 0; break;
      default: break;
    }
    if (pass) count++;
  }
  return count;
};

const values = (fieldId: string, ctx: QueryContext): QueryValue[] => {
  const field = BY_ID[fieldId];
  if (!field) return [];
  if (field.id === "kind") {
    return KIND_VALUES.map((value) => ({ value, label: "", count: kindCount(ctx, value) }))
      .sort((a, b) => b.count - a.count);
  }
  if (field.id === "via") {
    return VIA_VALUES.map((value) => {
      let count = 0;
      for (let index = 0; index < ctx.count; index++) {
        if (viaPass(ctx.nodes[index], index, ctx, value)) count++;
      }
      return { value, label: "", count };
    });
  }
  if (field.id === "chapter") {
    return ctx.chapters.map((chapter) => ({
      value: String(chapter.id),
      label: chapterTitle(chapter as { kind?: string; number?: number | null }),
      count: Number(chapter.count) || 0,
    }));
  }
  if (field.kind !== "text") return [];
  if (!ctx._values) ctx._values = {};
  const cached = ctx._values[field.id];
  if (cached) return cached;

  const counts = new Map<string, number>();
  for (let index = 0; index < ctx.count; index++) {
    for (const key of valuesOf(ctx.facets[index], field)) {
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  const names = (ctx.names && ctx.names[field.id]) || {};
  const out: QueryValue[] = [];
  for (const [key, count] of counts) {
    out.push({ value: key, label: names[key] || "", count });
  }
  out.sort((a, b) => b.count - a.count || (a.value < b.value ? -1 : 1));
  ctx._values[field.id] = out;
  return out;
};

const logicWordAt = (rest: string): string => {
  for (const word of ROOTS) {
    if (new RegExp(`^${word}(?=[\\s(]|$)`, "i").test(rest)) return word;
  }
  for (const word of LOGIC_ALIAS.keys()) {
    if (word && rest.toLowerCase().indexOf(word) === 0) return word;
  }
  return "";
};

const termStart = (source: string, cursor: number): number => {
  let start = 0;
  let quote: string | null = null;
  let index = 0;
  while (index < cursor) {
    const ch = source[index];
    if (quote) {
      if (ch === quote) quote = null;
      index++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      index++;
      continue;
    }
    if (ch === "(" || ch === ")") {
      start = index + 1;
      index++;
      continue;
    }
    const boundary = index === 0 || /[\s()]/.test(source[index - 1]);
    if (boundary) {
      const word = logicWordAt(source.slice(index, cursor));
      if (word) {
        start = index + word.length;
        index = start;
        continue;
      }
    }
    index++;
  }
  while (start < cursor && /\s/.test(source[start])) start++;
  return start;
};

const findOperator = (segment: string): number => {
  let quote: string | null = null;
  for (let index = 0; index < segment.length; index++) {
    const ch = segment[index];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (":=><!".indexOf(ch) >= 0) return index;
  }
  return -1;
};

const needsQuote = (value: string): boolean => !/^[A-Za-z0-9_.\-\u4e00-\u9fff]+$/.test(value);

const formatInsert = (value: string, quoted: boolean): string => {
  if (!quoted && !needsQuote(value)) return value;
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
};

const rank = (items: QuerySuggestion[], prefix: string): QuerySuggestion[] => {
  const needle = String(prefix || "").toLowerCase();
  const scored: { item: QuerySuggestion; score: number }[] = [];
  for (const item of items) {
    const textValue = String(item.value).toLowerCase();
    const label = String(item.label || "").toLowerCase();
    let score = -1;
    if (!needle) score = 0;
    else if (textValue.indexOf(needle) === 0 || label.indexOf(needle) === 0) score = 0;
    else if (textValue.indexOf(needle) >= 0 || label.indexOf(needle) >= 0) score = 1;
    if (score < 0) continue;
    scored.push({ item, score });
  }
  scored.sort((a, b) => (a.score !== b.score ? a.score - b.score : (b.item.count || 0) - (a.item.count || 0)));
  return scored.map((entry) => entry.item);
};

export type SuggestResult = {
  mode: "field" | "value";
  field: string | null;
  from: number;
  to: number;
  prefix: string;
  quoted?: boolean;
  items: QuerySuggestion[];
};

const suggest = (source: string, cursor: number, ctx: QueryContext): SuggestResult => {
  const text = String(source || "");
  const at = cursor === undefined || cursor === null || cursor > text.length ? text.length : cursor;
  const start = termStart(text, at);
  const segment = text.slice(start, at);
  const opIndex = findOperator(segment);

  if (opIndex < 0) {
    const prefix = segment.trim();
    const fields: QuerySuggestion[] = FIELDS.map((field) => ({
      value: field.id,
      label: field.aliases.slice(1).join(" / "),
      count: null,
      insert: `${field.id}:`,
      kind: "field",
    }));
    if (!prefix) {
      fields.push({ value: "NOT", label: "", count: null, insert: "NOT ", kind: "logic" });
      fields.push({ value: "(", label: "", count: null, insert: "(", kind: "logic" });
    }
    return {
      mode: "field",
      field: null,
      from: start + (segment.length - segment.replace(/^\s+/, "").length),
      to: at,
      prefix,
      items: rank(fields, prefix).slice(0, 30),
    };
  }

  const fieldText = segment.slice(0, opIndex).trim();
  const field = BY_ALIAS[fieldText.toLowerCase()];
  if (!field) {
    return { mode: "field", field: null, from: start, to: at, prefix: fieldText, items: [] };
  }

  const rest = segment.slice(opIndex);
  const opMatch = /^(>=|<=|!=|[:=<>])/.exec(rest);
  const opEnd = opIndex + (opMatch ? opMatch[0].length : 1);
  let valueStart = start + opEnd;
  while (valueStart < at && /\s/.test(text[valueStart])) valueStart++;

  let quoted = false;
  if (text[valueStart] === '"' || text[valueStart] === "'") {
    quoted = true;
    valueStart += 1;
  }
  const valuePrefix = text.slice(valueStart, at);

  const candidates: QuerySuggestion[] = [];
  if (field.kind === "number") {
    candidates.push({ value: "yes", label: "", count: null, insert: "yes" });
    candidates.push({ value: "no", label: "", count: null, insert: "no" });
    for (const number of [0, 1, 2, 3, 5, 10]) {
      candidates.push({ value: String(number), label: "", count: null, insert: String(number) });
    }
  } else {
    for (const entry of values(field.id, ctx)) {
      candidates.push({
        value: entry.value,
        label: entry.label,
        count: entry.count,
        insert: formatInsert(entry.value, quoted),
      });
    }
  }

  return {
    mode: "value",
    field: field.id,
    from: valueStart,
    to: at,
    prefix: valuePrefix,
    quoted,
    items: rank(candidates, valuePrefix).slice(0, 30),
  };
};

const needsText = (source: string): boolean => {
  const parsed = parse(source);
  if (!parsed.ok || !parsed.ast) return false;
  const walk = (node: QueryNode | null): boolean => {
    if (!node) return false;
    if (node.t === "term") return node.field === "text";
    if (node.t === "not") return walk(node.x);
    if (node.t === "or" || node.t === "and" || node.t === "xor") return walk(node.l) || walk(node.r);
    return false;
  };
  return walk(parsed.ast);
};

export const query = {
  compile,
  fields: (): QueryField[] => FIELDS.slice(),
  needsText,
  suggest,
  messageOf: (error: QueryError): string => (
    error.key ? t(error.key, error.params) : error.message
  ),
};
