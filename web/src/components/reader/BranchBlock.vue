<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { checkpoints } from "../../data/checkpoints";
import { t } from "../../i18n";
import { branchLabel } from "../../lib/blocks";
import { checkpointExpr, checkpointFallback, condText } from "../../lib/cond";
import { useBranchPreview } from "../../composables/useBranchPreview";
import { openLookup } from "../../state/panels";
import type { BranchView } from "../../types/beats";
import type { CondNode } from "../../types/cond";
import AppIcon from "../ui/AppIcon.vue";
import BeatList from "./BeatList.vue";
import CondExpr from "./CondExpr.vue";

const props = defineProps<{ branch: BranchView }>();

const head = ref<HTMLElement | null>(null);
const open = ref(false);
const expr = ref<CondNode | null>(null);
const fallbackSize = ref(0);
const fallbackExcluded = ref<CondNode[]>([]);

const empty = computed(() => !props.branch.blocks || props.branch.blocks.length === 0);

const label = computed(() => branchLabel(props.branch));

const isExpr = computed(() => !!expr.value);

const isFallback = computed(() => !expr.value && fallbackSize.value > 0);

const title = computed(() => {
  const lines: string[] = [];
  if (isExpr.value) return condText(expr.value);
  if (!isFallback.value) return label.value;
  lines.push(label.value);
  lines.push(t("cxFallbackHint", { n: fallbackSize.value }));
  const excluded = fallbackExcluded.value.map(condText).filter(Boolean);
  if (excluded.length) lines.push(excluded.join(t("listJoin")));
  return lines.filter(Boolean).join("\n");
});

const preview = useBranchPreview(
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

const upgrade = () => {
  const check = props.branch.check;
  if (!check || !check.key) return;
  void checkpoints.ensure(check.key).then(() => {
    const picked = checkpointExpr(check);
    if (picked) {
      expr.value = picked;
      return;
    }
    const missed = checkpointFallback(check);
    if (!missed) return;
    fallbackSize.value = missed.n;
    fallbackExcluded.value = missed.excluded;
  });
};

onMounted(upgrade);
</script>

<template>
  <div class="branch" :class="{ 'is-empty': empty, 'is-open': open }">
    <div ref="head" :class="empty ? 'branch-head' : 'branch-head row row-sm'"
         :role="empty ? undefined : 'button'" :tabindex="empty ? undefined : 0"
         :aria-expanded="empty ? undefined : open"
         @click="empty ? undefined : toggle()"
         @keydown.enter.prevent="empty ? undefined : toggle()"
         @keydown.space.prevent="empty ? undefined : toggle()"
         @mouseenter="empty ? undefined : preview.onMouseenter()"
         @mousemove="empty ? undefined : preview.onMousemove($event)"
         @mouseleave="empty ? undefined : preview.onMouseleave()"
         @focus="empty ? undefined : preview.onFocus()"
         @blur="empty ? undefined : preview.onBlur()">
      <span class="cond" :class="{ 'is-expr': isExpr, 'is-fallback': isFallback }" :title="title || undefined">
        <CondExpr v-if="isExpr" :expr="expr" :method="branch.check?.kind" />
        <span v-else-if="isFallback" class="cx-fallback">{{ t("lookupCondFallback") }}</span>
        <template v-else>{{ label }}</template>
      </span>
      <button v-if="!empty && branch.check" class="cond-lookup btn btn-icon" type="button"
              :title="t('condLookup')" :aria-label="t('condLookup')" @click="openCheck">
        <AppIcon name="search" />
      </button>
      <span v-if="empty" class="branch-empty" :title="t('previewEmpty')" :aria-label="t('previewEmpty')">
        {{ t("branchEmpty") }}
      </span>
    </div>
    <div v-if="!empty" class="branch-body">
      <BeatList :blocks="branch.blocks || []" />
    </div>
  </div>
</template>
