<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from "vue";
import { useHashRoute, writeHash } from "../composables/useHashRoute";
import { useLayout } from "../composables/useLayout";
import { useShortcuts } from "../composables/useShortcuts";
import { graph } from "../data/graph";
import { t } from "../i18n";
import { byId } from "../lib/dom";
import { overlay } from "../lib/overlay";
import { lang } from "../state/lang";
import { hideBranchPreview } from "../state/panels";
import { closeRail, hideRail, railOpen } from "../state/shell";
import { store } from "../state/store";
import { toast } from "../state/toast";
import { UI_IDS } from "../ui/ids";
import ReaderPane from "./reader/ReaderPane.vue";
import AppHeader from "./shell/AppHeader.vue";
import BranchPreview from "./shell/BranchPreview.vue";
import ChangelogPanel from "./shell/ChangelogPanel.vue";
import ChapterRail from "./shell/ChapterRail.vue";
import HelpPanel from "./shell/HelpPanel.vue";
import LookupPanel from "./shell/LookupPanel.vue";
import SettingsDrawer from "./shell/SettingsDrawer.vue";
import StatsPanel from "./shell/StatsPanel.vue";
import ToastLayer from "./shell/ToastLayer.vue";

useLayout();
useShortcuts({
  back: () => store.back(),
  forward: () => store.forward(),
  bookmark: () => {
    const node = store.selected();
    if (!node) return;
    const on = store.toggleBookmark(node.id);
    toast(t(on ? "bookmarkAdded" : "bookmarkRemoved"));
  },
  jump: () => {
    const button = byId(UI_IDS.navBtn) as HTMLButtonElement | null;
    if (button && !button.disabled) button.click();
  },
  help: () => {
    if (overlay.isOpen("help")) overlay.close("help");
    else overlay.open("help", { trigger: byId(UI_IDS.helpBtn) });
  },
  search: () => {
    const input = byId(UI_IDS.search) as HTMLInputElement | null;
    input?.focus();
  },
});

useHashRoute((id) => {
  if (!graph.nodeById.has(id)) {
    toast(t("statusNotFound", { id }));
    return;
  }
  if (store.state.selectedId !== id) store.select(id, { history: false });
});

watch(
  () => store.state.selectedId,
  (id) => {
    if (id) writeHash(id);
    hideBranchPreview();
  },
);

watch(
  () => store.state.lang,
  (id) => {
    document.documentElement.lang = lang.htmlOf(id);
    document.title = t("appTitle");
  },
);

const onDocumentClick = () => {
  hideBranchPreview();
};

onMounted(() => {
  overlay.register("rail", {
    id: "chapterRail",
    triggerId: "railToggle",
    group: "sheet",
    onHide: hideRail,
  });
  document.addEventListener("click", onDocumentClick, true);
  document.documentElement.lang = lang.htmlOf(store.state.lang);
  document.title = t("appTitle");
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick, true);
});
</script>

<template>
  <AppHeader />

  <main id="main">
    <ChapterRail />
    <div id="railScrim" class="scrim" :hidden="!railOpen" @click="closeRail"></div>
    <ReaderPane />
  </main>

  <SettingsDrawer />
  <LookupPanel />
  <BranchPreview />
  <ToastLayer />
  <HelpPanel />
  <StatsPanel />
  <ChangelogPanel />
</template>
