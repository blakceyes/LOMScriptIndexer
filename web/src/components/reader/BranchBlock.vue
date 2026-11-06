<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { createBranchPreview } from "../../composables/branchPreview";
import { checkpoints } from "../../data/checkpoints";
import { t } from "../../i18n";
import { branchLabel } from "../../lib/blocks";
import { condHint, condText, checkpointExpr, checkpointFallback } from "../../lib/conditions";
import { openLookup } from "../../state/panels";
import type { BranchView } from "../../types/beats";
import type { ConditionNode } from "../../types/condition";
import AppIcon from "../ui/AppIcon.vue";
import BlockList from "./BlockList.vue";
import CondPartView from "./CondPartView.vue";

const props = defineProps<{ branch: BranchView }>();

const head = ref<HTMLElement | null>(null);
const open = ref(false);
const condition = ref<ConditionNode | null>(null);
const fallbackBranchCount = ref(0);
const excludedConditions = ref<ConditionNode[]>([]);

const isEmpty = computed(() => (
  !props.branch.blocks || props.branch.blocks.length === 0
));

const label = computed(() => branchLabel(props.branch));

const hasCondition = computed(() => !!condition.value);

const isFallback = computed(() => !condition.value && fallbackBranchCount.value > 0);

const tooltipText = computed(() => {
  const lines: string[] = [];
  if (hasCondition.value) return condHint(condition.value);
  if (!isFallback.value) return label.value;
  lines.push(label.value);
  lines.push(t("cxFallbackHint", { n: fallbackBranchCount.value }));
  const excluded = excludedConditions.value.map(condText).filter(Boolean);
  if (excluded.length) lines.push(excluded.join(t("listJoin")));
  return lines.filter(Boolean).join("\n");
});

const preview = createBranchPreview(
  () => head.value,
  () => open.value,
  () => ({ title: label.value, beats: props.branch.beats }),
);

const toggle = () => {
  open.value = !open.value;
  if (open.value) preview.onBlur();
};

const openCheck = (event: Event) => {
  const check = props.branch.check;
  if (!check) return;
  event.stopPropagation();
  openLookup("check", check.key, event.currentTarget as HTMLElement, check.kind);
};

const checkSignature = computed(() => {
  const check = props.branch.check;
  if (!check || !check.key) return "";
  return `${check.key}|${check.kind}|${check.expectedResult ?? ""}`;
});

let resolveSeq = 0;

const resolveCondition = () => {
  const seq = ++resolveSeq;
  condition.value = null;
  fallbackBranchCount.value = 0;
  excludedConditions.value = [];
  const check = props.branch.check;
  if (!check || !check.key) return;
  if (props.branch.condition) condition.value = props.branch.condition;
  void checkpoints.ensure(check.key).then(() => {
    if (seq !== resolveSeq) return;
    const picked = checkpointExpr(check);
    if (picked) {
      condition.value = picked;
      return;
    }
    condition.value = null;
    const missed = checkpointFallback(check);
    if (!missed) return;
    fallbackBranchCount.value = missed.lineCount;
    excludedConditions.value = missed.excluded;
  });
};

watch(checkSignature, resolveCondition, { immediate: true });
</script>

<template>
  <div class="branch" :class="{ 'is-empty': isEmpty, 'is-open': open }">
    <div ref="head" :class="isEmpty ? 'branch-head' : 'branch-head row row-sm'"
         :role="isEmpty ? undefined : 'button'" :tabindex="isEmpty ? undefined : 0"
         :aria-expanded="isEmpty ? undefined : open"
         :data-kind="branch.check ? 'check' : undefined"
         :data-key="branch.check ? branch.check.key : undefined"
         @click="isEmpty ? undefined : toggle()"
         @keydown.enter.prevent="isEmpty ? undefined : toggle()"
         @keydown.space.prevent="isEmpty ? undefined : toggle()"
         @mouseenter="isEmpty ? undefined : preview.onMouseenter()"
         @mousemove="isEmpty ? undefined : preview.onMousemove($event)"
         @mouseleave="isEmpty ? undefined : preview.onMouseleave()"
         @focus="isEmpty ? undefined : preview.onFocus()"
         @blur="isEmpty ? undefined : preview.onBlur()">
      <span class="cond" :class="{ 'is-expr': hasCondition, 'is-fallback': isFallback }"
            :title="tooltipText || undefined">
        <CondPartView v-if="hasCondition" :expr="condition" :method="branch.check?.kind" />
        <span v-else-if="isFallback" class="cx-fallback">{{ t("lookupCondFallback") }}</span>
        <template v-else>{{ label }}</template>
      </span>
      <button v-if="!isEmpty && branch.check" class="cond-lookup btn btn-icon" type="button"
              :title="t('condLookup')" :aria-label="t('condLookup')" @click="openCheck">
        <AppIcon name="search" />
      </button>
      <span v-if="isEmpty" class="branch-empty" :title="t('previewEmpty')"
            :aria-label="t('previewEmpty')">
        {{ t("branchEmpty") }}
      </span>
    </div>
    <div v-if="!isEmpty" class="branch-body">
      <BlockList :blocks="branch.blocks || []" />
    </div>
  </div>
</template>
