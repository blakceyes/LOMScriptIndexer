import type { SizeSegment } from "../types/beats";
import { clamp } from "./browser";

const SIZE_BASE = 40;
const SIZE_MIN_SCALE = 0.72;
const SIZE_MAX_SCALE = 1.9;
const SIZE_TAG = /\{([^{}]*)\}/g;
const SIZE_TAG_ALL = /\{[^{}]*\}/g;

export const stripSizeTags = (value: unknown): string => (
  value ? String(value).replace(SIZE_TAG_ALL, "") : ""
);

const clampScale = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return clamp(value, SIZE_MIN_SCALE, SIZE_MAX_SCALE);
};

export const splitSizeTags = (value: string): SizeSegment[] => {
  if (!value) return [];
  const out: SizeSegment[] = [];
  const stack: number[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  SIZE_TAG.lastIndex = 0;
  const push = (chunk: string) => {
    if (!chunk) return;
    const scale = stack.length ? stack[stack.length - 1] : 1;
    out.push({ text: chunk, scale });
  };
  while ((match = SIZE_TAG.exec(value)) !== null) {
    if (match.index > last) push(value.slice(last, match.index));
    const tag = (match[1] || "").trim();
    const tagLower = tag.toLowerCase();
    if (tagLower.indexOf("/size") === 0 || tagLower === "size") {
      stack.pop();
    } else if (tagLower.indexOf("size") === 0 && tag.indexOf("=") > 0) {
      const sizeValue = parseFloat(tag.slice(tag.indexOf("=") + 1));
      stack.push(Number.isFinite(sizeValue)
        ? clampScale(sizeValue / SIZE_BASE)
        : (stack[stack.length - 1] || 1));
    }
    last = SIZE_TAG.lastIndex;
  }
  if (last < value.length) push(value.slice(last));
  return out;
};
