import { markRaw, reactive } from "vue";
import { graph } from "../data/graph";
import { data } from "../data/schema";
import type { GraphNode } from "../types/graph";
import { lang } from "./lang";
import {
  bookmarks, bookmarkTick, clearBookmarks, positionOf, rememberPosition, toggleBookmark,
} from "./storage";

const meta = data.meta;

export const state = reactive({
  lang: lang.initial(),
  selectedId: "",
  history: [] as string[],
  hIndex: -1,
  filterSource: "",
  filterSet: null as Set<number> | null,
  filterError: "",
  filterLoading: false,
  layout: "wide",
  railTab: "outline",
  outlineChapter: undefined as number | undefined,
  settingsTarget: "type:dialog",
  visibleVersion: 0,
  filterVersion: 0,
});

const computeVisible = (): void => {
  graph.computeVisibility(state.filterSet, state.selectedId);
  state.visibleVersion++;
};

const selected = (): GraphNode | null => (
  state.selectedId ? graph.nodeById.get(state.selectedId) || null : null
);

const selectedIndex = (): number => (
  state.selectedId ? graph.indexById.get(state.selectedId) ?? -1 : -1
);

const select = (id: string, options?: { history?: boolean }): boolean => {
  const node = graph.nodeById.get(id);
  if (!node) return false;
  const opts = options || {};
  state.selectedId = id;
  if (opts.history !== false) {
    state.history = state.history.slice(0, state.hIndex + 1);
    if (state.history[state.history.length - 1] !== id) state.history.push(id);
    state.hIndex = state.history.length - 1;
  }
  computeVisible();
  return true;
};

const back = (): GraphNode | null => {
  if (state.hIndex <= 0) return null;
  const id = state.history[state.hIndex - 1];
  if (!graph.nodeById.has(id)) return null;
  state.hIndex -= 1;
  state.selectedId = id;
  computeVisible();
  return graph.nodeById.get(id) || null;
};

const forward = (): GraphNode | null => {
  if (state.hIndex >= state.history.length - 1) return null;
  const id = state.history[state.hIndex + 1];
  if (!graph.nodeById.has(id)) return null;
  state.hIndex += 1;
  state.selectedId = id;
  computeVisible();
  return graph.nodeById.get(id) || null;
};

const setFilter = (patch: {
  source?: string;
  set?: Set<number> | null;
  error?: string;
  loading?: boolean;
}): void => {
  if (!patch || typeof patch !== "object") return;
  if (patch.source !== undefined) state.filterSource = String(patch.source);
  if (patch.set !== undefined) state.filterSet = patch.set === null ? null : markRaw(patch.set);
  if (patch.error !== undefined) state.filterError = String(patch.error);
  if (patch.loading !== undefined) state.filterLoading = !!patch.loading;
  computeVisible();
  state.filterVersion++;
};

let restored = false;

const restore = (): void => {
  if (restored) return;
  restored = true;
  state.lang = lang.initial();
  lang.applyDocument(state.lang);
  computeVisible();
  state.filterVersion++;
};

const textLang = (): string => {
  if (meta.langs.indexOf(state.lang) >= 0) return state.lang;
  if (meta.langs.indexOf(meta.defaultLang) >= 0) return meta.defaultLang;
  return meta.langs[0] || meta.defaultLang || "";
};

export const store = {
  state,
  selected,
  selectedIndex,
  select,
  back,
  forward,
  applyFilter: setFilter,
  restore,
  textLang,
  setLang: (id: string): boolean => {
    if (!lang.has(id)) return false;
    const changed = id !== state.lang;
    lang.pin(id);
    state.lang = id;
    return changed;
  },
  setLayout: (layout: string): void => {
    if (!layout || layout === state.layout) return;
    state.layout = layout;
  },
  setOutlineChapter: (value: number | undefined): void => {
    state.outlineChapter = value;
  },
  setRailTab: (tab: string): void => {
    if (tab === state.railTab) return;
    state.railTab = tab;
  },
  setSettingsTarget: (target: string): void => {
    state.settingsTarget = target;
  },
  isBookmarked: (id: string): boolean => bookmarks.has(id),
  toggleBookmark,
  clearBookmarks,
  positionOf,
  rememberPosition,
  bookmarkTick,
};
