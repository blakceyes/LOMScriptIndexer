<script setup lang="ts">
import { t } from "../../i18n";
import { speakerName } from "../../lib/blocks";
import RichText from "./RichText.vue";
import { usePanelsStore } from "../../stores/panels";

const panels = usePanelsStore();

const props = defineProps<{
  mode: string;
  speaker: string;
  text: string;
  inBattle?: boolean;
}>();

const className = computed(() => {
  if (props.mode === "dialog") return "say";
  return props.mode === "think" ? "say think" : "say narration";
});

const showWho = computed(() => {
  if (!props.speaker) return false;
  if (props.inBattle) return props.mode !== "narration";
  return true;
});

const open = (event: Event) => {
  event.stopPropagation();
  panels.openLookup("speaker", props.speaker, event.currentTarget as HTMLElement);
};
</script>

<template>
  <div :class="className">
    <span v-if="showWho" class="who is-link" :title="t('lookupSpeaker')" @click="open">
      {{ speakerName(speaker) }}
    </span>
    <div class="what"><RichText :text="text" /></div>
  </div>
</template>
