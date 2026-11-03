<script setup lang="ts">
import { computed } from "vue";
import { buildBlocks } from "../../lib/beats";
import type { ReaderBlock } from "../../types/beats";
import BattleCard from "./BattleCard.vue";
import BranchBlock from "./BranchBlock.vue";
import ChoiceBlock from "./ChoiceBlock.vue";
import JumpLink from "./JumpLink.vue";
import LoreBlock from "./LoreBlock.vue";
import MetaChips from "./MetaChips.vue";
import SayLine from "./SayLine.vue";
import SceneSwitch from "./SceneSwitch.vue";

const props = defineProps<{ blocks?: ReaderBlock[]; rows?: unknown[] }>();

const items = computed<ReaderBlock[]>(() => (
  props.blocks ? props.blocks : buildBlocks(props.rows || [])
));
</script>

<template>
  <template v-for="(block, index) in items" :key="index">
    <div v-if="block.kind === 'meta'" class="meta-group">
      <MetaChips :chips="block.chips" />
    </div>
    <div v-else-if="block.kind === 'dice'" class="meta-group is-dice">
      <MetaChips :chips="block.chips" />
    </div>
    <ChoiceBlock v-else-if="block.kind === 'choice'" :options="block.options" :dice="block.dice" />
    <div v-else-if="block.kind === 'branches'" class="branch-group">
      <BranchBlock v-for="(branch, position) in block.branches" :key="position" :branch="branch" />
    </div>
    <LoreBlock v-else-if="block.kind === 'lore'" :lines="block.lines" />
    <BattleCard v-else-if="block.kind === 'battle'" :battle="block.battle" />
    <SceneSwitch v-else-if="block.kind === 'scene'" :scene="block.scene" />
    <SayLine v-else-if="block.kind === 'say'" :mode="block.mode" :speaker="block.speaker" :text="block.text" />
    <JumpLink v-else-if="block.kind === 'jump'" :jump="block.jump" />
  </template>
</template>
