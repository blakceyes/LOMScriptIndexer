import { onBeforeUnmount, onMounted } from "vue";
import { debounce } from "../lib/browser";
import { overlay } from "../lib/overlay";
import { hideBranchPreview } from "../state/panels";
import { store } from "../state/store";

export type LayoutName = "wide" | "mid" | "narrow" | "compact" | "mobile";

const BREAKPOINTS: [number, LayoutName][] = [
  [1440, "wide"],
  [1200, "mid"],
  [1024, "narrow"],
  [768, "compact"],
];

export const layoutNameFor = (width: number): LayoutName => {
  for (const [minWidth, name] of BREAKPOINTS) if (width >= minWidth) return name;
  return "mobile";
};

export const isOverlayRail = (): boolean => (
  store.state.layout === "compact" || store.state.layout === "mobile"
);

export const useLayout = (onChange?: () => void): void => {
  const applyLayout = () => {
    const next = layoutNameFor(window.innerWidth);
    if (next === store.state.layout && document.body.dataset.layout === next) return;
    store.setLayout(next);
    document.body.dataset.layout = next;
    if (!isOverlayRail()) overlay.close("chapterRail");
    overlay.close("moreMenu");
    overlay.close("langMenu");
    overlay.close("navMenu");
    if (onChange) onChange();
  };

  const onResize = debounce(() => {
    applyLayout();
    hideBranchPreview();
    overlay.close("navMenu");
  }, 80);

  onMounted(() => {
    applyLayout();
    document.body.dataset.layout = store.state.layout;
    window.addEventListener("resize", onResize);
  });

  onBeforeUnmount(() => {
    onResize.cancel();
    window.removeEventListener("resize", onResize);
  });
};
