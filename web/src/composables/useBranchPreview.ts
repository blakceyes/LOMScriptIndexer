import type { PreviewPayload } from "../state/ui";
import { hideBranchPreview, scheduleHide, showBranchPreview } from "../state/ui";

const HOVER_OK = !(window.matchMedia && window.matchMedia("(hover: none)").matches);

export const useBranchPreview = (
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
  let overVar = false;

  const show = () => {
    const head = getHead();
    if (!head) return;
    showBranchPreview(head, getPayload());
  };

  return {
    onMouseenter: () => {
      if (!HOVER_OK || isOpen()) return;
      scheduleHide.cancel();
      if (overVar) return;
      show();
    },
    onMousemove: (event: MouseEvent) => {
      if (!HOVER_OK) return;
      const target = event.target as HTMLElement | null;
      const now = !!(target && target.closest && target.closest(".cx-var"));
      if (now === overVar) return;
      overVar = now;
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
