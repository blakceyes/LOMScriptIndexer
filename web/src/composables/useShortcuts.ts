export type ShortcutHandlers = {
  back: () => void;
  forward: () => void;
  bookmark: () => void;
  jump: () => void;
  help: () => void;
  search: () => void;
  infer: () => void;
  revealStart: () => void;
  revealEnd: () => void;
};

const typingInField = (): boolean => {
  const active = document.activeElement as HTMLElement | null;
  if (!active) return false;
  const tag = (active.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || active.isContentEditable;
};

export const useShortcuts = (handlers: ShortcutHandlers): void => {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "?" && !typingInField()) {
      event.preventDefault();
      handlers.help();
      return;
    }
    if (typingInField()) return;

    if (event.key === "/") {
      event.preventDefault();
      handlers.search();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      handlers.back();
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      handlers.forward();
      return;
    }
    if (String(event.key || "").toLowerCase() === "b") {
      event.preventDefault();
      handlers.bookmark();
      return;
    }
    if (String(event.key || "").toLowerCase() === "f") {
      event.preventDefault();
      handlers.infer();
      return;
    }
    if (String(event.key || "").toLowerCase() === "h") {
      event.preventDefault();
      handlers.revealStart();
      return;
    }
    if (String(event.key || "").toLowerCase() === "j") {
      handlers.jump();
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (String(event.key || "").toLowerCase() === "h") handlers.revealEnd();
  };

  const onBlur = () => handlers.revealEnd();

  onMounted(() => {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
  });
  onBeforeUnmount(() => {
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
  });
};
