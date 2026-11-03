<script setup lang="ts">
import { computed } from "vue";
import { condParts, type CondPart } from "../../lib/cond";
import { openLookup } from "../../state/ui";
import type { CondNode } from "../../types/cond";

const props = defineProps<{
  expr?: CondNode | null;
  part?: CondPart | null;
  method?: string;
}>();

const root = computed<CondPart | null>(() => (
  props.part ? props.part : condParts(props.expr || null)
));

const isText = (part: CondPart): part is { text: string } => "text" in part;

const onLookup = (event: Event) => {
  const part = props.part;
  if (!part || isText(part) || !part.lookup) return;
  event.stopPropagation();
  event.preventDefault();
  openLookup(part.lookup.kind, part.lookup.key, event.currentTarget as HTMLElement, props.method);
};
</script>

<template>
  <template v-if="part">
    <template v-if="isText(part)">{{ part.text }}</template>
    <span v-else-if="part.tag === 'span'" :class="part.cls" :title="part.title" :aria-label="part.title">
      <CondExpr v-for="(child, index) in part.children" :key="index" :part="child" :method="method" />
    </span>
    <button v-else :class="part.cls" type="button" :title="part.title" :role="part.role"
            :data-kind="part.lookup ? part.kind : undefined" :data-key="part.lookup ? part.lookup.key : undefined"
            :aria-label="part.title"
            @click="onLookup" @keydown.enter.prevent="onLookup" @keydown.space.prevent="onLookup">
      <CondExpr v-for="(child, index) in part.children" :key="index" :part="child" :method="method" />
    </button>
  </template>
  <CondExpr v-else-if="root" :part="root" :method="method" />
</template>
