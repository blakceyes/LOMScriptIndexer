import type { PreviewPayload } from "../state/panels";
import { hideBranchPreview, scheduleHide, showBranchPreview } from "../state/panels";

const HOVER_OK = !(window.matchMedia && window.matchMedia("(hover: none)").matches);

export const createBranchPreview = (
  getHead: () => HTMLElement | null,
  isOpen: () => boolean,
  getPayload: () => PreviewPayload,
): {
  onMouseenter: () => void;
  onMousemove: (event: MouseEvent) => void;
  onMouseleave: () => void;
  onFocus: () => void;
  onBlur: () => void;
} => {
  let hoveringVar = false;

  const show = () => {
    const head = getHead();
    if (!head) return;
    showBranchPreview(head, getPayload());
  };

  return {
    onMouseenter: () => {
      if (!HOVER_OK || isOpen()) return;
      scheduleHide.cancel();
      if (hoveringVar) return;
      show();
    },
    onMousemove: (event: MouseEvent) => {
      if (!HOVER_OK) return;
      const target = event.target as HTMLElement | null;
      const now = !!(target && target.closest && target.closest(".cx-var"));
      if (now === hoveringVar) return;
      hoveringVar = now;
      if (now) hideBranchPreview();
      else if (!isOpen()) show();
    },
    onMouseleave: () => {
      if (!HOVER_OK) return;
      scheduleHide();
    },
    onFocus: () => {
      if (!HOVER_OK || isOpen()) return;
      show();
    },
    onBlur: () => {
      if (!HOVER_OK) return;
      hideBranchPreview();
    },
  };
};
