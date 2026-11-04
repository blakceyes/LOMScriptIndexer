import { reactive, ref } from "vue";
import { branchesPreview, rowsPreview } from "../lib/blocks";
import { byId, debounce } from "../lib/browser";
import type { BeatRow, PreviewLine } from "../types/beats";
import { UI_IDS } from "../ui/ids";

export const lookupState = reactive({
  open: false,
  kind: "",
  key: "",
  method: "",
  trigger: null as HTMLElement | null,
  requestSeq: 0,
  pinned: false,
});

export const openLookup = (
  kind: string,
  key: string,
  trigger?: HTMLElement | null,
  method?: string,
): void => {
  if (!key) return;
  const panel = byId(UI_IDS.lookupPanel);
  lookupState.pinned = !!(trigger && panel && panel.contains(trigger));
  lookupState.open = true;
  lookupState.kind = kind;
  lookupState.key = key;
  lookupState.method = method || "";
  lookupState.trigger = trigger || null;
  lookupState.requestSeq++;
};

export const hideLookup = (): void => {
  lookupState.open = false;
  lookupState.pinned = false;
  lookupState.trigger = null;
};

export const previewState = reactive({
  open: false,
  hasHead: false,
  title: "",
  lines: [] as PreviewLine[],
  omittedCount: 0,
  trigger: null as HTMLElement | null,
});

export type PreviewPayload = {
  title?: string;
  beats?: BeatRow[];
  branches?: BeatRow[];
};

export const hideBranchPreview = (): void => {
  scheduleHide.cancel();
  previewState.open = false;
};

export const scheduleHide = debounce(hideBranchPreview, 120);

export const showBranchPreview = (head: HTMLElement, payload: PreviewPayload): void => {
  const preview = payload.branches
    ? branchesPreview(payload.branches)
    : rowsPreview(payload.beats || []);
  previewState.hasHead = !!payload.branches;
  previewState.title = payload.branches ? (payload.title || "") : "";
  previewState.lines = preview.lines;
  previewState.omittedCount = preview.omittedCount;
  previewState.trigger = head;
  previewState.open = true;
};

export type FocusTarget = { kind: string; key: string };

type PendingHit = { id: string; query: string; target: FocusTarget | null };

let pendingHit: PendingHit | null = null;

export const focusTick = ref(0);

export const focusText = (id: string, query: string, target?: FocusTarget | null): void => {
  const needle = String(query ?? "").trim().toLowerCase();
  pendingHit = id && (needle || target)
    ? { id, query: needle, target: target || null }
    : null;
  if (pendingHit) focusTick.value++;
};

export const takePendingHit = (id: string): PendingHit | null => {
  if (!pendingHit) return null;
  if (pendingHit.id !== id) {
    pendingHit = null;
    return null;
  }
  const hit = pendingHit;
  pendingHit = null;
  return hit;
};
