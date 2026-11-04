<script setup lang="ts">
import { computed, ref } from "vue";
import { buildReaderBlocks } from "../../lib/blocks";
import { optionCondText, optionHeadText, optionRequirementsText } from "../../lib/conditions";
import type { ChoiceOption } from "../../types/beats";
import BlockList from "./BlockList.vue";
import SizeScaledText from "./SizeScaledText.vue";

const props = defineProps<{ option: ChoiceOption; index: number }>();

const open = ref(false);

const head = computed(() => optionHeadText(props.option.text, props.option.action));

const condition = computed(() => optionCondText(props.option.requirement));

const requirementLabel = computed(() => optionRequirementsText(props.option.action));

const blocks = computed(() => buildReaderBlocks(props.option.beats));

const toggle = () => {
  open.value = !open.value;
};
</script>

<template>
  <div class="option" :class="{ 'is-open': open }">
    <button class="option-head row" type="button" :aria-expanded="open" @click="toggle">
      <span class="option-idx">{{ index + 1 }}</span>
      <span class="option-main">
        <span class="option-text"><SizeScaledText :rich-text="head" /></span>
        <span v-if="option.lockedText || condition || requirementLabel" class="option-badges">
          <span v-if="option.lockedText" class="option-cond is-danger">
            {{ `🔒 ${option.lockedText}` }}
          </span>
          <span v-if="condition" class="option-cond">{{ condition }}</span>
          <span v-if="requirementLabel" class="badge">{{ requirementLabel }}</span>
        </span>
      </span>
    </button>
    <div class="option-body">
      <BlockList :blocks="blocks" />
    </div>
  </div>
</template>
