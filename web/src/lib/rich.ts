import type { RichSegment } from "../types/beats";
import { clamp } from "./dom";

const RICH_BASE = 40;
const RICH_MIN = 0.72;
const RICH_MAX = 1.9;
const RICH_TAG = /\{([^{}]*)\}/g;
const RICH_TAGS = /\{[^{}]*\}/g;

export const stripRich = (value: unknown): string => (
  value ? String(value).replace(RICH_TAGS, "") : ""
);

const clampScale = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return clamp(value, RICH_MIN, RICH_MAX);
};

export const richSegments = (value: string): RichSegment[] => {
  if (!value) return [];
  const out: RichSegment[] = [];
  const stack: number[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  RICH_TAG.lastIndex = 0;
  const push = (chunk: string) => {
    if (!chunk) return;
    const scale = stack.length ? stack[stack.length - 1] : 1;
    out.push({ text: chunk, scale });
  };
  while ((match = RICH_TAG.exec(value)) !== null) {
    if (match.index > last) push(value.slice(last, match.index));
    const tag = (match[1] || "").trim();
    const lower = tag.toLowerCase();
    if (lower.indexOf("/size") === 0 || lower === "size") {
      stack.pop();
    } else if (lower.indexOf("size") === 0 && tag.indexOf("=") > 0) {
      const parsed = parseFloat(tag.slice(tag.indexOf("=") + 1));
      stack.push(Number.isFinite(parsed) ? clampScale(parsed / RICH_BASE) : (stack[stack.length - 1] || 1));
    }
    last = RICH_TAG.lastIndex;
  }
  if (last < value.length) push(value.slice(last));
  return out;
};
