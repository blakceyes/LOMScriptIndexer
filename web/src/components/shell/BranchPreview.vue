<script setup lang="ts">
import { nextTick, watch } from "vue";
import { t } from "../../i18n";
import { byId } from "../../lib/browser";
import { overlay } from "../../lib/overlay";
import { previewState } from "../../state/panels";
import { UI_IDS } from "../../ui/ids";

watch(
  () => previewState.open,
  async (value) => {
    if (!value) return;
    await nextTick();
    const node = byId(UI_IDS.branchPreview);
    if (!node || !previewState.trigger) return;
    overlay.place(node, previewState.trigger, {
      align: "start", gap: 6, width: 300, fit: true,
    });
  },
);
</script>

<template>
  <div id="branchPreview" class="branch-preview surface popover" role="tooltip"
       :hidden="!previewState.open">
    <template v-if="previewState.lines.length">
      <div v-if="previewState.hasHead" class="bp-head">
        <span class="bp-title">{{ previewState.title }}</span>
      </div>
      <div v-for="(line, index) in previewState.lines" :key="index"
           class="bp-line" :class="line.kind ? `is-${line.kind}` : ''">
        <span v-if="line.speaker" class="bp-who">{{ line.speaker }}</span>{{ line.text }}
      </div>
      <div v-if="previewState.omittedCount > 0" class="bp-foot">
        {{ t("previewMore", { n: previewState.omittedCount }) }}
      </div>
    </template>
    <div v-else class="bp-empty">{{ t("previewEmpty") }}</div>
  </div>
</template>
