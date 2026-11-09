import { useFoldStore } from "../stores/fold";
import { useScriptStore } from "../stores/script";
import type { Ref } from "vue";

export const useFoldMemory = (key: string, open: Ref<boolean>): void => {
  if (!key) return;
  const fold = useFoldStore();
  const scoped = `${useScriptStore().selectedId}:${key}`;
  const stored = fold.recall(scoped);
  if (stored !== undefined) open.value = stored;
  watch(open, (value) => fold.remember(scoped, value), { flush: "sync" });
};

export const useFoldable = (
  key: string,
  open: Ref<boolean>,
  enabled: () => boolean = () => true,
): string => {
  useFoldMemory(key, open);
  const fold = useFoldStore();
  const id = useId();

  watch(
    enabled,
    (active) => {
      if (active) fold.register(id, open);
      else fold.unregister(id);
    },
    { immediate: true, flush: "sync" },
  );

  onUnmounted(() => fold.unregister(id));

  return id;
};
