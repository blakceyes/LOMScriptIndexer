<script setup lang="ts">
import { computed } from "vue";
import { condParts, type ConditionPart } from "../../lib/conditions";
import { openLookup } from "../../state/panels";
import type { ConditionNode } from "../../types/condition";

const props = defineProps<{
  expr?: ConditionNode | null;
  part?: ConditionPart | null;
  method?: string;
}>();

const root = computed<ConditionPart | null>(() => (
  props.part ? props.part : condParts(props.expr || null)
));

const isText = (part: ConditionPart): part is { text: string } => "text" in part;

const onLookup = (event: Event) => {
  const part = props.part;
  if (!part || isText(part) || !part.lookup) return;
  event.stopPropagation();
  event.preventDefault();
  openLookup(
    part.lookup.kind, part.lookup.key, event.currentTarget as HTMLElement, props.method);
};
</script>

<template>
  <template v-if="part">
    <template v-if="isText(part)">{{ part.text }}</template>
    <span v-else-if="part.htmlTag === 'span'" :class="part.className" :title="part.title"
          :aria-label="part.title">
      <CondPartView v-for="(child, index) in part.children" :key="index" :part="child"
                    :method="method" />
    </span>
    <button v-else :class="part.className" type="button" :title="part.title" :role="part.role"
            :data-kind="part.lookup ? part.kind : undefined"
            :data-key="part.lookup ? part.lookup.key : undefined"
            :aria-label="part.title"
            @click="onLookup" @keydown.enter.prevent="onLookup"
            @keydown.space.prevent="onLookup">
      <CondPartView v-for="(child, index) in part.children" :key="index" :part="child"
                    :method="method" />
    </button>
  </template>
  <CondPartView v-else-if="root" :part="root" :method="method" />
</template>
