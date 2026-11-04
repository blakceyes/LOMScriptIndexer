import { ref } from "vue";

export const toastText = ref("");

export const ioText = ref("");

let timer: ReturnType<typeof setTimeout> | null = null;

export const toast = (message: string): void => {
  if (!message) return;
  toastText.value = message;
  if (timer !== null) clearTimeout(timer);
  timer = setTimeout(() => {
    toastText.value = "";
    timer = null;
  }, 2400);
};

export const setIoStatus = (message: string): void => {
  ioText.value = message ? String(message) : "";
};
