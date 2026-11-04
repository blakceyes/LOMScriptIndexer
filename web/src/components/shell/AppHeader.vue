<script setup lang="ts">
import { t } from "../../i18n";
import { isRailOpen, toggleRail } from "../../state/shell";
import AppIcon from "../ui/AppIcon.vue";
import BrandMark from "./BrandMark.vue";
import SearchBox from "./SearchBox.vue";
import ToolsBar from "./ToolsBar.vue";
</script>

<template>
  <header class="masthead">
    <button id="railToggle" class="btn btn-icon rail-toggle" :class="{ 'is-on': isRailOpen }"
            type="button" :aria-expanded="isRailOpen" aria-controls="chapterRail"
            :title="t('railToggleTitle')" :aria-label="t('railToggleTitle')" @click="toggleRail">
      <AppIcon name="panel" />
    </button>

    <BrandMark />

    <SearchBox />

    <ToolsBar />
  </header>
</template>
