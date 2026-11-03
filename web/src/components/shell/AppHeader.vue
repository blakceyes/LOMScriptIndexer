<script setup lang="ts">
import { t } from "../../i18n";
import { railOpen, toggleRail } from "../../state/shell";
import BrandMark from "./BrandMark.vue";
import SearchField from "./SearchField.vue";
import ToolsBar from "./ToolsBar.vue";
import AppIcon from "../ui/AppIcon.vue";
</script>

<template>
  <header class="masthead">
    <button id="railToggle" class="btn btn-icon rail-toggle" :class="{ 'is-on': railOpen }"
            type="button" :aria-expanded="railOpen" aria-controls="chapterRail"
            :title="t('railToggleTitle')" @click="toggleRail">
      <AppIcon name="panel" />
    </button>

    <BrandMark />

    <SearchField />

    <ToolsBar />
  </header>
</template>
