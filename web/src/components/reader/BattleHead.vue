<script setup lang="ts">
import { t } from "../../i18n";
import { openLookup } from "../../state/panels";
import type { BattleView } from "../../types/beats";

const props = defineProps<{ data: BattleView; toggle: boolean }>();

const openSpeaker = (event: Event) => {
  if (!props.data.speaker) return;
  event.stopPropagation();
  event.preventDefault();
  openLookup("speaker", props.data.speaker, event.currentTarget as HTMLElement);
};
</script>

<template>
  <div :class="toggle ? 'branch-head battle-head row row-sm' : 'battle-head'">
    <div class="battle-head-main">
      <div class="battle-head-line">
        <span class="cx-var">
          <span class="cx-type">{{ t(data.kind === "combat" ? "battleDuel" : "battleCampaign") }}</span>
          <span v-if="data.note" class="cx-name">{{ data.note }}</span>
        </span>
      </div>

      <div v-if="data.goals.length" class="battle-head-line">
        <span v-for="(goal, index) in data.goals" :key="`goal-${index}`" class="cx-var">
          <span class="cx-type">{{ t("battleGoalType") }}</span>
          <span class="cx-name">{{ goal }}</span>
        </span>
      </div>

      <div v-if="data.title || data.facts.length" class="battle-head-line">
        <span v-if="data.title" class="cx-var" :class="{ 'is-link': !!data.speaker }"
              :role="data.speaker ? 'button' : undefined" :aria-haspopup="data.speaker ? 'dialog' : undefined"
              :tabindex="data.speaker ? 0 : undefined" :title="data.speaker ? t('lookupSpeaker') : undefined"
              @click="openSpeaker" @keydown.enter.prevent="openSpeaker" @keydown.space.prevent="openSpeaker">
          <span class="cx-type">{{ t("battleOpponentType") }}</span>
          <span class="cx-name">{{ data.title }}</span>
        </span>
        <span v-for="(fact, index) in data.facts" :key="`fact-${index}`" class="battle-fact">{{ fact }}</span>
      </div>
    </div>
  </div>
</template>
