import { defineStore } from "pinia";
import { branchesPreview, rowsPreview } from "../lib/blocks";
import { byId } from "../lib/browser";
import type { BeatRow, PreviewLine } from "../types/beats";
import { UI_IDS } from "../ui/ids";

export type PreviewPayload = {
  title?: string;
  beats?: BeatRow[];
  branches?: BeatRow[];
};

export type FocusTarget = { kind: string; key: string };

export type PendingHit = { id: string; query: string; target: FocusTarget | null };

export const usePanelsStore = defineStore("panels", () => {
  const lookupState = reactive({
    open: false,
    kind: "",
    key: "",
    method: "",
    trigger: null as HTMLElement | null,
    requestSeq: 0,
    pinned: false,
  });

  const previewState = reactive({
    open: false,
    hasHead: false,
    title: "",
    lines: [] as PreviewLine[],
    omittedCount: 0,
    trigger: null as HTMLElement | null,
  });

  const focusTick = ref(0);

  let pendingHit: PendingHit | null = null;

  const openLookup = (
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

  const hideLookup = (): void => {
    lookupState.open = false;
    lookupState.pinned = false;
    lookupState.trigger = null;
  };

  const showBranchPreview = (head: HTMLElement, payload: PreviewPayload): void => {
    const preview = payload.branches
      ? branchesPreview(payload.branches)
      : rowsPreview(payload.beats || []);
    previewState.hasHead = !!payload.branches;
    previewState.title = payload.branches ? payload.title || "" : "";
    previewState.lines = preview.lines;
    previewState.omittedCount = preview.omittedCount;
    previewState.trigger = head;
    previewState.open = true;
  };

  const hideBranchPreview = (): void => {
    cancelHide();
    previewState.open = false;
  };

  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  const cancelHide = (): void => {
    if (hideTimer === null) return;
    clearTimeout(hideTimer);
    hideTimer = null;
  };

  const scheduleHide = (): void => {
    cancelHide();
    hideTimer = setTimeout(() => {
      hideTimer = null;
      hideBranchPreview();
    }, 120);
  };

  const focusText = (id: string, query: string, target?: FocusTarget | null): void => {
    const needle = String(query ?? "")
      .trim()
      .toLowerCase();
    pendingHit = id && (needle || target) ? { id, query: needle, target: target || null } : null;
    if (pendingHit) focusTick.value++;
  };

  const takePendingHit = (id: string): PendingHit | null => {
    if (!pendingHit) return null;
    if (pendingHit.id !== id) {
      pendingHit = null;
      return null;
    }
    const hit = pendingHit;
    pendingHit = null;
    return hit;
  };

  return {
    lookupState,
    previewState,
    focusTick,
    openLookup,
    hideLookup,
    showBranchPreview,
    hideBranchPreview,
    scheduleHide,
    cancelHide,
    focusText,
    takePendingHit,
  };
});
