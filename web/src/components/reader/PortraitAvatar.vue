<script setup lang="ts">
import { t } from "../../i18n";
import { speakerName } from "../../lib/blocks";
import { ensurePortraitManifest, portraitSource } from "../../lib/portraits";
import type { PortraitView } from "../../types/beats";

const props = defineProps<{ portrait: PortraitView; speaker: string }>();
const failed = ref<string[]>([]);
const source = computed(() =>
  portraitSource(props.portrait.character, props.portrait.expression, failed.value),
);
const label = computed(() =>
  source.value?.fallback ? t("portraitDefault") : props.portrait.expression || t("portraitUnknown"),
);
const description = computed(
  () =>
    speakerName(props.speaker) +
    " · " +
    (props.portrait.expression || t("portraitUnknown")) +
    (source.value?.fallback ? " · " + t("portraitDefaultHint") : ""),
);
watch(
  () => [props.portrait.character, props.portrait.expression],
  () => {
    failed.value = [];
  },
);
const imageFailed = () => {
  if (source.value) failed.value = [...failed.value, source.value.file];
};
onMounted(() => {
  void ensurePortraitManifest();
});
</script>

<template>
  <figure class="portrait" :class="{ 'is-default': source?.fallback }" :title="description">
    <img
      v-if="source"
      :src="source.url"
      :alt="description"
      width="80"
      height="94"
      loading="lazy"
      decoding="async"
      @error="imageFailed"
    />
    <div v-else class="portrait-fallback" role="img" :aria-label="description">
      <svg viewBox="0 0 40 48" aria-hidden="true">
        <circle cx="20" cy="14" r="8" />
        <path d="M5 43c0-11 6-17 15-17s15 6 15 17" />
      </svg>
      <span>{{ portrait.expression ? t("portraitMissing") : t("portraitUnknown") }}</span>
    </div>
    <figcaption>{{ label }}</figcaption>
  </figure>
</template>
