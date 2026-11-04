<script setup lang="ts">
import { computed } from "vue";
import { splitSizeTags } from "../../lib/sizeTags";

const props = defineProps<{ richText: string }>();

const segments = computed(() => splitSizeTags(props.richText));
</script>

<template>
  <template v-for="(segment, index) in segments" :key="index">
    <span v-if="segment.scale !== 1"
          :style="{ fontSize: `${segment.scale.toFixed(2)}em` }">{{ segment.text }}</span>
    <template v-else>{{ segment.text }}</template>
  </template>
</template>
