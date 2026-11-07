import type { Ref } from "vue";
import { clamp } from "../lib/browser";
import { pinia } from "../stores";
import { usePrefsStore } from "../stores/prefs";
import { useViewStore } from "../stores/view";

const prefs = usePrefsStore(pinia);
const view = useViewStore(pinia);

type DragState = {
  edge: "left" | "right";
  startX: number;
  startWidth: number;
  current: number;
};

export const createGripController = (
  readerRef: Ref<HTMLElement | null>,
  stageRef: Ref<HTMLElement | null>,
  railRef: Ref<HTMLElement | null>,
): {
  start: (edge: "left" | "right", event: PointerEvent) => void;
  reset: () => void;
  nudge: (step: number) => void;
  applyMeasure: (value: number) => void;
  currentWidth: () => number;
} => {
  let drag: DragState | null = null;

  const currentWidth = (): number =>
    readerRef.value ? Math.round(readerRef.value.getBoundingClientRect().width) : 0;

  const availableWidth = (): number => {
    const stage = stageRef.value;
    if (!stage) return 0;
    const overlayRail = view.layout === "compact" || view.layout === "mobile";
    const railWidth =
      !overlayRail && railRef.value ? railRef.value.getBoundingClientRect().width : 0;
    return Math.max(0, stage.clientWidth - railWidth);
  };

  const clampMeasure = (value: number): number => {
    const range = prefs.limits.measure;
    const room = Math.max(range.min, Math.min(range.max, availableWidth() - 32));
    const max = Math.max(room, Math.min(range.max, currentWidth()));
    return Math.round(clamp(value, range.min, max));
  };

  const applyMeasure = (value: number): void => {
    document.documentElement.style.setProperty("--reader-measure", `${value}px`);
  };

  const commitMeasure = (value: number): void => {
    applyMeasure(value);
    prefs.set({ measure: value });
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag) return;
    const delta = event.clientX - drag.startX;
    const next = drag.edge === "left" ? drag.startWidth - delta * 2 : drag.startWidth + delta * 2;
    drag.current = clampMeasure(next);
    applyMeasure(drag.current);
  };

  const onPointerUp = () => {
    if (!drag) return;
    const value = drag.current;
    drag = null;
    document.body.classList.remove("is-gripping");
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    commitMeasure(value);
  };

  const start = (edge: "left" | "right", event: PointerEvent) => {
    if (event.button !== 0) return;
    const width = currentWidth();
    drag = { edge, startX: event.clientX, startWidth: width, current: width };
    document.body.classList.add("is-gripping");
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  return {
    start,
    reset: () => commitMeasure(clampMeasure(prefs.limits.measure.fallback)),
    nudge: (step: number) => commitMeasure(clampMeasure(currentWidth() + step)),
    applyMeasure,
    currentWidth,
  };
};
