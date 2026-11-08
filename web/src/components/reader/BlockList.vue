<script setup lang="ts">
import { sayKindOf } from "../../lib/beatRows";
import type { ReaderBlock } from "../../types/beats";
import type { Component } from "vue";
import BattleCard from "./BattleCard.vue";
import BranchGroup from "./BranchGroup.vue";
import ChoiceBlock from "./ChoiceBlock.vue";
import EndingBlock from "./EndingBlock.vue";
import JumpLink from "./JumpLink.vue";
import LoreLines from "./LoreLines.vue";
import MetaChips from "./MetaChips.vue";
import SayLine from "./SayLine.vue";
import SceneSwitch from "./SceneSwitch.vue";
import TimeLine from "./TimeLine.vue";
import { useViewStore } from "../../stores/view";

const props = defineProps<{ blocks: ReaderBlock[] }>();

const view = useViewStore();

const components: Record<ReaderBlock["kind"], Component> = {
  say: SayLine,
  time: TimeLine,
  meta: MetaChips,
  dice: MetaChips,
  choice: ChoiceBlock,
  branches: BranchGroup,
  lore: LoreLines,
  battle: BattleCard,
  ending: EndingBlock,
  scene: SceneSwitch,
  jump: JumpLink,
};

const blockProps = (block: ReaderBlock): Record<string, unknown> => {
  switch (block.kind) {
    case "say":
      return { mode: block.mode, speaker: block.speaker, text: block.text };
    case "time":
      return { rounds: block.rounds };
    case "meta":
      return { chips: block.chips };
    case "dice":
      return { chips: block.chips, dice: true };
    case "choice":
      return { options: block.options, diceChips: block.diceChips };
    case "branches":
      return { branches: block.branches };
    case "lore":
      return { lines: block.lines };
    case "battle":
      return { battle: block.battle };
    case "ending":
      return { ending: block.ending };
    case "scene":
      return { view: block.scene };
    case "jump":
      return { jump: block.jump };
  }
};

const visible = computed(() =>
  props.blocks.filter((block) => {
    if (block.kind === "lore") return view.visibleKinds.lore;
    if (block.kind === "say") return view.visibleKinds[sayKindOf(block.mode)];
    return true;
  }),
);
</script>

<template>
  <component
    :is="components[block.kind]"
    v-for="(block, position) in visible"
    :key="`${block.kind}:${position}`"
    v-bind="blockProps(block)"
  />
</template>
