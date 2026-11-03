<script setup lang="ts">
import { computed, onMounted } from "vue";
import { graph } from "../../data/graph";
import { chapterTitle, t } from "../../i18n";
import { edgeLabelOf } from "../../lib/blocks";
import { byId } from "../../lib/dom";
import { overlay } from "../../lib/overlay";
import { stripRich } from "../../lib/rich";
import { store } from "../../state/store";
import { UI_IDS } from "../../ui/ids";

const open = computed(() => overlay.isOpen("moreMenu"));

const node = computed(() => store.selected());

const targets = computed(() => {
  const current = node.value;
  if (!current) return [];
  return graph.nextTargets(current).slice(0, 6).map((item) => {
    const label = stripRich(edgeLabelOf(item.edge)) || chapterTitle(graph.chapterOf(item.node));
    return { id: item.node.id, label };
  });
});

const openStats = () => {
  overlay.close("moreMenu");
  overlay.open("stats", { trigger: byId(UI_IDS.statsBtn) });
};

const openHelp = () => {
  overlay.close("moreMenu");
  if (overlay.isOpen("help")) overlay.close("help");
  else overlay.open("help", { trigger: byId(UI_IDS.helpBtn) });
};

const openChangelog = () => {
  overlay.close("moreMenu");
  overlay.open("changelog", { trigger: byId(UI_IDS.changelogBtn) });
};

const pick = (id: string) => {
  overlay.close("moreMenu");
  store.select(id, { history: true });
};

onMounted(() => {
  overlay.register("moreMenu", {
    id: "moreMenu",
    triggerId: UI_IDS.moreBtn,
    group: "menu",
    placement: { align: "end", width: 268, fit: true },
  });
});
</script>

<template>
  <div id="moreMenu" class="menu surface popover" role="menu" :hidden="!open">
    <button class="menu-item row" type="button" @click="openStats">{{ t("statsBtn") }}</button>
    <button class="menu-item row" type="button" @click="openHelp">{{ t("helpTitle") }}</button>
    <button class="menu-item row" type="button" @click="openChangelog">{{ t("changelogTitle") }}</button>
    <template v-if="targets.length">
      <div class="menu-sep"></div>
      <div class="menu-head">{{ t("recentChoices") }}</div>
      <button v-for="item in targets" :key="item.id" class="nav-item row" type="button"
              role="menuitem" @click="pick(item.id)">
        <span class="nav-id">{{ item.id }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </button>
    </template>
  </div>
</template>
