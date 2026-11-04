<script setup lang="ts">
import { computed, ref } from "vue";
import { buildReaderBlocks } from "../../lib/blocks";
import { detailRequirementsText, optionHeadText, requirementText } from "../../lib/conditions";
import type { ChoiceOption } from "../../types/beats";
import BlockList from "./BlockList.vue";
import RichText from "./RichText.vue";

const props = defineProps<{ option: ChoiceOption; index: number }>();

const open = ref(false);

const head = computed(() => optionHeadText(props.option.text, props.option.detail));

const requirement = computed(() => requirementText(props.option.requirement));

const detailRequirements = computed(() => detailRequirementsText(props.option.detail));

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
        <span class="option-text"><RichText :text="head" /></span>
        <span v-if="option.lockedText || requirement || detailRequirements" class="option-badges">
          <span v-if="option.lockedText" class="option-cond is-danger">
            {{ `🔒 ${option.lockedText}` }}
          </span>
          <span v-if="requirement" class="option-cond">{{ requirement }}</span>
          <span v-if="detailRequirements" class="badge">{{ detailRequirements }}</span>
        </span>
      </span>
    </button>
    <div class="option-body">
      <BlockList :blocks="blocks" />
    </div>
  </div>
</template>
