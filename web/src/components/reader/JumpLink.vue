<script setup lang="ts">
import { checkpoints } from "../../data/checkpoints";
import { graph } from "../../data/graph";
import { t } from "../../i18n";
import {
  condHint,
  positionConditionNodes,
  positionNeverReachable,
  positionTargetId,
} from "../../lib/conditions";
import type { JumpView } from "../../types/beats";
import type { CheckpointModel, PositionCandidate } from "../../types/condition";
import AppIcon from "../ui/AppIcon.vue";
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

const grouped = computed(() => isPosition.value && candidates.value.length > 1);

const model = ref<CheckpointModel | null>(null);

type PositionRow = {
  id: string;
  candidate: PositionCandidate | null;
  weight: number;
  conditional: boolean;
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
      conditional: candidate ? positionConditionNodes(candidate).length > 0 : false,
      never: candidate ? positionNeverReachable(candidate) : false,
    };
  });
});

const singleRow = computed<PositionRow | null>(() =>
  isPosition.value && !grouped.value ? rows.value[0] || null : null,
);

const conditionHintOf = (candidate: PositionCandidate | null): string => {
  if (!candidate) return "";
  const lines: string[] = [];
  if (candidate.active && candidate.activeEmpty) lines.push(t("lookupCondUnset"));
  if (candidate.active && candidate.activeCondition) {
    lines.push(`${t("lookupCondActive")}: ${condHint(candidate.activeCondition)}`);
  }
  for (const item of candidate.adjustments || []) {
    const rate = item.rate > 0 ? `+${item.rate}` : String(item.rate);
    const condition = item.condition ? condHint(item.condition) : "";
    lines.push(`${t("lookupCondAdjust")} ${rate}${condition ? `: ${condition}` : ""}`);
  }
  return lines.filter(Boolean).join("\n");
};

const weightText = (candidate: PositionCandidate | null): string =>
  candidate ? t("lookupCondWeight", { n: candidate.rate }) : "";

const singleWeight = computed(() => {
  const row = singleRow.value;
  return row && row.candidate ? weightText(row.candidate) : "";
});

const singleHint = computed(() => {
  const row = singleRow.value;
  if (!row) return undefined;
  return conditionHintOf(row.candidate) || undefined;
});

const open = ref(false);

const foldId = useId();

if (grouped.value) {
  fold.register(foldId, open);
  onUnmounted(() => fold.unregister(foldId));
}

const target = computed(() => (isPosition.value ? candidates.value[0] || "" : props.jump.target));

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
  <div v-if="grouped" class="jump-group branch" :class="{ 'is-open': open }">
    <div
      class="branch-head row row-sm"
      role="button"
      tabindex="0"
      :aria-expanded="open"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
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
      <AppIcon name="chevron" class="caret" />
    </div>
    <div class="branch-body">
      <p v-if="model" class="jump-random">{{ t("jumpPositionRandom") }}</p>
      <div class="jump-rows">
        <button
          v-for="row in rows"
          :key="row.id"
          class="jump btn btn-sm"
          type="button"
          @click="go(row.id)"
        >
          <AppIcon name="arrow-right" class="arrow" />{{ row.id }}
          <span
            v-if="row.candidate"
            class="jump-weight"
            :title="conditionHintOf(row.candidate) || undefined"
          >
            {{ weightText(row.candidate) }}
          </span>
          <span
            v-if="row.conditional"
            class="badge jump-tag"
            :title="conditionHintOf(row.candidate)"
          >
            {{ t("jumpPositionConditional") }}
          </span>
          <span v-if="row.never" class="badge jump-tag is-never">
            {{ t("jumpPositionNever") }}
          </span>
        </button>
      </div>
    </div>
  </div>
  <span v-else-if="isPosition && !exists()" class="jump dynamic">
    {{ `▷ ${t("jumpPosition")} ${jump.position}${t("parenWrap", { text: t("jumpMissing") })}` }}
  </span>
  <span v-else-if="!target" class="jump dynamic">{{ `▷ ${label()}` }}</span>
  <span v-else-if="!exists()" class="jump dynamic">
    {{ `▷ ${jump.target}${t("parenWrap", { text: t("jumpMissing") })}` }}
  </span>
  <button v-else class="jump btn btn-sm" type="button" @click="go(target)">
    <AppIcon name="arrow-right" class="arrow" />{{ target
    }}<span v-if="singleWeight" class="jump-weight" :title="singleHint">{{ singleWeight }}</span>
    <span v-if="singleRow?.conditional" class="badge jump-tag" :title="singleHint">
      {{ t("jumpPositionConditional") }}
    </span>
    <span v-if="singleRow?.never" class="badge jump-tag is-never">
      {{ t("jumpPositionNever") }}
    </span>
    <span v-if="jump.dynamicSource" class="option-cond">{{ `  ${jump.dynamicSource}` }}</span>
  </button>
</template>
