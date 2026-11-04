<script setup lang="ts">
import { computed } from "vue";
import { graph } from "../../data/graph";
import { data } from "../../data/schema";
import { t } from "../../i18n";

const build = computed(() => {
  const meta = data.meta;
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
      <p id="buildLine" class="brand-build">{{ build }}</p>
    </div>
  </div>
</template>
