<script setup lang="ts">
import { t } from "../../i18n";

defineProps<{ empty: boolean; flagsEmpty?: boolean }>();
</script>

<template>
  <div class="empty-state">
    <template v-if="empty">
      <span class="brush">{{ t("emptyBrush") }}</span>
      <h3>{{ t("emptyH3") }}</h3>
      <p>{{ t("emptyP") }}</p>
      <p class="hint-line">{{ t("emptyHint") }}</p>
    </template>
    <template v-else>
      <span class="brush">{{ t("brushGlyph") }}</span>
      <h3>{{ t("noBeatsTitle") }}</h3>
      <p>{{ t(flagsEmpty ? "noBeatsEmpty" : "noBeatsOther") }}</p>
    </template>
  </div>
</template>
