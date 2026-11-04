<script setup lang="ts">
import { computed } from "vue";
import { dataset } from "../../data/dataset";
import { graph } from "../../data/graph";
import { t } from "../../i18n";

const buildLine = computed(() => {
  const meta = dataset.meta;
  const game = meta.game || {};
  const parts: string[] = [];
  if (graph.nodes.length && meta.generated) parts.push(meta.generated);
  if (game.version) parts.push(t("gameVersion", { ver: game.version }));
  if (game.build) parts.push(t("gameBuild", { build: game.build }));
  return parts.join(" · ");
});
</script>

<template>
  <div class="brand">
    <span class="seal" aria-hidden="true">活</span>
    <div class="brand-text">
      <h1>{{ t("appTitle") }}</h1>
      <p id="buildLine" class="brand-build">{{ buildLine }}</p>
    </div>
  </div>
</template>
