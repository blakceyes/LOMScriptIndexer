<script setup lang="ts">
import { openLookup } from "../../state/panels";
import type { ChoiceOption, MetaChip } from "../../types/beats";
import OptionBlock from "./OptionBlock.vue";

defineProps<{ options: ChoiceOption[]; dice: MetaChip[] }>();

const openDice = (chip: MetaChip, event: Event) => {
  if (!chip.target) return;
  event.stopPropagation();
  openLookup(chip.target.kind, chip.target.key, event.currentTarget as HTMLElement, chip.target.method);
};
</script>

<template>
  <div class="choice">
    <template v-for="(chip, index) in dice" :key="`dice-${index}`">
      <button v-if="chip.target" class="btn btn-sm meta-action" type="button" aria-haspopup="dialog"
              :title="chip.title" @click="openDice(chip, $event)">
        {{ chip.text }}
      </button>
      <span v-else class="chip-stat chip chip-sm" :title="chip.title">{{ chip.text }}</span>
    </template>
    <OptionBlock v-for="option in options" :key="option.index" :option="option" :index="option.index" />
  </div>
</template>
