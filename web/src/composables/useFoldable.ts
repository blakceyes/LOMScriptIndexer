import { useFoldStore } from "../stores/fold";
import type { Ref } from "vue";

export const useFoldable = (open: Ref<boolean>, enabled: () => boolean = () => true): string => {
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
