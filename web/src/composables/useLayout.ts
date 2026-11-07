import { debounce } from "../lib/browser";
import { overlay } from "../lib/overlay";
import { pinia } from "../stores";
import { useViewStore } from "../stores/view";

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

export const useLayout = (onChange?: () => void): void => {
  const view = useViewStore(pinia);

  const applyLayout = () => {
    const next = layoutNameFor(window.innerWidth);
    if (next === view.layout && document.body.dataset.layout === next) return;
    view.setLayout(next);
    document.body.dataset.layout = next;
    if (!view.isOverlayRail()) overlay.close("chapterRail");
    overlay.close("moreMenu");
    overlay.close("langMenu");
    overlay.close("navMenu");
    if (onChange) onChange();
  };

  const onResize = debounce(() => {
    applyLayout();
    overlay.close("navMenu");
  }, 80);

  onMounted(() => {
    applyLayout();
    document.body.dataset.layout = view.layout;
    window.addEventListener("resize", onResize);
  });

  onBeforeUnmount(() => {
    onResize.cancel();
    window.removeEventListener("resize", onResize);
  });
};
