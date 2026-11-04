<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { t } from "../../i18n";
import { byId, toNeedle } from "../../lib/browser";
import { overlay } from "../../lib/overlay";
import { customFontOpen, prefs } from "../../state/prefs";
import { store } from "../../state/store";
import { fonts } from "../../state/systemFonts";
import { toast } from "../../state/toast";
import type { FontTarget } from "../../types/font";
import { UI_IDS } from "../../ui/ids";
import AppIcon from "../ui/AppIcon.vue";

type PickerItem = {
  value: string;
  label: string;
  hint: string;
  family?: string;
};

const searchInput = ref<HTMLInputElement | null>(null);
const query = ref("");
const activeIndex = ref(0);

const open = computed(() => overlay.isOpen("fontPicker"));

const target = computed<FontTarget>(() => {
  const current = store.state.fontTarget;
  if (current.scope === "group") {
    return prefs.groupById(current.id)
      ? current
      : { scope: "group", id: prefs.presets.groups[0].id };
  }
  return prefs.slotById(current.id)
    ? current
    : { scope: "slot", id: prefs.presets.slots[0].id };
});

const pickerItems = computed<PickerItem[]>(() => {
  const list: PickerItem[] = [];
  if (target.value.scope === "group") {
    list.push({ value: "@base", label: t(prefs.labels.followBase), hint: "" });
  } else {
    list.push({ value: "@group", label: t(prefs.labels.followGroup), hint: "" });
  }
  prefs.presets.fonts.forEach((font) => {
    list.push({ value: font.id, label: t(font.label), hint: t("fontPresetMeta") });
  });
  list.push({ value: "__custom__", label: t(prefs.labels.customFont), hint: "" });
  fonts.families().forEach((family) => {
    list.push({ value: family, label: family, hint: t("fontSystemMeta"), family });
  });
  return list;
});

const visibleItems = computed(() => {
  const needle = toNeedle(query.value);
  return pickerItems.value.filter((item) => (
    !needle || item.label.toLowerCase().indexOf(needle) >= 0
  ));
});

const familyStyle = (family?: string) => (
  family ? { fontFamily: `"${family.replace(/"/g, "")}"` } : undefined
);

const patch = (font: string) => {
  if (target.value.scope === "group") {
    prefs.set({ groups: { [target.value.id]: { font } } });
    return;
  }
  prefs.set({ slots: { [target.value.id]: { font } } });
};

const pick = (item: PickerItem) => {
  if (item.value === "__custom__") {
    overlay.close("fontPicker");
    customFontOpen.value = true;
    patch("");
    void nextTick(() => byId(UI_IDS.typeFontCustom)?.focus());
    return;
  }
  patch(item.value);
  overlay.close("fontPicker");
  toast(t("fontPicked", { name: item.label }));
};

const close = () => overlay.close("fontPicker");

const move = (step: number) => {
  if (!visibleItems.value.length) return;
  activeIndex.value = (
    activeIndex.value + step + visibleItems.value.length
  ) % visibleItems.value.length;
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    close();
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    move(1);
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    move(-1);
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    const item = visibleItems.value[activeIndex.value];
    if (item) pick(item);
  }
};

watch(open, async (value) => {
  if (!value) return;
  query.value = "";
  activeIndex.value = 0;
  void fonts.ensureFamilies();
  await nextTick();
  searchInput.value?.focus();
});

watch(visibleItems, () => {
  if (activeIndex.value >= visibleItems.value.length) activeIndex.value = 0;
});

watch(activeIndex, async () => {
  await nextTick();
  const list = byId(UI_IDS.fontPickerList);
  const row = list
    ? list.querySelectorAll(".picker-item")[activeIndex.value] as HTMLElement | undefined
    : undefined;
  if (row && row.scrollIntoView) row.scrollIntoView({ block: "nearest" });
});

onMounted(() => {
  overlay.register("fontPicker", {
    id: "fontPicker",
    group: "menu",
    keep: ["settings"],
    placement: { align: "start", gap: 6, width: 300, fit: true },
  });
});
</script>

<template>
  <div id="fontPicker" class="picker popover surface" role="listbox" :aria-label="t('typeFont')"
       :hidden="!open">
    <div class="picker-search">
      <AppIcon name="search" />
      <input id="fontPickerSearch" ref="searchInput" v-model="query" class="input input-sm"
             type="search" autocomplete="off" spellcheck="false"
             :placeholder="t('fontSearchPlaceholder')"
             :aria-label="t('fontSearchPlaceholder')" @keydown="onKeydown">
    </div>
    <div id="fontPickerList" class="picker-list popover-list">
      <template v-if="visibleItems.length">
        <button v-for="(item, index) in visibleItems" :key="`${item.value}-${index}`"
                class="picker-item row" :class="{ 'is-active': index === activeIndex }"
                type="button" @click="pick(item)">
          <span class="pi-name" :style="familyStyle(item.family)">
            {{ item.label }}
          </span>
          <span v-if="item.hint" class="pi-meta">{{ item.hint }}</span>
        </button>
      </template>
      <div v-else class="picker-empty popover-empty">{{ t("fontNoMatch") }}</div>
    </div>
  </div>
</template>
