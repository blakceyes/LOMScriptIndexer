import { ref } from "vue";

export const revealHeld = ref(false);

export const holdReveal = (): void => {
  revealHeld.value = true;
};

export const releaseReveal = (): void => {
  revealHeld.value = false;
};
