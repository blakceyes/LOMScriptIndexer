<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from "vue";
import { t, typeLabel } from "../../i18n";
import { overlay } from "../../lib/overlay";
import { customFontOpen, prefs } from "../../state/prefs";
import { store } from "../../state/store";
import { toast } from "../../state/toast";
import AppIcon from "../ui/AppIcon.vue";
import SettingsPreview from "./SettingsPreview.vue";
import FontPicker from "./FontPicker.vue";

const target = computed<{ scope: "group" | "type"; id: string }>(() => {
  const value = String(store.state.settingsTarget || "");
  if (value.indexOf("group:") === 0) return { scope: "group", id: value.slice(6) };
  const type = prefs.typeById(value.indexOf("type:") === 0 ? value.slice(5) : value);
  if (!type) return { scope: "type", id: prefs.presets.types[0].id };
  return { scope: "type", id: type.id };
});

const snapshot = computed(() => prefs.get());

const entry = computed(() => (
  target.value.scope === "group"
    ? snapshot.value.groups[target.value.id]
    : snapshot.value.types[target.value.id]
));

const computedEntry = computed(() => prefs.computed(target.value.scope, target.value.id));

const typePreset = computed(() => (target.value.scope === "type" ? prefs.typeById(target.value.id) : null));

const group = computed(() => {
  if (target.value.scope === "group") return prefs.groupById(target.value.id);
  const type = prefs.typeById(target.value.id);
  return type ? prefs.groupById(type.group) : prefs.presets.groups[0];
});

const scopeLabel = computed(() => {
  const name = group.value ? t(group.value.label) : "";
  const leaf = target.value.scope === "group" ? t(prefs.labels.groupAll) : typeLabel(target.value.id);
  return name ? `${name} · ${leaf}` : leaf;
});

const fontText = computed(() => t(prefs.describe(store.state.settingsTarget)));

const noLeading = computed(() => !!typePreset.value && !!typePreset.value.noLeading);

const scaleValue = computed(() => entry.value?.scale ?? 100);

const leadingValue = computed(() => entry.value?.leading ?? 100);

const weight = computed(() => entry.value?.weight ?? null);

const customFont = computed(() => {
  const font = entry.value?.font || "";
  const follow = ["", "@base", "@group"];
  const preset = prefs.presets.fonts.some((item) => item.id === font);
  return !!font && follow.indexOf(font) < 0 && !preset;
});

const showCustom = computed(() => customFont.value || customFontOpen.value);

const open = computed(() => overlay.isOpen("settings"));

const setGroup = (id: string) => {
  store.setSettingsTarget(`group:${id}`);
};

const setType = (id: string) => {
  store.setSettingsTarget(`type:${id}`);
};

const patch = (value: { font?: string; scale?: number; leading?: number; weight?: number | null }) => {
  if (target.value.scope === "group") {
    prefs.set({ groups: { [target.value.id]: value } });
    return;
  }
  prefs.set({ types: { [target.value.id]: value } });
};

const openPicker = () => {
  overlay.open("fontPicker", {
    trigger: document.getElementById("typeFontTrigger"),
    keep: ["settings"],
    placement: { align: "start", gap: 6, width: 300, fit: true },
  });
};

const onScale = (event: Event) => {
  patch({ scale: Number((event.target as HTMLInputElement).value) });
};

const onLeading = (event: Event) => {
  patch({ leading: Number((event.target as HTMLInputElement).value) });
};

const onCustom = (event: Event) => {
  patch({ font: (event.target as HTMLInputElement).value });
};

const setWeight = (value: number | null) => {
  patch({ weight: value });
};

const isWeightOn = (value: number | null) => {
  if (value === null) return !!typePreset.value && weight.value === null;
  return weight.value !== null && Number(value) === Number(weight.value);
};

const reset = () => {
  prefs.reset();
  toast(t("toastReset"));
};

const close = () => {
  overlay.close("fontPicker");
  overlay.close("settings");
};

watch(open, async (value) => {
  if (!value) return;
  await nextTick();
  document.getElementById("typeFontTrigger")?.focus();
});

watch(target, () => {
  customFontOpen.value = false;
});

watch(
  () => entry.value?.font,
  (font) => {
    if (font) customFontOpen.value = false;
  },
);

onMounted(() => {
  overlay.register("settings", {
    id: "settingsDrawer",
    triggerId: "settingsBtn",
    group: "sheet",
  });
});
</script>

<template>
  <div id="settingsScrim" class="scrim" :hidden="!open" @click="close"></div>
  <aside id="settingsDrawer" class="drawer surface" aria-modal="true" role="dialog"
           :aria-label="t('settingsTitle')" :hidden="!open">
      <header class="drawer-head">
        <h2 class="drawer-title">{{ t("settingsTitle") }}</h2>
        <button id="settingsClose" class="btn btn-icon" type="button" :title="t('closeTitle')" @click="close">
          <AppIcon name="close" />
        </button>
      </header>

      <div class="drawer-body">
        <section class="field">
          <div class="field-row">
            <h3 class="field-title">{{ t("fontTypes") }}</h3>
            <span id="typeScopeNote" class="field-note">{{ scopeLabel }}</span>
          </div>
          <div id="typeGroups" class="type-groups" role="group" :aria-label="t('fontTypes')">
            <button v-for="item in prefs.presets.groups" :key="item.id" class="type-group"
                    :class="{ 'is-on': !!group && item.id === group.id }" type="button"
                    :aria-pressed="!!group && item.id === group.id" @click="setGroup(item.id)">
              {{ t(item.label) }}
            </button>
          </div>
          <div id="typeChips" class="type-tabs" role="group" :aria-label="t('fontTypes')">
            <template v-if="group">
              <button class="type-tab btn btn-sm" :class="{ 'is-on': target.scope === 'group' }" type="button"
                      :aria-pressed="target.scope === 'group'" @click="setGroup(group.id)">
                {{ t(prefs.labels.groupAll) }}
              </button>
              <button v-for="item in prefs.presets.types.filter((type) => type.group === group?.id)" :key="item.id"
                      class="type-tab btn btn-sm"
                      :class="{ 'is-on': target.scope === 'type' && target.id === item.id }" type="button"
                      :aria-pressed="target.scope === 'type' && target.id === item.id" @click="setType(item.id)">
                {{ typeLabel(item.id) }}
              </button>
            </template>
          </div>

          <div class="type-panel">
            <label class="sub-label">{{ t("typeFont") }}</label>
            <button id="typeFontTrigger" class="btn select font-trigger" type="button" aria-haspopup="listbox"
                    @click="openPicker">
              <span class="ft-name">{{ fontText }}</span>
              <AppIcon name="chevron" class="caret" />
            </button>
            <input id="typeFontCustom" class="input input-sm text-input" type="text" :hidden="!showCustom"
                   :value="showCustom ? entry?.font || '' : ''"
                   :placeholder="t('fontCustomPlaceholder')" @input="onCustom">

            <div class="field-row sub-row">
              <label class="sub-label">{{ t("typeScale") }}</label>
              <output id="typeScaleOut" class="field-value">
                {{ `${scaleValue}% · ${(computedEntry?.px ?? 0).toFixed(2)}px` }}
              </output>
            </div>
            <input id="typeScale" class="range" type="range" min="25" max="300" step="5"
                   :value="scaleValue" :aria-label="t('typeScale')" @input="onScale">

            <div class="field-row sub-row" id="typeLeadingRow" :hidden="noLeading">
              <label class="sub-label">{{ t("lineHeight") }}</label>
              <output id="typeLeadingOut" class="field-value">
                {{ `${leadingValue}% · ${(computedEntry?.lineHeight ?? 0).toFixed(2)}` }}
              </output>
            </div>
            <input id="typeLeading" class="range" type="range" min="50" max="250" step="5"
                   :hidden="noLeading" :value="leadingValue" :aria-label="t('lineHeight')" @input="onLeading">

            <label class="sub-label">{{ t("typeWeight") }}</label>
            <div class="seg seg-wide tabs" id="weightSeg" role="group">
              <button class="seg-btn tab" type="button" data-weight="inherit" data-inherit="true"
                      :hidden="!typePreset" :class="{ 'is-on': isWeightOn(null) }"
                      :aria-pressed="isWeightOn(null)" @click="setWeight(null)">
                {{ t("weightInherit") }}
              </button>
              <button class="seg-btn tab" type="button" data-weight="400" :class="{ 'is-on': isWeightOn(400) }"
                      :aria-pressed="isWeightOn(400)" @click="setWeight(400)">
                {{ t("weightRegular") }}
              </button>
              <button class="seg-btn tab" type="button" data-weight="500" :class="{ 'is-on': isWeightOn(500) }"
                      :aria-pressed="isWeightOn(500)" @click="setWeight(500)">
                {{ t("weightMedium") }}
              </button>
              <button class="seg-btn tab" type="button" data-weight="600" :class="{ 'is-on': isWeightOn(600) }"
                      :aria-pressed="isWeightOn(600)" @click="setWeight(600)">
                {{ t("weightBold") }}
              </button>
            </div>
          </div>
        </section>

        <section class="field">
          <h3 class="field-title">{{ t("previewTitle") }}</h3>
          <SettingsPreview :target="target" />
        </section>
      </div>

      <footer class="drawer-foot">
        <button id="settingsReset" class="btn" type="button" @click="reset">{{ t("resetSettings") }}</button>
        <button id="settingsDone" class="btn" type="button" @click="close">{{ t("done") }}</button>
      </footer>
  </aside>

  <FontPicker />
</template>
