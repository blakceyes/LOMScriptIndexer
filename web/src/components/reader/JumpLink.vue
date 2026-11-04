<script setup lang="ts">
import { graph } from "../../data/graph";
import { t } from "../../i18n";
import { store } from "../../state/store";
import type { JumpView } from "../../types/beats";
import AppIcon from "../ui/AppIcon.vue";

const props = defineProps<{ jump: JumpView }>();

const exists = () => !!props.jump.target && graph.nodeById.has(props.jump.target);

const label = () => props.jump.dynamicSource || t("jumpDynamic");

const go = () => {
  if (!props.jump.target) return;
  store.select(props.jump.target, { history: true });
};
</script>

<template>
  <span v-if="!jump.target" class="jump dynamic">{{ `▷ ${label()}` }}</span>
  <span v-else-if="!exists()" class="jump dynamic">
    {{ `▷ ${jump.target}${t("parenWrap", { text: t("jumpMissing") })}` }}
  </span>
  <button v-else class="jump btn btn-sm" type="button" @click="go">
    <AppIcon name="arrow-right" class="arrow" />{{ jump.target }}<span
      v-if="jump.dynamicSource" class="option-cond">{{ `  ${jump.dynamicSource}` }}</span>
  </button>
</template>
