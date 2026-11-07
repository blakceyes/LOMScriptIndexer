<script setup lang="ts">
import { t } from "../../i18n";
import { byId } from "../../lib/browser";
import { overlay } from "../../lib/overlay";
import { UI_IDS } from "../../ui/ids";
import { usePanelsStore } from "../../stores/panels";

const panels = usePanelsStore();

watch(
  () => panels.previewState.open,
  async (value) => {
    if (!value) return;
    await nextTick();
    const node = byId(UI_IDS.branchPreview);
    if (!node || !panels.previewState.trigger) return;
    overlay.place(node, panels.previewState.trigger, {
      align: "start",
      gap: 6,
      width: 300,
      fit: true,
    });
  },
);
</script>

<template>
  <div
    id="branchPreview"
    class="branch-preview surface popover"
    role="tooltip"
    :hidden="!panels.previewState.open"
  >
    <template v-if="panels.previewState.lines.length">
      <div v-if="panels.previewState.hasHead" class="bp-head">
        <span class="bp-title">{{ panels.previewState.title }}</span>
      </div>
      <div
        v-for="(line, index) in panels.previewState.lines"
        :key="index"
        class="bp-line"
        :class="line.kind ? `is-${line.kind}` : ''"
      >
        <span v-if="line.speaker" class="bp-who">{{ line.speaker }}</span>{{ line.text }}
      </div>
      <div v-if="panels.previewState.omittedCount > 0" class="bp-foot">
        {{ t("previewMore", { n: panels.previewState.omittedCount }) }}
      </div>
    </template>
    <div v-else class="bp-empty">{{ t("previewEmpty") }}</div>
  </div>
</template>
