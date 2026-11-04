<script setup lang="ts">
import { computed } from "vue";
import { convert } from "../../data/convert";
import { t } from "../../i18n";
import { condText, localizedName } from "../../lib/conditions";
import { openLookup } from "../../state/panels";
import { store } from "../../state/store";
import type {
  CheckpointModel, DiceAddition, DiceCandidate,
} from "../../types/condition";
import CondPartView from "../reader/CondPartView.vue";

const props = defineProps<{ checkpoint: CheckpointModel; method: string }>();

const kind = computed(() => props.checkpoint.kind || props.method);

const branches = computed(() => props.checkpoint.branches || []);

const branchRows = computed(() => branches.value.map((branch) => ({
  expr: branch.expr || null,
  resultText: kind.value === "switch"
    ? t("lookupCondResult", { n: branch.result })
    : t("lookupCondTrue"),
})));

const fallback = computed(() => {
  const checkpoint = props.checkpoint;
  if (!checkpoint.fallback && checkpoint.fallback !== 0) return null;
  const excluded = branches.value
    .map((branch) => (branch && branch.expr ? condText(branch.expr) : ""))
    .filter(Boolean);
  const hint = [t("cxFallbackHint", { n: branches.value.length })];
  if (excluded.length) hint.push(excluded.join(t("listJoin")));
  return {
    resultText: t("lookupCondResult", { n: checkpoint.fallback }),
    tooltipText: hint.join("\n"),
  };
});

const countItems = computed(() => (
  props.checkpoint.useCount ? (props.checkpoint.countItems || []) : []
));

const additions = computed(() => props.checkpoint.additions || []);

const candidates = computed(() => (props.checkpoint.candidates || []).slice(0, 12));

const note = computed(() => (
  props.checkpoint.note ? convert.text(store.textLang(), props.checkpoint.note) : ""
));

const prefix = computed(() => t("lookupCondPrefix", {
  prefix: props.checkpoint.prefix || "—",
}));

const candidateLabel = (candidate: DiceCandidate) => {
  const noteText = candidate.note ? convert.text(store.textLang(), candidate.note) : "";
  const label = candidate.name || t("lookupUnset");
  return noteText ? t("labelNote", { label, note: noteText }) : label;
};

const additionType = (item: DiceAddition) => (
  item.kind ? t(`diceAdd.${item.kind}`, { defaultValue: "" }) : ""
);

const additionName = (item: DiceAddition) => localizedName(item) || item.key || "—";

const additionLinkable = (item: DiceAddition) => !!item.key
  && (item.kind === "stat" || item.kind === "rel" || item.kind === "flag");

const additionRate = (item: DiceAddition) => {
  const rate = Number(item.rate);
  const factor = Number.isFinite(rate) && rate !== 1 ? t("diceAddRate", { n: rate }) : "";
  return `${item.negative ? "−" : "+"}${factor}`;
};

const openAddition = (item: DiceAddition, event: Event) => {
  if (!item.kind || !item.key) return;
  event.stopPropagation();
  event.preventDefault();
  openLookup(item.kind, item.key, event.currentTarget as HTMLElement);
};
</script>

<template>
  <div class="lookup-cond">
    <p class="lookup-cond-title">{{ t("lookupCondTitle") }}</p>
    <div class="lookup-cond-body">
      <template v-if="kind === 'switch' || kind === 'condition'">
        <p v-for="(row, index) in branchRows" :key="`branch-${index}`" class="lc-row">
          <span class="lc-cond">
            <CondPartView v-if="row.expr" :expr="row.expr" :method="method" />
            <template v-else>{{ t("lookupCondEmpty") }}</template>
          </span>
          <span class="lc-result">{{ row.resultText }}</span>
        </p>
        <p v-if="kind === 'switch' && fallback" class="lc-row">
          <span class="lc-cond">
            <span class="cx-fallback" :title="fallback.tooltipText"
                  :aria-label="fallback.tooltipText">
              {{ t("lookupCondFallback") }}
            </span>
          </span>
          <span class="lc-result">{{ fallback.resultText }}</span>
        </p>
        <template v-if="countItems.length">
          <p class="lookup-cond-sub">{{ t("lookupCondCount") }}</p>
          <p v-for="(item, index) in countItems" :key="`count-${index}`" class="lc-row">
            <span class="lc-cond">
              {{ t("lookupCondCountRow", { n: item.threshold, op: item.op }) }}
            </span>
            <span class="lc-result">{{ t("lookupCondResult", { n: item.result }) }}</span>
          </p>
        </template>
      </template>

      <template v-else-if="kind === 'dice'">
        <template v-if="additions.length">
          <p class="lookup-cond-sub">{{ t("lookupCondAdditions") }}</p>
          <p v-for="(item, index) in additions" :key="`add-${index}`"
             class="lc-row lc-add" :class="{ 'is-neg': item.negative }">
            <button v-if="additionLinkable(item)" class="cx-var is-link" type="button"
                    :title="t('lookupStat')" @click="openAddition(item, $event)">
              <span v-if="additionType(item)" class="cx-type">{{ additionType(item) }}</span>
              <span class="cx-name">{{ additionName(item) }}</span>
            </button>
            <span v-else class="lc-add-main">
              <span v-if="additionType(item)" class="lc-add-type">{{ additionType(item) }}</span>
              <span class="lc-add-name">{{ additionName(item) }}</span>
            </span>
            <span class="lc-add-rate">{{ additionRate(item) }}</span>
            <span v-if="item.hide" class="lc-add-tag">{{ t("diceAddHide") }}</span>
          </p>
        </template>
        <p v-for="(row, index) in branchRows" :key="`die-${index}`" class="lc-row">
          <span class="lc-cond">
            <CondPartView v-if="row.expr" :expr="row.expr" :method="method" />
            <template v-else>{{ t("lookupCondEmpty") }}</template>
          </span>
          <span class="lc-result">{{ row.resultText }}</span>
        </p>
        <p v-if="fallback" class="lc-row">
          <span class="lc-cond">
            <span class="cx-fallback" :title="fallback.tooltipText"
                  :aria-label="fallback.tooltipText">
              {{ t("lookupCondFallback") }}
            </span>
          </span>
          <span class="lc-result">{{ fallback.resultText }}</span>
        </p>
      </template>

      <template v-else-if="kind === 'position'">
        <p class="lookup-cond-sub">{{ prefix }}</p>
        <p v-for="(item, index) in candidates" :key="`cand-${index}`" class="lc-row">
          <span class="lc-cond">{{ candidateLabel(item) }}</span>
          <span class="lc-result">{{ t("lookupCondWeight", { n: item.rate }) }}</span>
        </p>
      </template>

      <p v-else-if="kind === 'flag'" class="lc-row lc-plain">
        {{ t("lookupCondFlag", { n: checkpoint.default }) }}
      </p>

      <p v-else class="lookup-cond-muted">{{ t("lookupCondEmpty") }}</p>

      <p v-if="note" class="lookup-cond-note">{{ note }}</p>
    </div>
  </div>
</template>
