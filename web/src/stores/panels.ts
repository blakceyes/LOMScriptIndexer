import { defineStore } from "pinia";
import { byId } from "../lib/browser";
import { UI_IDS } from "../ui/ids";

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
    focusTick,
    openLookup,
    hideLookup,
    focusText,
    takePendingHit,
  };
});
