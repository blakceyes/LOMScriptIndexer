import { ref } from "vue";

export const toastText = ref("");

export const ioText = ref("");

let timer: ReturnType<typeof setTimeout> | null = null;

export const toast = (text: string): void => {
  if (!text) return;
  toastText.value = text;
  if (timer !== null) clearTimeout(timer);
  timer = setTimeout(() => {
    toastText.value = "";
    timer = null;
  }, 2400);
};

export const progress = (text: string): void => {
  ioText.value = text ? String(text) : "";
};
