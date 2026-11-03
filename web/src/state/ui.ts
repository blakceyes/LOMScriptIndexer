import { reactive, ref } from "vue";
import { beatsPreview, previewOfBranches } from "../lib/blocks";
import { debounce } from "../lib/dom";
import type { BeatRow, PreviewLine } from "../types/beats";

export const lookupState = reactive({
  open: false,
  kind: "",
  key: "",
  method: "",
  trigger: null as HTMLElement | null,
  seq: 0,
  pinned: false,
});

export const openLookup = (
  kind: string,
  key: string,
  trigger?: HTMLElement | null,
  method?: string,
): void => {
  if (!key) return;
  const panel = document.getElementById("lookupPanel");
  lookupState.pinned = !!(trigger && panel && panel.contains(trigger));
  lookupState.open = true;
  lookupState.kind = kind;
  lookupState.key = key;
  lookupState.method = method || "";
  lookupState.trigger = trigger || null;
  lookupState.seq++;
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
  more: 0,
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
  const data = payload.branches
    ? previewOfBranches(payload.branches)
    : beatsPreview(payload.beats || []);
  previewState.hasHead = !!payload.branches;
  previewState.title = payload.branches ? (payload.title || "") : "";
  previewState.lines = data.lines;
  previewState.more = data.more;
  previewState.trigger = head;
  previewState.open = true;
};

let pendingHit: { id: string; query: string } | null = null;

export const focusTick = ref(0);

export const focusText = (id: string, query: string): void => {
  const needle = String(query ?? "").trim().toLowerCase();
  pendingHit = id && needle ? { id, query: needle } : null;
  if (pendingHit) focusTick.value++;
};

export const takePendingHit = (id: string): { id: string; query: string } | null => {
  if (!pendingHit) return null;
  if (pendingHit.id !== id) {
    pendingHit = null;
    return null;
  }
  const hit = pendingHit;
  pendingHit = null;
  return hit;
};
