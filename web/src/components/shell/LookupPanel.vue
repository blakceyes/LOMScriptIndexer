<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { checkpoints } from "../../data/checkpoints";
import { graph } from "../../data/graph";
import { names } from "../../data/names";
import { chapterTitle, t } from "../../i18n";
import { firstSayTextOf, speakerName } from "../../lib/blocks";
import { byId } from "../../lib/browser";
import { overlay } from "../../lib/overlay";
import { hideLookup, lookupState } from "../../state/panels";
import { store } from "../../state/store";
import type { CheckpointModel } from "../../types/condition";
import type { GraphNode } from "../../types/graph";
import { UI_IDS } from "../../ui/ids";
import AppIcon from "../ui/AppIcon.vue";
import CheckpointBranches from "./CheckpointBranches.vue";

const checkpoint = ref<CheckpointModel | null>(null);
const loading = ref(false);

const open = computed(() => lookupState.open);

const kind = computed(() => lookupState.kind);

const key = computed(() => lookupState.key);

const method = computed(() => lookupState.method);

const flagNodeGroups = computed(() => (
  kind.value === "flag" ? graph.flagUsage(key.value) : null
));

const matchedNodes = computed<GraphNode[]>(() => {
  if (!key.value) return [];
  if (kind.value === "flag") {
    const usage = graph.flagUsage(key.value);
    return usage.writers.concat(usage.checkers);
  }
  return graph.nodesWithFacet(kind.value, key.value);
});

const displayName = computed(() => (
  kind.value === "speaker" ? speakerName(key.value) : names.label(kind.value, key.value)
));

const title = computed(() => t("lookupTitle", {
  name: displayName.value,
  n: matchedNodes.value.length,
}));

const lookupTitleKey = computed(() => (
  kind.value === "speaker" ? "lookupSpeaker"
    : kind.value === "flag" ? "lookupFlag"
      : kind.value === "check" ? "lookupCheck"
        : kind.value === "rel" ? "lookupRel" : "lookupStat"
));

const subText = computed(() => t(lookupTitleKey.value));

const rowOf = (node: GraphNode) => ({
  node,
  chapter: chapterTitle(graph.chapterOf(node)),
  first: firstSayTextOf(node),
});

const close = () => {
  hideLookup();
  overlay.close("lookup");
};

const pick = (node: GraphNode) => {
  close();
  store.select(node.id, { history: true });
};

const positionLookup = () => {
  const panel = byId(UI_IDS.lookupPanel);
  if (!panel || !lookupState.trigger) return;
  if (store.state.layout === "mobile") {
    panel.style.left = "";
    panel.style.top = "";
    panel.style.position = "";
    return;
  }
  overlay.place(panel, lookupState.trigger, { align: "start", width: 380, fit: true });
};

const loadCheckpoint = async () => {
  checkpoint.value = null;
  if (kind.value !== "check" || !key.value) return;
  loading.value = true;
  await checkpoints.ensure(key.value);
  if (kind.value !== "check" || key.value !== lookupState.key) return;
  loading.value = false;
  checkpoint.value = checkpoints.getByKey(key.value, method.value);
};

watch(
  () => lookupState.requestSeq,
  async () => {
    if (!lookupState.open) return;
    await nextTick();
    if (lookupState.pinned) {
      void loadCheckpoint();
      return;
    }
    overlay.open("lookup", { trigger: lookupState.trigger });
    positionLookup();
    void loadCheckpoint();
  },
);

watch(
  () => lookupState.open,
  (value) => {
    if (value) return;
    if (overlay.isOpen("lookup")) overlay.close("lookup");
    checkpoint.value = null;
  },
);

onMounted(() => {
  overlay.register("lookup", {
    id: "lookupPanel",
    group: "pop",
    placement: { align: "start", width: 380, fit: true },
    onHide: () => {
      hideLookup();
    },
  });
});
</script>

<template>
  <div id="lookupPanel" class="lookup surface popover" role="dialog"
       :aria-label="t('lookupSpeaker')" :hidden="!open">
    <header class="lookup-head">
      <span id="lookupTitle" class="overlay-title">{{ title }}</span>
      <button id="lookupClose" class="btn btn-icon btn-sm" type="button"
              :title="t('closeTitle')" @click="close">
        <AppIcon name="close" />
      </button>
    </header>
    <p id="lookupSub" class="lookup-sub">{{ subText }}</p>
    <div id="lookupList" class="lookup-list popover-list">
      <CheckpointBranches v-if="kind === 'check' && checkpoint"
                          :checkpoint="checkpoint" :method="method" />
      <div v-else-if="kind === 'check' && loading" class="lookup-cond">
        <p class="lookup-cond-title">{{ t("lookupCondTitle") }}</p>
        <div class="lookup-cond-body">
          <p class="lookup-cond-muted">{{ t("lookupCondLoading") }}</p>
        </div>
      </div>

      <p v-if="!matchedNodes.length" class="lookup-empty popover-empty">
        {{ t("lookupEmpty") }}
      </p>

      <template v-else-if="flagNodeGroups">
        <template v-if="flagNodeGroups.writers.length">
          <p class="lookup-group">
            {{ t("lookupGroupWrites", { n: flagNodeGroups.writers.length }) }}
          </p>
          <div v-for="node in flagNodeGroups.writers" :key="`w-${node.id}`"
               class="lookup-item row row-tall" @click="pick(node)">
            <div class="li-top">
              <span class="li-id">{{ node.id }}</span>
              <span class="li-ch">{{ chapterTitle(graph.chapterOf(node)) }}</span>
            </div>
            <span v-if="firstSayTextOf(node)" class="li-text">{{ firstSayTextOf(node) }}</span>
          </div>
        </template>
        <template v-if="flagNodeGroups.checkers.length">
          <p class="lookup-group">
            {{ t("lookupGroupReads", { n: flagNodeGroups.checkers.length }) }}
          </p>
          <div v-for="node in flagNodeGroups.checkers" :key="`r-${node.id}`"
               class="lookup-item row row-tall" @click="pick(node)">
            <div class="li-top">
              <span class="li-id">{{ node.id }}</span>
              <span class="li-ch">{{ chapterTitle(graph.chapterOf(node)) }}</span>
            </div>
            <span v-if="firstSayTextOf(node)" class="li-text">{{ firstSayTextOf(node) }}</span>
          </div>
        </template>
        <p v-else class="lookup-group-note">{{ t("lookupGroupReadsEmpty") }}</p>
      </template>

      <template v-else>
        <div v-for="item in matchedNodes" :key="item.id" class="lookup-item row row-tall"
             @click="pick(item)">
          <div class="li-top">
            <span class="li-id">{{ item.id }}</span>
            <span class="li-ch">{{ rowOf(item).chapter }}</span>
          </div>
          <span v-if="rowOf(item).first" class="li-text">{{ rowOf(item).first }}</span>
        </div>
      </template>
    </div>
    <p class="lookup-hint">{{ t("lookupHint") }}</p>
  </div>
</template>
