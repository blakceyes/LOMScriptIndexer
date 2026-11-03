<script setup lang="ts">
import { t } from "../../i18n";
import { openLookup } from "../../state/panels";
import type { BattleEvent, BattlePart } from "../../types/beats";
import BattleLines from "./BattleLines.vue";

defineProps<{ event: BattleEvent }>();

const linkable = (part: BattlePart) => !!part.key
  && (part.kind === "flag" || part.kind === "stat" || part.kind === "rel");

const openChip = (part: BattlePart, event: Event) => {
  event.stopPropagation();
  openLookup(part.kind, part.key, event.currentTarget as HTMLElement);
};
</script>

<template>
  <div class="battle-event">
    <div class="meta-chips battle-when">
      <template v-for="(part, index) in event.when.parts" :key="index">
        <span v-if="index && event.when.logic" class="option-cond battle-logic">
          {{ t(event.when.logic === "or" ? "cxOr" : "cxAnd") }}
        </span>
        <button v-if="linkable(part)" class="btn btn-sm meta-action" type="button"
                aria-haspopup="dialog" @click="openChip(part, $event)">
          {{ part.text }}
        </button>
        <span v-else class="chip-stat chip chip-sm">{{ part.text }}</span>
      </template>
    </div>
    <div v-if="event.lines.length" class="battle-lines">
      <BattleLines :lines="event.lines" />
    </div>
  </div>
</template>
