<script setup lang="ts">
import { checkpoints } from "../../data/checkpoints";
import { graph } from "../../data/graph";
import { t } from "../../i18n";
import { positionNeverReachable, positionTargetId } from "../../lib/conditions";
import type { JumpView } from "../../types/beats";
import type { CheckpointModel, PositionCandidate } from "../../types/condition";
import AppIcon from "../ui/AppIcon.vue";
import CondPartView from "./CondPartView.vue";
import { useFoldStore } from "../../stores/fold";
import { usePanelsStore } from "../../stores/panels";
import { useScriptStore } from "../../stores/script";

const store = useScriptStore();
const fold = useFoldStore();
const panels = usePanelsStore();

const props = defineProps<{ jump: JumpView }>();

const candidates = computed(() =>
  (props.jump.targets || []).filter((id) => graph.nodeById.has(id)),
);

const isPosition = computed(() => !!props.jump.position);

const collapsible = computed(() => isPosition.value && candidates.value.length > 1);

const hasRows = computed(() => isPosition.value && candidates.value.length > 0);

const model = ref<CheckpointModel | null>(null);

type PositionRow = {
  id: string;
  candidate: PositionCandidate | null;
  weight: number;
  never: boolean;
};

const rows = computed<PositionRow[]>(() => {
  const prefix = model.value?.prefix || "";
  const byId = new Map<string, PositionCandidate>();
  for (const candidate of model.value?.candidates || []) {
    const id = positionTargetId(prefix, candidate.name || "");
    if (!id) continue;
    const key = id.toUpperCase();
    const existing = byId.get(key);
    if (!existing || (positionNeverReachable(existing) && !positionNeverReachable(candidate))) {
      byId.set(key, candidate);
    }
  }
  return candidates.value.map((id) => {
    const candidate = byId.get(id.toUpperCase()) || null;
    return {
      id,
      candidate,
      weight: candidate ? candidate.rate : 0,
      never: candidate ? positionNeverReachable(candidate) : false,
    };
  });
});

const weightText = (candidate: PositionCandidate): string =>
  t("lookupCondWeight", { n: candidate.rate });

const signedRate = (value: number): string => (value > 0 ? `+${value}` : String(value));

const hasConditions = (candidate: PositionCandidate): boolean => {
  if (candidate.active) return true;
  return (candidate.adjustments || []).length > 0;
};

const open = ref(false);

const foldId = useId();

if (collapsible.value) {
  fold.register(foldId, open);
  onUnmounted(() => fold.unregister(foldId));
}

const target = computed(() => props.jump.target);

const exists = () => !!target.value && graph.nodeById.has(target.value);

const label = () => props.jump.dynamicSource || t("jumpDynamic");

const headText = () =>
  t("jumpPositionHead", { key: props.jump.position || "", n: candidates.value.length });

const toggle = () => {
  open.value = !open.value;
};

const go = (id: string) => {
  if (!id) return;
  store.select(id, { history: true });
};

const openLookup = (event: Event) => {
  if (!props.jump.position) return;
  event.stopPropagation();
  event.preventDefault();
  panels.openLookup(
    "check",
    props.jump.position,
    event.currentTarget as HTMLElement,
    "position",
  );
};

let loadSeq = 0;

const loadCheckpoint = () => {
  const key = props.jump.position || "";
  const seq = ++loadSeq;
  model.value = null;
  if (!key) return;
  void checkpoints.ensure(key).then(() => {
    if (seq !== loadSeq) return;
    model.value = checkpoints.getByKey(key, "position");
  });
};

watch(() => props.jump.position, loadCheckpoint, { immediate: true });
</script>

<template>
  <div v-if="hasRows" class="jump-group" :class="{ 'is-open': !collapsible || open }">
    <div
      class="branch-head row row-sm jump-head"
      :role="collapsible ? 'button' : undefined"
      :tabindex="collapsible ? 0 : undefined"
      :aria-expanded="collapsible ? open : undefined"
      @click="collapsible ? toggle() : undefined"
      @keydown.enter.prevent="collapsible ? toggle() : undefined"
      @keydown.space.prevent="collapsible ? toggle() : undefined"
    >
      <span class="cond">{{ headText() }}</span>
      <button
        class="cond-lookup btn btn-icon"
        type="button"
        :title="t('jumpPositionLookup')"
        :aria-label="t('jumpPositionLookup')"
        @click="openLookup"
      >
        <AppIcon name="search" />
      </button>
      <AppIcon v-if="collapsible" name="chevron" class="caret" />
    </div>
    <div class="jump-body">
      <p class="jump-random">{{ t("jumpPositionRandom") }}</p>
      <div v-for="row in rows" :key="row.id" class="jump-row">
        <div class="jump-row-main">
          <button class="jump btn btn-sm" type="button" @click="go(row.id)">
            <AppIcon name="arrow-right" class="arrow" />{{ row.id }}
          </button>
          <span v-if="row.candidate" class="jump-weight">
            {{ weightText(row.candidate) }}
          </span>
          <span v-if="row.never" class="badge jump-tag is-never">
            {{ t("jumpPositionNever") }}
          </span>
        </div>
        <div v-if="row.candidate && hasConditions(row.candidate)" class="jump-conds">
          <p
            v-if="row.candidate.active && row.candidate.activeEmpty"
            class="jump-cond-line is-warn"
          >
            <span class="jump-cond-label">{{ t("lookupCondActive") }}</span>
            <span class="jump-cond-text">{{ t("lookupCondUnset") }}</span>
          </p>
          <p v-else-if="row.candidate.active" class="jump-cond-line">
            <span class="jump-cond-label">{{ t("lookupCondActive") }}</span>
            <CondPartView
              v-if="row.candidate.activeCondition"
              :expr="row.candidate.activeCondition"
              method="position"
            />
            <span v-else class="jump-cond-text">{{ t("lookupCondUnparsed") }}</span>
          </p>
          <p
            v-for="(adjustment, adjustIndex) in row.candidate.adjustments || []"
            :key="`adj-${adjustIndex}`"
            class="jump-cond-line"
          >
            <span class="jump-cond-label">{{ t("lookupCondAdjust") }}</span>
            <span class="jump-cond-rate">{{ signedRate(adjustment.rate) }}</span>
            <CondPartView
              v-if="adjustment.condition"
              :expr="adjustment.condition"
              method="position"
            />
            <span v-else class="jump-cond-text">{{ t("lookupCondUnparsed") }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
  <span v-else-if="isPosition" class="jump dynamic">
    {{ `▷ ${t("jumpPosition")} ${jump.position}${t("parenWrap", { text: t("jumpMissing") })}` }}
  </span>
  <span v-else-if="!target" class="jump dynamic">{{ `▷ ${label()}` }}</span>
  <span v-else-if="!exists()" class="jump dynamic">
    {{ `▷ ${jump.target}${t("parenWrap", { text: t("jumpMissing") })}` }}
  </span>
  <button v-else class="jump btn btn-sm" type="button" @click="go(target)">
    <AppIcon name="arrow-right" class="arrow" />{{ target
    }}<span v-if="jump.dynamicSource" class="option-cond">{{ `  ${jump.dynamicSource}` }}</span>
  </button>
</template>
