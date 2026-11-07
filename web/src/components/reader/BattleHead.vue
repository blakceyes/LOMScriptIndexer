<script setup lang="ts">
import { t } from "../../i18n";
import type { BattleView } from "../../types/beats";
import { usePanelsStore } from "../../stores/panels";

const panels = usePanelsStore();

const props = defineProps<{ battle: BattleView; expandable: boolean }>();

const openSpeaker = (event: Event) => {
  if (!props.battle.speaker) return;
  event.stopPropagation();
  event.preventDefault();
  panels.openLookup("speaker", props.battle.speaker, event.currentTarget as HTMLElement);
};
</script>

<template>
  <div :class="expandable ? 'branch-head battle-head row row-sm' : 'battle-head'">
    <div class="battle-head-main">
      <div class="battle-head-line">
        <span class="cx-var">
          <span class="cx-type">
            {{ t(battle.kind === "combat" ? "battleDuel" : "battleCampaign") }}
          </span>
          <span v-if="battle.note" class="cx-name">{{ battle.note }}</span>
        </span>
      </div>

      <div v-if="battle.goals.length" class="battle-head-line">
        <span v-for="(goal, index) in battle.goals" :key="`goal-${index}`" class="cx-var">
          <span class="cx-type">{{ t("battleGoalType") }}</span>
          <span class="cx-name">{{ goal }}</span>
        </span>
      </div>

      <div v-if="battle.title || battle.facts.length" class="battle-head-line">
        <span
          v-if="battle.title"
          class="cx-var"
          :class="{ 'is-link': !!battle.speaker }"
          :role="battle.speaker ? 'button' : undefined"
          :aria-haspopup="battle.speaker ? 'dialog' : undefined"
          :tabindex="battle.speaker ? 0 : undefined"
          :title="battle.speaker ? t('lookupSpeaker') : undefined"
          @click="openSpeaker"
          @keydown.enter.prevent="openSpeaker"
          @keydown.space.prevent="openSpeaker"
        >
          <span class="cx-type">{{ t("battleOpponentType") }}</span>
          <span class="cx-name">{{ battle.title }}</span>
        </span>
        <span v-for="(fact, index) in battle.facts" :key="`fact-${index}`" class="battle-fact">{{
          fact
        }}</span>
      </div>
    </div>
  </div>
</template>
