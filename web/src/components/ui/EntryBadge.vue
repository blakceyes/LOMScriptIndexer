<script setup lang="ts">
import { computed } from "vue";
import { entryClass, entryLabel } from "../../lib/beats";
import { t } from "../../i18n";
import type { GraphNode } from "../../types/graph";

const props = defineProps<{ node: GraphNode | null }>();

const label = computed(() => entryLabel(props.node));

const className = computed(() => `${entryClass(props.node)}${props.node ? ` is-${props.node.entry}` : ""}`);

const title = computed(() => t("entrySourceTitle", { name: label.value }));
</script>

<template>
  <span v-if="label" :class="className" :title="title">{{ label }}</span>
</template>
