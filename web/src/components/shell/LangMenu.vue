<script setup lang="ts">
import { computed, onMounted } from "vue";
import { languages, t } from "../../i18n";
import { overlay } from "../../lib/overlay";
import { switchLang } from "../../state/shell";
import { store } from "../../state/store";

const items = computed(() => languages());

const open = computed(() => overlay.isOpen("langMenu"));

const pick = (id: string) => {
  overlay.close("langMenu");
  void switchLang(id);
};

onMounted(() => {
  overlay.register("langMenu", {
    id: "langMenu",
    triggerId: "langBtn",
    group: "menu",
    placement: { align: "end", width: 240, fit: true },
  });
});
</script>

<template>
  <div id="langMenu" class="menu surface popover" role="menu" :aria-label="t('moreLang')" :hidden="!open">
    <div class="menu-head">{{ t("moreLang") }}</div>
    <button v-for="item in items" :key="item.id" class="menu-item row" :class="{ 'is-on': item.id === store.state.lang }"
            type="button" role="menuitemradio" :aria-checked="item.id === store.state.lang"
            :lang="item.html" :title="item.label" @click="pick(item.id)">
      {{ item.native }}
    </button>
    <div class="menu-sep"></div>
    <p class="menu-note">{{ t("langPickerNote") }}</p>
  </div>
</template>
