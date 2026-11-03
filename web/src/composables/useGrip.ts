import type { Ref } from "vue";
import { clamp } from "../lib/dom";
import { prefs } from "../state/prefs";
import { store } from "../state/store";

type DragState = {
  edge: "left" | "right";
  startX: number;
  start: number;
  value: number;
};

export const useGrip = (
  readerRef: Ref<HTMLElement | null>,
  stageRef: Ref<HTMLElement | null>,
  railRef: Ref<HTMLElement | null>,
): {
  start: (edge: "left" | "right", event: PointerEvent) => void;
  reset: () => void;
  nudge: (step: number) => void;
  paint: (value: number) => void;
  widthNow: () => number;
} => {
  let drag: DragState | null = null;

  const widthNow = (): number => (
    readerRef.value ? Math.round(readerRef.value.getBoundingClientRect().width) : 0
  );

  const available = (): number => {
    const stage = stageRef.value;
    if (!stage) return 0;
    const overlayRail = store.state.layout === "compact" || store.state.layout === "mobile";
    const railWidth = !overlayRail && railRef.value ? railRef.value.getBoundingClientRect().width : 0;
    return Math.max(0, stage.clientWidth - railWidth);
  };

  const bounds = (value: number): number => {
    const range = prefs.limits.measure;
    const room = Math.max(range.min, Math.min(range.max, available() - 32));
    const max = Math.max(room, Math.min(range.max, widthNow()));
    return Math.round(clamp(value, range.min, max));
  };

  const paint = (value: number): void => {
    document.documentElement.style.setProperty("--reader-measure", `${value}px`);
  };

  const commit = (value: number): void => {
    paint(value);
    prefs.set({ measure: value });
  };

  const move = (event: PointerEvent) => {
    if (!drag) return;
    const delta = event.clientX - drag.startX;
    const next = drag.edge === "left" ? drag.start - delta * 2 : drag.start + delta * 2;
    drag.value = bounds(next);
    paint(drag.value);
  };

  const stop = () => {
    if (!drag) return;
    const value = drag.value;
    drag = null;
    document.body.classList.remove("is-gripping");
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
    commit(value);
  };

  const start = (edge: "left" | "right", event: PointerEvent) => {
    if (event.button !== 0) return;
    drag = { edge, startX: event.clientX, start: widthNow(), value: widthNow() };
    document.body.classList.add("is-gripping");
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  };

  return {
    start,
    reset: () => commit(bounds(prefs.limits.measure.fallback)),
    nudge: (step: number) => commit(bounds(widthNow() + step)),
    paint,
    widthNow,
  };
};
