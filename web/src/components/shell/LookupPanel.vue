<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { checkpoints } from "../../data/checkpoints";
import { graph } from "../../data/graph";
import { names } from "../../data/names";
import { chapterTitle, t } from "../../i18n";
import { firstLineOf, speakerName } from "../../lib/blocks";
import { byId } from "../../lib/dom";
import { overlay } from "../../lib/overlay";
import { hideLookup, lookupState } from "../../state/panels";
import { store } from "../../state/store";
import type { CheckpointModel } from "../../types/cond";
import type { GraphNode } from "../../types/graph";
import { UI_IDS } from "../../ui/ids";
import AppIcon from "../ui/AppIcon.vue";
import CheckModel from "./CheckModel.vue";

const model = ref<CheckpointModel | null>(null);
const loading = ref(false);

const open = computed(() => lookupState.open);

const kind = computed(() => lookupState.kind);

const key = computed(() => lookupState.key);

const method = computed(() => lookupState.method);

const groups = computed(() => (kind.value === "flag" ? graph.flagGroups(key.value) : null));

const items = computed<GraphNode[]>(() => {
  if (!key.value) return [];
  if (kind.value === "flag") {
    const group = graph.flagGroups(key.value);
    return group.writes.concat(group.reads);
  }
  return graph.lookup(kind.value, key.value);
});

const name = computed(() => (
  kind.value === "speaker" ? speakerName(key.value) : names.label(kind.value, key.value)
));

const title = computed(() => t("lookupTitle", { name: name.value, n: items.value.length }));

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
  first: firstLineOf(node),
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

const loadModel = async () => {
  model.value = null;
  if (kind.value !== "check" || !key.value) return;
  loading.value = true;
  await checkpoints.ensure(key.value);
  if (kind.value !== "check" || key.value !== lookupState.key) return;
  loading.value = false;
  model.value = checkpoints.get(key.value, method.value);
};

watch(
  () => lookupState.seq,
  async () => {
    if (!lookupState.open) return;
    await nextTick();
    if (lookupState.pinned) {
      void loadModel();
      return;
    }
    overlay.open("lookup", { trigger: lookupState.trigger });
    positionLookup();
    void loadModel();
  },
);

watch(
  () => lookupState.open,
  (value) => {
    if (value) return;
    if (overlay.isOpen("lookup")) overlay.close("lookup");
    model.value = null;
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
  <div id="lookupPanel" class="lookup surface popover" role="dialog" :aria-label="t('lookupSpeaker')"
       :hidden="!open">
    <header class="lookup-head">
      <span id="lookupTitle" class="overlay-title">{{ title }}</span>
      <button id="lookupClose" class="btn btn-icon btn-sm" type="button" :title="t('closeTitle')" @click="close">
        <AppIcon name="close" />
      </button>
    </header>
    <p id="lookupSub" class="lookup-sub">{{ subText }}</p>
    <div id="lookupList" class="lookup-list popover-list">
      <CheckModel v-if="kind === 'check' && model" :model="model" :method="method" />
      <div v-else-if="kind === 'check' && loading" class="lookup-cond">
        <p class="lookup-cond-title">{{ t("lookupCondTitle") }}</p>
        <div class="lookup-cond-body">
          <p class="lookup-cond-muted">{{ t("lookupCondLoading") }}</p>
        </div>
      </div>

      <p v-if="!items.length" class="lookup-empty popover-empty">{{ t("lookupEmpty") }}</p>

      <template v-else-if="groups">
        <template v-if="groups.writes.length">
          <p class="lookup-group">{{ t("lookupGroupWrites", { n: groups.writes.length }) }}</p>
          <div v-for="node in groups.writes" :key="`w-${node.id}`" class="lookup-item row row-tall"
               @click="pick(node)">
            <div class="li-top">
              <span class="li-id">{{ node.id }}</span>
              <span class="li-ch">{{ chapterTitle(graph.chapterOf(node)) }}</span>
            </div>
            <span v-if="firstLineOf(node)" class="li-text">{{ firstLineOf(node) }}</span>
          </div>
        </template>
        <template v-if="groups.reads.length">
          <p class="lookup-group">{{ t("lookupGroupReads", { n: groups.reads.length }) }}</p>
          <div v-for="node in groups.reads" :key="`r-${node.id}`" class="lookup-item row row-tall"
               @click="pick(node)">
            <div class="li-top">
              <span class="li-id">{{ node.id }}</span>
              <span class="li-ch">{{ chapterTitle(graph.chapterOf(node)) }}</span>
            </div>
            <span v-if="firstLineOf(node)" class="li-text">{{ firstLineOf(node) }}</span>
          </div>
        </template>
        <p v-else class="lookup-group-note">{{ t("lookupGroupReadsEmpty") }}</p>
      </template>

      <template v-else>
        <div v-for="item in items" :key="item.id" class="lookup-item row row-tall" @click="pick(item)">
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
