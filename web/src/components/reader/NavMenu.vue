<script setup lang="ts">
import { computed, onMounted } from "vue";
import { graph } from "../../data/graph";
import { t } from "../../i18n";
import { edgeLabelOf } from "../../lib/blocks";
import { overlay } from "../../lib/overlay";
import { stripRich } from "../../lib/rich";
import { store } from "../../state/store";
import type { GraphEdge } from "../../types/graph";

const open = computed(() => overlay.isOpen("navMenu"));

const node = computed(() => store.selected());

const nodeIndex = computed(() => (node.value ? graph.indexById.get(node.value.id) ?? -1 : -1));

const outgoing = computed(() => {
  if (nodeIndex.value < 0) return [];
  return (graph.outAdj[nodeIndex.value] || []).map((edge) => ({
    edge,
    target: graph.nodeById.get(edge.to) || null,
  })).filter((item) => !!item.target);
});

const incoming = computed(() => {
  if (nodeIndex.value < 0) return [];
  return (graph.inAdj[nodeIndex.value] || []).map((edge) => ({
    edge,
    target: graph.nodeById.get(edge.from) || null,
  })).filter((item) => !!item.target);
});

const labelOf = (edge: GraphEdge) => stripRich(edgeLabelOf(edge)) || "";

const tagOf = (edge: GraphEdge) => {
  if (edge.kind === "temp" || edge.kind === "travel") return t("navTemp");
  if (edge.kind === "position") return t("navPosition");
  return "";
};

const pick = (id: string) => {
  overlay.close("navMenu");
  store.select(id, { history: true });
};

onMounted(() => {
  overlay.register("navMenu", {
    id: "navMenu",
    triggerId: "navBtn",
    group: "menu",
    placement: { align: "end", width: 340, fit: true },
  });
});
</script>

<template>
  <div id="navMenu" class="menu menu-wide surface popover" role="menu" :hidden="!open">
    <div class="menu-list popover-list">
      <div class="menu-head">{{ t("navOut", { n: outgoing.length }) }}</div>
      <template v-if="outgoing.length">
        <button v-for="item in outgoing" :key="`${item.edge.id}-out`" class="nav-item row" type="button"
                role="menuitem" @click="pick(item.target?.id || '')">
          <span class="nav-id">{{ item.target?.id }}</span>
          <span v-if="labelOf(item.edge)" class="nav-label">{{ labelOf(item.edge) }}</span>
          <span v-if="tagOf(item.edge)" class="nav-badge badge">{{ tagOf(item.edge) }}</span>
        </button>
      </template>
      <div v-else class="menu-empty popover-empty">{{ t("navEmpty") }}</div>

      <div class="menu-sep"></div>

      <div class="menu-head">{{ t("navIn", { n: incoming.length }) }}</div>
      <template v-if="incoming.length">
        <button v-for="item in incoming" :key="`${item.edge.id}-in`" class="nav-item row" type="button"
                role="menuitem" @click="pick(item.target?.id || '')">
          <span class="nav-id">{{ item.target?.id }}</span>
          <span v-if="labelOf(item.edge)" class="nav-label">{{ labelOf(item.edge) }}</span>
          <span v-if="tagOf(item.edge)" class="nav-badge badge">{{ tagOf(item.edge) }}</span>
        </button>
      </template>
      <div v-else class="menu-empty popover-empty">{{ t("navEmpty") }}</div>
    </div>
  </div>
</template>
