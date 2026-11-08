<script setup lang="ts">
import { graph } from "../../data/graph";
import { t } from "../../i18n";
import type { JumpView } from "../../types/beats";
import AppIcon from "../ui/AppIcon.vue";
import { useFoldStore } from "../../stores/fold";
import { useScriptStore } from "../../stores/script";

const store = useScriptStore();
const fold = useFoldStore();

const props = defineProps<{ jump: JumpView }>();

const candidates = computed(() =>
  (props.jump.targets || []).filter((id) => graph.nodeById.has(id)),
);

const isPosition = computed(() => !!props.jump.position);

const grouped = computed(() => isPosition.value && candidates.value.length > 1);

const open = ref(false);

const foldId = useId();

if (grouped.value) {
  fold.register(foldId, open);
  onUnmounted(() => fold.unregister(foldId));
}

const target = computed(() => (isPosition.value ? candidates.value[0] || "" : props.jump.target));

const exists = () => !!target.value && graph.nodeById.has(target.value);

const label = () => props.jump.dynamicSource || t("jumpDynamic");

const headText = () =>
  t("jumpPositionHead", { key: props.jump.position || "", n: candidates.value.length });

const toggle = () => {
  open.value = !open.value;
};

const go = (id: string) => {
  if (!id) return;
  store.select(id, { history: true });
};
</script>

<template>
  <div v-if="grouped" class="jump-group branch" :class="{ 'is-open': open }">
    <div
      class="branch-head row row-sm"
      role="button"
      tabindex="0"
      :aria-expanded="open"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >
      <span class="cond">{{ headText() }}</span>
      <AppIcon name="chevron" class="caret" />
    </div>
    <div class="branch-body">
      <button
        v-for="id in candidates"
        :key="id"
        class="jump btn btn-sm"
        type="button"
        @click="go(id)"
      >
        <AppIcon name="arrow-right" class="arrow" />{{ id }}
      </button>
    </div>
  </div>
  <span v-else-if="isPosition && !exists()" class="jump dynamic">
    {{ `▷ ${t("jumpPosition")} ${jump.position}${t("parenWrap", { text: t("jumpMissing") })}` }}
  </span>
  <span v-else-if="!target" class="jump dynamic">{{ `▷ ${label()}` }}</span>
  <span v-else-if="!exists()" class="jump dynamic">
    {{ `▷ ${jump.target}${t("parenWrap", { text: t("jumpMissing") })}` }}
  </span>
  <button v-else class="jump btn btn-sm" type="button" @click="go(target)">
    <AppIcon name="arrow-right" class="arrow" />{{ target
    }}<span v-if="jump.dynamicSource" class="option-cond">{{ `  ${jump.dynamicSource}` }}</span>
  </button>
</template>
