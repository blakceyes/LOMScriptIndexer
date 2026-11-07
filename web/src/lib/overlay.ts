import { byId, focusableElements, scheduleFrame } from "./browser";

const MARGIN = 12;
const GAP = 8;
const TRAP_GROUPS: Record<string, boolean> = { sheet: true, modal: true };
const AUTO_CLOSE_GROUPS: Record<string, boolean> = { menu: true, pop: true };

export type Placement = {
  align?: "start" | "center" | "end";
  width?: number;
  matchWidth?: boolean;
  fit?: boolean;
  gap?: number;
  side?: "top";
  margin?: number;
  _settled?: boolean;
};

export type OverlayDef = {
  id: string;
  triggerId?: string;
  trigger?: HTMLElement | null;
  group?: string;
  keep?: string[];
  autofocus?: string;
  placement?: Placement;
  onOpen?: () => void;
  onHide?: () => void;
};

const defs = new Map<string, OverlayDef>();
const openState = reactive<Record<string, boolean>>({});
const stack: { key: string; trigger: HTMLElement | null; focusInside: boolean }[] = [];

const panelOf = (def: OverlayDef | undefined): HTMLElement | null => (def ? byId(def.id) : null);

const triggerOf = (
  def: OverlayDef | undefined,
  explicit?: HTMLElement | null,
): HTMLElement | null => explicit || (def && def.trigger) || null;

const fixedOrigin = (panel: HTMLElement): { x: number; y: number } => {
  let node: HTMLElement | null = panel.parentElement;
  while (node && node !== document.documentElement) {
    const style = getComputedStyle(node);
    const blocks =
      (style.transform && style.transform !== "none") ||
      (style.filter && style.filter !== "none") ||
      (style.backdropFilter && style.backdropFilter !== "none") ||
      (style.perspective && style.perspective !== "none") ||
      (style.contain && /paint|layout|strict|content/.test(style.contain)) ||
      (style.willChange && /transform|filter/.test(style.willChange));
    if (blocks) {
      const rect = node.getBoundingClientRect();
      return {
        x: rect.left + (parseFloat(style.borderLeftWidth) || 0),
        y: rect.top + (parseFloat(style.borderTopWidth) || 0),
      };
    }
    node = node.parentElement;
  }
  return { x: 0, y: 0 };
};

const place = (
  panel: HTMLElement | null,
  trigger: HTMLElement | null,
  options?: Placement,
): { left: number; top: number; width: number; height: number } | null => {
  if (!panel) return null;
  const opts = options || {};
  const margin = opts.margin == null ? MARGIN : opts.margin;
  const gap = opts.gap == null ? GAP : opts.gap;
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = document.documentElement.clientHeight || window.innerHeight;

  const anchor =
    trigger && trigger.getBoundingClientRect
      ? trigger.getBoundingClientRect()
      : { left: margin, right: margin, top: margin, bottom: margin, width: vw - margin * 2 };

  const below = vh - anchor.bottom - gap - margin;
  const above = anchor.top - gap - margin;
  let preferTop = opts.side === "top";
  let maxHeight = 0;

  if (opts.fit) {
    maxHeight = Math.max(120, preferTop ? above : below);
    if (!preferTop && below < 220 && above > below) {
      preferTop = true;
      maxHeight = Math.max(120, above);
    }
    if (preferTop && above < 220 && below > above) {
      preferTop = false;
      maxHeight = Math.max(120, below);
    }
    if (maxHeight < 160) maxHeight = Math.max(120, vh - margin * 2);
  }

  const presetWidth = opts.width
    ? Math.round(Math.min(opts.width, vw - margin * 2))
    : opts.matchWidth
      ? Math.round(Math.min(anchor.width, vw - margin * 2))
      : 0;

  panel.classList.add("is-overlay");
  panel.style.cssText =
    "position:fixed;right:auto;bottom:auto;left:0;top:0" +
    (presetWidth ? `;width:${presetWidth}px` : "") +
    (maxHeight ? `;max-height:${maxHeight}px` : "");

  const width = Math.round(panel.offsetWidth) || Math.min(240, vw - margin * 2);
  const height = Math.round(panel.offsetHeight) || 200;
  const maxX = Math.max(margin, vw - width - margin);
  const maxY = Math.max(margin, vh - height - margin);

  let x: number;
  if (opts.align === "start") x = anchor.left;
  else if (opts.align === "center") x = anchor.left + anchor.width / 2 - width / 2;
  else x = anchor.right - width;
  x = Math.min(Math.max(margin, x), maxX);

  let y = preferTop ? anchor.top - height - gap : anchor.bottom + gap;
  y = Math.min(Math.max(margin, y), maxY);

  const origin = fixedOrigin(panel);
  panel.style.cssText =
    "position:fixed;right:auto;bottom:auto;left:" +
    `${Math.round(x - origin.x)}px;top:${Math.round(y - origin.y)}px;width:${width}px` +
    (maxHeight ? `;max-height:${maxHeight}px` : "");

  if (!opts._settled) {
    requestAnimationFrame(() => {
      if (panel.hidden) return;
      place(panel, trigger, { ...opts, _settled: true });
    });
  }
  return { left: x, top: y, width, height };
};

const reposition = (key: string): void => {
  const def = defs.get(key);
  if (!def || !def.placement) return;
  const panel = panelOf(def);
  if (!panel || panel.hidden) return;
  place(panel, triggerOf(def), def.placement);
};

const refresh = scheduleFrame(() => {
  for (const layer of stack) reposition(layer.key);
});

let focusRingSuppressor: { clear: () => void } | null = null;

const clearFocusRingSuppressor = (): void => {
  const current = focusRingSuppressor;
  if (!current) return;
  focusRingSuppressor = null;
  current.clear();
};

const suppressFocusRing = (node: HTMLElement): void => {
  clearFocusRingSuppressor();
  const clear = () => {
    if (focusRingSuppressor && focusRingSuppressor.clear === clear) {
      focusRingSuppressor = null;
    }
    node.classList.remove("is-focus-silent");
    document.removeEventListener("keydown", clear, true);
    document.removeEventListener("pointerdown", clear, true);
    node.removeEventListener("blur", clear);
  };
  node.classList.add("is-focus-silent");
  focusRingSuppressor = { clear };
  document.addEventListener("keydown", clear, true);
  document.addEventListener("pointerdown", clear, true);
  node.addEventListener("blur", clear, { once: true });
};

const restoreFocus = (layer: { trigger: HTMLElement | null }): void => {
  const trigger = layer.trigger;
  if (!trigger || !trigger.isConnected || (trigger as HTMLButtonElement).disabled) return;
  suppressFocusRing(trigger);
  try {
    trigger.focus({ preventScroll: true });
  } catch {
    try {
      trigger.focus();
    } catch {
      clearFocusRingSuppressor();
    }
  }
};

const hideLayer = (key: string): void => {
  const def = defs.get(key);
  if (!def) return;
  openState[key] = false;
  if (typeof def.onHide === "function") def.onHide();
};

const open = (
  key: string,
  options?: {
    trigger?: HTMLElement | null;
    keep?: string[];
    autofocus?: string;
    placement?: Placement;
  },
): boolean => {
  const opts = options || {};
  const def = defs.get(key);
  if (!def) return false;
  const panel = panelOf(def);
  if (!panel) return false;

  const keep = (def.keep || []).concat(opts.keep || []);
  for (let index = stack.length - 1; index >= 0; index--) {
    if (stack[index].key === key) continue;
    if (keep.indexOf(stack[index].key) >= 0) continue;
    close(stack[index].key, { restoreFocus: false });
  }

  const trigger = triggerOf(def, opts.trigger) || (def.triggerId ? byId(def.triggerId) : null);
  if (trigger) def.trigger = trigger;
  openState[key] = true;
  panel.hidden = false;
  panel.setAttribute("aria-hidden", "false");

  const existing = stack.find((layer) => layer.key === key);
  if (!existing) {
    stack.push({
      key,
      trigger: trigger || (document.activeElement as HTMLElement | null),
      focusInside: panel.contains(document.activeElement),
    });
  } else if (trigger) {
    existing.trigger = trigger;
  }

  const placement = opts.placement || def.placement;
  if (placement) {
    def.placement = placement;
    place(panel, trigger, placement);
    void nextTick(() => reposition(key));
  }

  if (!existing) {
    const autofocus = opts.autofocus || def.autofocus;
    if (autofocus) {
      const target = typeof autofocus === "string" ? byId(autofocus) : autofocus;
      if (target) {
        try {
          target.focus({ preventScroll: true });
        } catch {
          target.focus();
        }
      }
    }
  }
  if (typeof def.onOpen === "function") def.onOpen();
  return true;
};

const close = (key: string, options?: { restoreFocus?: boolean }): boolean => {
  const opts = options || {};
  const index = stack.findIndex((layer) => layer.key === key);
  if (index < 0) {
    hideLayer(key);
    return false;
  }
  const layer = stack.splice(index, 1)[0];
  hideLayer(key);
  if (opts.restoreFocus && !layer.focusInside) restoreFocus(layer);
  return true;
};

const closeTop = (): boolean => {
  if (!stack.length) return false;
  return close(stack[stack.length - 1].key, { restoreFocus: true });
};

const topKey = (): string => (stack.length ? stack[stack.length - 1].key : "");

const trapTab = (event: KeyboardEvent): void => {
  const def = defs.get(topKey());
  if (!def || !TRAP_GROUPS[def.group || "menu"]) return;
  const root = panelOf(def);
  if (!root) return;
  const list = focusableElements(root);
  if (!list.length) return;
  const first = list[0];
  const last = list[list.length - 1];
  const active = document.activeElement;
  if (!root.contains(active)) {
    event.preventDefault();
    first.focus();
    return;
  }
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
    return;
  }
  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};

document.addEventListener(
  "keydown",
  (event) => {
    if (event.defaultPrevented) return;
    if (event.key === "Escape") {
      if (closeTop()) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }
    if (event.key === "Tab") trapTab(event);
  },
  true,
);

document.addEventListener("click", (event) => {
  for (let guard = 0; guard < 8; guard++) {
    const def = defs.get(topKey());
    if (!def || !AUTO_CLOSE_GROUPS[def.group || ""]) return;
    const panel = panelOf(def);
    const trigger = triggerOf(def);
    if (!panel || panel.hidden) return;
    const target = event.target as Node;
    if (panel.contains(target)) return;
    if (trigger && trigger.contains && trigger.contains(target)) return;
    let kept = false;
    for (const keep of def.keep || []) {
      const keptDef = defs.get(keep);
      const keptPanel = keptDef && panelOf(keptDef);
      if (keptPanel && keptPanel.contains(target)) {
        kept = true;
        break;
      }
    }
    close(topKey(), { restoreFocus: false });
    if (kept) return;
  }
});

window.addEventListener("resize", refresh);
document.addEventListener("scroll", refresh, true);

export const overlay = {
  register: (key: string, def: OverlayDef): void => {
    defs.set(key, def);
    if (openState[key] === undefined) openState[key] = false;
  },
  isOpen: (key: string): boolean => !!openState[key],
  open,
  close,
  place,
};
