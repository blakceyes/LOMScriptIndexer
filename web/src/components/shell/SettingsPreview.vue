<script setup lang="ts">
import { computed } from "vue";
import { t, typeLabel } from "../../i18n";
import { prefs } from "../../state/prefs";
import AppIcon from "../ui/AppIcon.vue";
import CondExpr from "../reader/CondExpr.vue";

const props = defineProps<{ target: { scope: "group" | "type"; id: string } }>();

const list = computed(() => {
  if (props.target.scope === "type") return [props.target.id];
  return prefs.presets.types
    .filter((type) => type.group === props.target.id)
    .slice(0, 3)
    .map((type) => type.id);
});

const sampleExpr = {
  tag: "compare",
  op: "=",
  left: { tag: "check", kind: "switch", key: "Ch_1_1_001" },
  right: { tag: "const", value: "1" },
} as const;
</script>

<template>
  <div id="settingsPreview" class="preview">
    <template v-for="typeId in list" :key="typeId">
      <div class="preview-head">
        <span class="preview-tag">{{ typeLabel(typeId) }}</span>
      </div>
      <div class="preview-specimen">
        <div v-if="typeId === 'dialog'" class="say">
          <div class="what">{{ t("previewText") }}</div>
        </div>
        <div v-else-if="typeId === 'speaker'" class="say">
          <span class="who is-link">{{ t("previewWho") }}</span>
        </div>
        <div v-else-if="typeId === 'narration'" class="say narration">
          <div class="what">{{ t("previewNarration") }}</div>
        </div>
        <div v-else-if="typeId === 'think'" class="say think">
          <div class="what">{{ t("previewThink") }}</div>
        </div>
        <div v-else-if="typeId === 'lore'" class="lore">
          <div class="lore-text"><p class="lore-p">{{ t("previewLore") }}</p></div>
        </div>
        <div v-else-if="typeId === 'snippet'" class="drop-item">
          <span class="dtext">{{ t("previewSnippet") }}</span>
        </div>
        <p v-else-if="typeId === 'battle'" class="battle-fact">{{ t("previewBattle") }}</p>
        <div v-else-if="typeId === 'battle-cond'" class="meta-chips battle-when">
          <span class="chip-stat chip chip-sm">{{ t("previewBattleCond") }}</span>
        </div>
        <div v-else-if="typeId === 'option'" class="option-head row">
          <span class="option-main"><span class="option-text">{{ t("previewOption") }}</span></span>
        </div>
        <div v-else-if="typeId === 'index'" class="option-head row">
          <span class="option-idx">{{ t("previewIndex") }}</span>
        </div>
        <span v-else-if="typeId === 'option-cond'" class="option-cond">
          {{ t("oCond", { op: "≥", value: "30" }) }}
        </span>
        <div v-else-if="typeId === 'branch-cond'" class="branch">
          <div class="branch-head row">
            <span class="cond"><CondExpr :expr="sampleExpr as never" /></span>
          </div>
        </div>
        <div v-else-if="typeId === 'label'" class="scene-switch">
          <span class="scene-label">{{ t("sceneSwitch") }}</span>
          <span class="scene-name">{{ t("previewLabel") }}</span>
        </div>
        <button v-else-if="typeId === 'jump'" class="jump btn btn-sm" type="button">
          <AppIcon name="arrow-right" class="arrow" />{{ t("previewJump") }}
        </button>
        <span v-else-if="typeId === 'badge'" class="badge">{{ t("previewBadge") }}</span>
        <h2 v-else-if="typeId === 'title'" class="node-title">{{ t("previewNode") }}</h2>
        <h2 v-else-if="typeId === 'panel'" class="panel-title">{{ t("previewHeading") }}</h2>
        <span v-else-if="typeId === 'lookup'" class="panel-title lookup-title">{{ t("lookupSpeaker") }}</span>
        <div v-else-if="typeId === 'brand'" class="brand-text">
          <h1>{{ t("appTitle") }}</h1>
        </div>
        <span v-else-if="typeId === 'seal'" class="seal">{{ t("previewSeal") }}</span>
        <h2 v-else-if="typeId === 'rail'" class="rail-title">{{ t("railTitle") }}</h2>
        <div v-else-if="typeId === 'stat'" class="stat-card">
          <span class="stat-value">{{ t("previewStat") }}</span>
        </div>
        <div v-else-if="typeId === 'empty-title'" class="empty-state">
          <h3>{{ t("noBeatsTitle") }}</h3>
        </div>
        <p v-else-if="typeId === 'crumb'" class="crumb">
          {{ t("previewCrumb") }}<span class="crumb-time">{{ t("previewMeta") }}</span>
        </p>
        <div v-else-if="typeId === 'meta'" class="drop-item">
          <span class="dmeta">{{ t("previewMeta") }}</span>
        </div>
        <p v-else-if="typeId === 'ui'" class="help-desc">{{ t("previewText") }}</p>
        <button v-else-if="typeId === 'ui-compact'" class="btn" type="button">{{ t("previewUi") }}</button>
        <p v-else-if="typeId === 'ui-micro'" class="menu-note">{{ t("previewMicro") }}</p>
        <p v-else-if="typeId === 'caption'" class="sub-label">{{ t("previewCaption") }}</p>
        <div v-else-if="typeId === 'id'" class="drop-item">
          <span class="did">{{ t("previewId") }}</span>
        </div>
        <p v-else-if="typeId === 'status'" class="stats-loading">{{ t("previewStatus") }}</p>
        <span v-else-if="typeId === 'loading'" class="sk-caption">{{ t("previewLoading") }}</span>
        <p v-else class="drop-empty">{{ t("previewText") }}</p>
      </div>
    </template>
  </div>
</template>
