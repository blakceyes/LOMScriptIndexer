<script setup lang="ts">
import { computed } from "vue";
import { langShort, t } from "../../i18n";
import { overlay } from "../../lib/overlay";
import { exportAllScripts, exportRunning } from "../../lib/scriptExport";
import { store } from "../../state/store";
import AppIcon from "../ui/AppIcon.vue";
import LangMenu from "./LangMenu.vue";
import MoreMenu from "./MoreMenu.vue";

const langOpen = computed(() => overlay.isOpen("langMenu"));
const moreOpen = computed(() => overlay.isOpen("moreMenu"));
const statsOpen = computed(() => overlay.isOpen("stats"));
const helpOpen = computed(() => overlay.isOpen("help"));
const changelogOpen = computed(() => overlay.isOpen("changelog"));
const settingsOpen = computed(() => overlay.isOpen("settings"));

const langLabel = computed(() => langShort(store.state.lang));

const toggle = (key: "langMenu" | "stats" | "help" | "changelog" | "settings" | "moreMenu") => {
  if (overlay.isOpen(key)) overlay.close(key);
  else overlay.open(key);
};

const runExport = () => {
  if (exportRunning.value) return;
  void exportAllScripts();
};
</script>

<template>
  <div class="tools">
    <div class="menu-wrap">
      <button id="langBtn" class="btn lang-btn" :class="{ 'is-on': langOpen }" type="button"
              aria-haspopup="true" :aria-expanded="langOpen" aria-controls="langMenu"
              :title="t('langBtnTitle')" :aria-label="t('langBtnTitle')" @click.stop="toggle('langMenu')">
        <AppIcon name="lang" class="ico" />
        <span class="btn-label">{{ langLabel }}</span>
      </button>
      <LangMenu />
    </div>

    <button id="statsBtn" class="btn btn-icon" :class="{ 'is-on': statsOpen }" type="button"
            aria-haspopup="dialog" :aria-expanded="statsOpen" aria-controls="statsPanel"
            :title="t('statsBtnTitle')" :aria-label="t('statsBtnTitle')" @click="toggle('stats')">
      <AppIcon name="stats" />
    </button>

    <button id="helpBtn" class="btn btn-icon" type="button"
            aria-haspopup="dialog" :aria-expanded="helpOpen" aria-controls="helpPanel"
            :title="t('helpTitle')" :aria-label="t('helpTitle')" @click="toggle('help')">
      <AppIcon name="help" />
    </button>

    <button id="changelogBtn" class="btn btn-icon" :class="{ 'is-on': changelogOpen }" type="button"
            aria-haspopup="dialog" :aria-expanded="changelogOpen" aria-controls="changelogPanel"
            :title="t('changelogBtnTitle')" :aria-label="t('changelogBtnTitle')" @click="toggle('changelog')">
      <AppIcon name="log" />
    </button>

    <a id="githubBtn" class="btn btn-icon" href="https://github.com/zhu-rengong/LOMScriptIndexer"
       target="_blank" rel="noopener noreferrer" aria-label="GitHub" :title="t('githubBtnTitle')">
      <AppIcon name="github" />
    </a>

    <button id="settingsBtn" class="btn btn-icon" type="button"
            aria-haspopup="dialog" :aria-expanded="settingsOpen" aria-controls="settingsDrawer"
            :title="t('settingsBtnTitle')" :aria-label="t('settingsBtnTitle')" @click="toggle('settings')">
      <AppIcon name="gear" />
    </button>

    <button id="exportBtn" class="btn btn-icon" type="button" :disabled="exportRunning"
            :title="t('exportScriptsTitle')" :aria-label="t('exportScripts')" @click="runExport">
      <AppIcon name="download" />
    </button>

    <div class="menu-wrap more-wrap">
      <button id="moreBtn" class="btn btn-icon" :class="{ 'is-on': moreOpen }" type="button"
              aria-haspopup="true" :aria-expanded="moreOpen" aria-controls="moreMenu"
              :title="t('moreTitle')" :aria-label="t('moreTitle')" @click.stop="toggle('moreMenu')">
        <AppIcon name="more" />
      </button>
      <MoreMenu />
    </div>
  </div>
</template>
