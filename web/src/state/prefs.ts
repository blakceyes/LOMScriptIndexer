import { reactive, ref } from "vue";
import type {
  ComputedEntry, FontScope, FontTarget, PrefEntry, PrefPatch, PrefState,
} from "../types/font";
import {
  BASE_FONT, FOLLOW_BASE, FOLLOW_GROUP, FONTS, fontLabelKey, fontPreset, stackOf,
} from "./fontFamilies";
import { GROUPS, TYPES, groupById, typeById } from "./fontTypes";
import { getJson, keys, setJson } from "./storage";

const KEY = keys.prefs;

const BASE_SIZE = 16;
const BASE_LEADING = 1.6;
const BASE_WEIGHT = 400;

const WEIGHTS = [400, 500, 600];

const MEASURE_MIN = 520;
const MEASURE_MAX = 1400;
const MEASURE_DEFAULT = 860;
const SCALE_MIN = 25;
const SCALE_MAX = 300;
const SCALE_STEP = 5;
const LEADING_MIN = 50;
const LEADING_MAX = 250;
const LEADING_STEP = 5;

const GROUP_DEFAULT = { scale: 100, leading: 100, weight: BASE_WEIGHT };
const TYPE_DEFAULT = { scale: 100, leading: 100, weight: null as number | null };

const LABELS = {
  followBase: "pref.followBase",
  followGroup: "pref.followGroup",
  groupAll: "pref.groupAll",
  customFont: "pref.customFont",
};

const state = reactive<PrefState>({ groups: {}, types: {}, measure: MEASURE_DEFAULT });

const clampNumber = (value: unknown, min: number, max: number, fallback: number): number => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
};

const clampScale = (value: unknown, fallback: number): number => (
  Math.round(clampNumber(value, SCALE_MIN, SCALE_MAX, fallback) / SCALE_STEP) * SCALE_STEP
);

const clampLeading = (value: unknown, fallback: number): number => (
  Math.round(clampNumber(value, LEADING_MIN, LEADING_MAX, fallback) / LEADING_STEP) * LEADING_STEP
);

const clampWeight = (value: unknown, fallback: number | null): number | null => {
  if (value === null) return fallback;
  const weight = Number(value);
  return WEIGHTS.indexOf(weight) >= 0 ? weight : fallback;
};

const defaultGroups = (): Record<string, PrefEntry> => {
  const out: Record<string, PrefEntry> = {};
  for (const group of GROUPS) {
    out[group.id] = {
      font: group.font || FOLLOW_BASE,
      scale: typeof group.scale === "number" ? group.scale : GROUP_DEFAULT.scale,
      leading: GROUP_DEFAULT.leading,
      weight: GROUP_DEFAULT.weight,
    };
  }
  return out;
};

const defaultTypes = (): Record<string, PrefEntry> => {
  const out: Record<string, PrefEntry> = {};
  for (const type of TYPES) {
    out[type.id] = {
      font: type.font,
      scale: typeof type.scale === "number" ? type.scale : TYPE_DEFAULT.scale,
      leading: TYPE_DEFAULT.leading,
      weight: type.weight,
    };
  }
  return out;
};

const normalizeEntry = (raw: unknown, base: PrefEntry, fallbackWeight: number | null): PrefEntry => {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    font: typeof item.font === "string" ? item.font : base.font,
    scale: clampScale(item.scale, base.scale),
    leading: clampLeading(item.leading, base.leading),
    weight: clampWeight(item.weight === undefined ? fallbackWeight : item.weight, fallbackWeight),
  };
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const groupStack = (groupId: string): string => stackOf((state.groups[groupId] || GROUP_DEFAULT).font);

const typeStack = (typeId: string): string => {
  const type = typeById(typeId);
  if (!type) return BASE_FONT;
  const item = state.types[typeId];
  if (!item || !item.font || item.font === FOLLOW_GROUP) return groupStack(type.group);
  return stackOf(item.font);
};

const resolveWeight = (typeId: string): number | null => {
  const type = typeById(typeId);
  if (!type) return BASE_WEIGHT;
  const item = state.types[typeId];
  const group = state.groups[type.group];
  if (item && item.weight !== null && item.weight !== undefined) return item.weight;
  if (group && group.weight !== null && group.weight !== undefined) return group.weight;
  return BASE_WEIGHT;
};

const computedOf = (scope: FontScope, id: string): ComputedEntry | null => {
  if (scope === "group") {
    const group = state.groups[id];
    if (!group) return null;
    return {
      scope: "group",
      id,
      group: id,
      scale: group.scale,
      leading: group.leading,
      px: BASE_SIZE * (group.scale / 100),
      lineHeight: BASE_LEADING * (group.leading / 100),
      weight: group.weight,
      font: group.font,
      fontStack: groupStack(id),
    };
  }
  const type = typeById(id);
  if (!type) return null;
  const item = state.types[id];
  const group = state.groups[type.group];
  if (!item || !group) return null;
  return {
    scope: "type",
    id,
    group: type.group,
    scale: item.scale,
    leading: item.leading,
    px: BASE_SIZE * (group.scale / 100) * (item.scale / 100),
    lineHeight: BASE_LEADING * (group.leading / 100) * (item.leading / 100),
    weight: resolveWeight(id),
    font: item.font,
    fontStack: typeStack(id),
  };
};

const apply = (): void => {
  const root = document.documentElement;
  root.style.setProperty("--font-base", BASE_FONT);
  root.style.setProperty("--reader-measure", `${state.measure}px`);
  for (const type of TYPES) {
    const item = computedOf("type", type.id);
    if (!item) continue;
    root.style.setProperty(`--rd-fs-${type.id}`, `${item.px.toFixed(2)}px`);
    root.style.setProperty(`--rd-lh-${type.id}`, item.lineHeight.toFixed(3));
    root.style.setProperty(`--rd-fw-${type.id}`, String(item.weight));
    root.style.setProperty(`--rd-ff-${type.id}`, item.fontStack);
  }
};

const persist = (): void => {
  setJson(KEY, state);
};

const snapshot = (): PrefState => clone(state);

const restoreDefaults = (): void => {
  state.groups = defaultGroups();
  state.types = defaultTypes();
  state.measure = MEASURE_DEFAULT;
};

const restore = (): void => {
  restoreDefaults();
  const saved = getJson<Partial<PrefState>>(KEY);
  const source = saved && typeof saved === "object" ? saved : null;
  if (!source) return;
  state.measure = Math.round(clampNumber(source.measure, MEASURE_MIN, MEASURE_MAX, MEASURE_DEFAULT));
  const groups = source.groups && typeof source.groups === "object" ? source.groups : null;
  if (groups) {
    for (const group of GROUPS) {
      state.groups[group.id] = normalizeEntry(groups[group.id], state.groups[group.id], GROUP_DEFAULT.weight);
    }
  }
  const types = source.types && typeof source.types === "object" ? source.types : null;
  if (types) {
    for (const type of TYPES) {
      state.types[type.id] = normalizeEntry(types[type.id], state.types[type.id], null);
    }
  }
};

const set = (patch: PrefPatch): PrefState => {
  if (patch && typeof patch === "object") {
    if (patch.measure !== undefined) {
      state.measure = Math.round(clampNumber(patch.measure, MEASURE_MIN, MEASURE_MAX, state.measure));
    }
    if (patch.groups && typeof patch.groups === "object") {
      for (const groupId of Object.keys(patch.groups)) {
        const current = state.groups[groupId];
        if (!current) continue;
        const next = patch.groups[groupId] || {};
        if (typeof next.font === "string") current.font = next.font;
        if (next.scale !== undefined) current.scale = clampScale(next.scale, current.scale);
        if (next.leading !== undefined) current.leading = clampLeading(next.leading, current.leading);
        if (next.weight !== undefined) current.weight = clampWeight(next.weight, current.weight);
      }
    }
    if (patch.types && typeof patch.types === "object") {
      for (const typeId of Object.keys(patch.types)) {
        const current = state.types[typeId];
        if (!current) continue;
        const next = patch.types[typeId] || {};
        if (typeof next.font === "string") current.font = next.font;
        if (next.scale !== undefined) current.scale = clampScale(next.scale, current.scale);
        if (next.leading !== undefined) current.leading = clampLeading(next.leading, current.leading);
        if (next.weight !== undefined) {
          current.weight = next.weight === null ? null : clampWeight(next.weight, current.weight);
        }
      }
    }
  }
  apply();
  persist();
  return snapshot();
};

const describe = (target: FontTarget): string => {
  if (target.scope === "group") {
    const group = state.groups[target.id];
    return fontLabelKey(group ? group.font : FOLLOW_BASE);
  }
  const item = state.types[target.id];
  return fontLabelKey(item ? item.font : FOLLOW_GROUP);
};

export const customFontOpen = ref(false);

export const prefs = {
  labels: LABELS,
  presets: {
    fonts: FONTS,
    groups: GROUPS,
    types: TYPES,
    weights: WEIGHTS.slice(),
  },
  limits: {
    measure: { min: MEASURE_MIN, max: MEASURE_MAX, fallback: MEASURE_DEFAULT },
    scale: { min: SCALE_MIN, max: SCALE_MAX, step: SCALE_STEP },
    leading: { min: LEADING_MIN, max: LEADING_MAX, step: LEADING_STEP },
  },
  groupById,
  typeById,
  computed: computedOf,
  get: snapshot,
  set,
  reset: (): PrefState => {
    restoreDefaults();
    apply();
    persist();
    return snapshot();
  },
  describe,
  isCustomFont: (value: string): boolean => (
    !!value && value !== FOLLOW_BASE && value !== FOLLOW_GROUP && !fontPreset(value)
  ),
};

restore();
apply();
