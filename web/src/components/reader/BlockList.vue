<script setup lang="ts">
import type { BranchView, ReaderBlock } from "../../types/beats";
import BattleCard from "./BattleCard.vue";
import BranchBlock from "./BranchBlock.vue";
import ChoiceBlock from "./ChoiceBlock.vue";
import EndingBlock from "./EndingBlock.vue";
import JumpLink from "./JumpLink.vue";
import LoreLines from "./LoreLines.vue";
import MetaChips from "./MetaChips.vue";
import SayLine from "./SayLine.vue";
import SceneSwitch from "./SceneSwitch.vue";
import TimeLine from "./TimeLine.vue";

defineProps<{ blocks: ReaderBlock[] }>();

const branchKey = (branch: BranchView, position: number) =>
  branch.check
    ? `${branch.check.kind}:${branch.check.key}:${branch.check.expectedResult ?? ""}`
    : `pos:${position}`;
</script>

<template>
  <template v-for="(block, index) in blocks" :key="index">
    <div v-if="block.kind === 'meta'" class="meta-group">
      <MetaChips :chips="block.chips" />
    </div>
    <div v-else-if="block.kind === 'dice'" class="meta-group is-dice">
      <MetaChips :chips="block.chips" />
    </div>
    <TimeLine v-else-if="block.kind === 'time'" :rounds="block.rounds" />
    <ChoiceBlock
      v-else-if="block.kind === 'choice'"
      :options="block.options"
      :dice-chips="block.diceChips"
    />
    <div v-else-if="block.kind === 'branches'" class="branch-group">
      <BranchBlock
        v-for="(branch, position) in block.branches"
        :key="branchKey(branch, position)"
        :branch="branch"
      />
    </div>
    <LoreLines v-else-if="block.kind === 'lore'" :lines="block.lines" />
    <BattleCard v-else-if="block.kind === 'battle'" :battle="block.battle" />
    <EndingBlock v-else-if="block.kind === 'ending'" :ending="block.ending" />
    <SceneSwitch v-else-if="block.kind === 'scene'" :view="block.scene" />
    <SayLine
      v-else-if="block.kind === 'say'"
      :mode="block.mode"
      :speaker="block.speaker"
      :text="block.text"
    />
    <JumpLink v-else-if="block.kind === 'jump'" :jump="block.jump" />
  </template>
</template>
