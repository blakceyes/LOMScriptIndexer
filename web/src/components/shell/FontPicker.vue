<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { t } from "../../i18n";
import { byId, normalizeQuery } from "../../lib/dom";
import { overlay } from "../../lib/overlay";
import { fonts } from "../../state/fonts";
import { customFontOpen, prefs } from "../../state/prefs";
import { store } from "../../state/store";
import { toast } from "../../state/toast";
import { UI_IDS } from "../../ui/ids";
import AppIcon from "../ui/AppIcon.vue";

type PickerItem = {
  value: string;
  name: string;
  meta: string;
  family?: string;
};

const search = ref<HTMLInputElement | null>(null);
const query = ref("");
const active = ref(0);

const open = computed(() => overlay.isOpen("fontPicker"));

const target = computed<{ scope: "group" | "type"; id: string }>(() => {
  const value = String(store.state.settingsTarget || "");
  if (value.indexOf("group:") === 0) return { scope: "group", id: value.slice(6) };
  const type = prefs.typeById(value.indexOf("type:") === 0 ? value.slice(5) : value);
  if (!type) return { scope: "type", id: prefs.presets.types[0].id };
  return { scope: "type", id: type.id };
});

const items = computed<PickerItem[]>(() => {
  const list: PickerItem[] = [];
  if (target.value.scope === "group") {
    list.push({ value: "@base", name: t(prefs.labels.followBase), meta: "" });
  } else {
    list.push({ value: "@group", name: t(prefs.labels.followGroup), meta: "" });
  }
  prefs.presets.fonts.forEach((font) => {
    list.push({ value: font.id, name: t(font.label), meta: t("fontPresetMeta") });
  });
  list.push({ value: "__custom__", name: t(prefs.labels.customFont), meta: "" });
  fonts.families().forEach((family) => {
    list.push({ value: family, name: family, meta: t("fontSystemMeta"), family });
  });
  return list;
});

const visible = computed(() => {
  const needle = normalizeQuery(query.value);
  return items.value.filter((item) => !needle || item.name.toLowerCase().indexOf(needle) >= 0);
});

const familyStyle = (family?: string) => (
  family ? { fontFamily: `"${family.replace(/"/g, "")}"` } : undefined
);

const patch = (font: string) => {
  if (target.value.scope === "group") {
    prefs.set({ groups: { [target.value.id]: { font } } });
    return;
  }
  prefs.set({ types: { [target.value.id]: { font } } });
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
  toast(t("fontPicked", { name: item.name }));
};

const close = () => overlay.close("fontPicker");

const move = (step: number) => {
  if (!visible.value.length) return;
  active.value = (active.value + step + visible.value.length) % visible.value.length;
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
    const item = visible.value[active.value];
    if (item) pick(item);
  }
};

watch(open, async (value) => {
  if (!value) return;
  query.value = "";
  active.value = 0;
  void fonts.ensureFamilies();
  await nextTick();
  search.value?.focus();
});

watch(visible, () => {
  if (active.value >= visible.value.length) active.value = 0;
});

watch(active, async () => {
  await nextTick();
  const list = byId(UI_IDS.fontPickerList);
  const row = list ? list.querySelectorAll(".picker-item")[active.value] as HTMLElement | undefined : undefined;
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
      <input id="fontPickerSearch" ref="search" v-model="query" class="input input-sm" type="search"
             autocomplete="off" spellcheck="false" :placeholder="t('fontSearchPlaceholder')"
             :aria-label="t('fontSearchPlaceholder')" @keydown="onKeydown">
    </div>
    <div id="fontPickerList" class="picker-list popover-list">
      <template v-if="visible.length">
        <button v-for="(item, index) in visible" :key="`${item.value}-${index}`" class="picker-item row"
                :class="{ 'is-active': index === active }" type="button" @click="pick(item)">
          <span class="pi-name" :style="familyStyle(item.family)">
            {{ item.name }}
          </span>
          <span v-if="item.meta" class="pi-meta">{{ item.meta }}</span>
        </button>
      </template>
      <div v-else class="picker-empty popover-empty">{{ t("fontNoMatch") }}</div>
    </div>
  </div>
</template>
