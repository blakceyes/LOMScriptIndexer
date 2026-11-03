import type { QueryError, QueryNode } from "../../types/cond";
import { QueryFail, describeError } from "./error";
import { FIELD_BY_ALIAS } from "./fields";
import { tokenize, type Token } from "./tokenizer";

const OP_NAMES: Record<string, string> = {
  "=": "eq",
  "!=": "ne",
  ">": "gt",
  ">=": "ge",
  "<": "lt",
  "<=": "le",
};

const COMPARABLE = [":", "=", "!=", ">", ">=", "<", "<="];

const ORDERED = ["gt", "ge", "lt", "le"];

class Parser {
  tokens: Token[];
  pos: number;

  constructor(source: string) {
    this.tokens = tokenize(source);
    this.pos = 0;
  }

  peek(offset = 0): Token {
    return this.tokens[this.pos + offset];
  }

  next(): Token {
    return this.tokens[this.pos++];
  }

  isOp(value: string): boolean {
    const token = this.peek();
    return !!token && token.type === "op" && token.value === value;
  }

  startsTerm(): boolean {
    const token = this.peek();
    if (!token) return false;
    if (token.type === "lparen") return true;
    if (token.type === "op" && token.value === "NOT") return true;
    return token.type === "ident";
  }

  parseOr(): QueryNode {
    let node = this.parseAnd();
    while (this.isOp("OR") || this.isOp("XOR")) {
      const op = this.next().value;
      const right = this.parseAnd();
      node = op === "OR" ? { t: "or", l: node, r: right } : { t: "xor", l: node, r: right };
    }
    return node;
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
      if (this.peek().type !== "rparen") throw new QueryFail("qErrParen", this.peek().at);
      this.next();
      return inner;
    }
    return this.parseTerm();
  }

  parseTerm(): QueryNode {
    const token = this.peek();
    if (token.type !== "ident") throw new QueryFail("qErrFieldName", token.at);
    this.next();
    const field = FIELD_BY_ALIAS[String(token.value).toLowerCase()];
    if (!field) throw new QueryFail("qErrUnknownField", token.at, { field: token.value });

    const opToken = this.peek();
    if (opToken.type !== "op" || COMPARABLE.indexOf(String(opToken.value)) < 0) {
      throw new QueryFail("qErrOperator", opToken.at, { field: field.id });
    }
    this.next();

    const valueToken = this.peek();
    if (valueToken.type === "op" && valueToken.value === "NOT") {
      throw new QueryFail("qErrNeedValue", valueToken.at);
    }
    let raw: string | number;
    if (valueToken.type === "string") raw = String(valueToken.value);
    else if (valueToken.type === "number") raw = Number(valueToken.value);
    else if (valueToken.type === "ident") raw = String(valueToken.value);
    else throw new QueryFail("qErrCompareValue", valueToken.at);
    this.next();

    const op = opToken.value === ":" ? "contains" : OP_NAMES[String(opToken.value)];
    if (field.kind !== "number" && ORDERED.indexOf(op) >= 0) {
      throw new QueryFail("qErrNoCompare", opToken.at, { field: field.id });
    }
    return { t: "term", field: field.id, op, value: raw, at: token.at };
  }
}

export type ParseResult =
  | { ok: true; ast: QueryNode | null }
  | { ok: false; error: QueryError };

export const parse = (source: string): ParseResult => {
  try {
    const parser = new Parser(String(source || ""));
    if (parser.peek().type === "eof") return { ok: true, ast: null };
    const ast = parser.parseOr();
    const rest = parser.peek();
    if (rest.type !== "eof") {
      throw new QueryFail("qErrTrailing", rest.at, { value: rest.value });
    }
    return { ok: true, ast };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
};
