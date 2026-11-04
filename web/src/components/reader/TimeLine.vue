<script setup lang="ts">
import { t, timeText } from "../../i18n";
import AppIcon from "../ui/AppIcon.vue";

defineProps<{ rounds: number }>();
</script>

<template>
  <div class="time-mark">
    <span class="time-label">{{ t("metaTimeLabel") }}</span>
    <AppIcon name="arrow-right" class="time-arrow" />
    <span class="time-value">{{ timeText(rounds) }}</span>
  </div>
</template>
