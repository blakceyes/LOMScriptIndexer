<script setup lang="ts">
import type { SpecimenBox } from "../../state/fontTypes";

defineProps<{ boxes: SpecimenBox[]; text: string }>();
</script>

<template>
  <component :is="boxes[0].tag" :class="boxes[0].cls">
    <TypeSpecimen v-if="boxes.length > 1" :boxes="boxes.slice(1)" :text="text" />
    <template v-else>{{ text }}</template>
  </component>
</template>
