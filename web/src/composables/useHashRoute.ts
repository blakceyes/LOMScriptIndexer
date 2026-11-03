import { onBeforeUnmount, onMounted } from "vue";

export const readHash = (): string | null => {
  const match = /^#\/(.+)$/.exec(location.hash || "");
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

export const writeHash = (id: string): void => {
  if (!window.history || !history.replaceState) return;
  const target = `#/${id}`;
  if (location.hash !== target) history.replaceState(null, "", target);
};

export const useHashRoute = (onChange: (id: string) => void): void => {
  const handler = () => {
    const id = readHash();
    if (id) onChange(id);
  };
  onMounted(() => window.addEventListener("hashchange", handler));
  onBeforeUnmount(() => window.removeEventListener("hashchange", handler));
};
