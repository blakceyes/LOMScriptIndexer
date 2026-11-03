<script setup lang="ts">
import { t } from "../../i18n";
import { store } from "../../state/store";
import { text } from "../../data/text";

const props = defineProps<{ failed?: boolean }>();
const emit = defineEmits<{ (event: "retry"): void }>();

const retry = () => {
  const node = store.selected();
  if (!node) return;
  void text.retry(store.textLang(), node.id);
  emit("retry");
};

void props;
</script>

<template>
  <div v-if="!failed" class="reader-skeleton" role="status" aria-live="polite">
    <span class="sk-caption">{{ t("loadTextLoading") }}</span>
    <span v-for="index in 5" :key="index" class="sk-line" :style="{ width: `${100 - (index - 1) * 9}%` }"></span>
  </div>
  <div v-else class="reader-skeleton is-failed">
    <span class="sk-caption">{{ t("loadTextFailed") }}</span>
    <button class="tool-btn btn" type="button" @click="retry">{{ t("loadTextRetry") }}</button>
  </div>
</template>
