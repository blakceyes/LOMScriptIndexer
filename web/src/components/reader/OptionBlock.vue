<script setup lang="ts">
import { computed, ref } from "vue";
import { buildBlocks } from "../../lib/beats";
import { condtext } from "../../lib/condtext";
import type { ChoiceOption } from "../../types/beats";
import BeatList from "./BeatList.vue";
import RichText from "./RichText.vue";

const props = defineProps<{ option: ChoiceOption; index: number }>();

const open = ref(false);

const head = computed(() => condtext.optionHead(props.option.text, props.option.detail));

const condText = computed(() => condtext.optionCond(props.option.cond));

const needText = computed(() => condtext.needText(props.option.detail));

const blocks = computed(() => buildBlocks(props.option.beats));

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
        <span v-if="option.lock || condText || needText" class="option-badges">
          <span v-if="option.lock" class="option-cond is-danger">{{ `🔒 ${option.lock}` }}</span>
          <span v-if="condText" class="option-cond">{{ condText }}</span>
          <span v-if="needText" class="badge">{{ needText }}</span>
        </span>
      </span>
    </button>
    <div class="option-body">
      <BeatList :blocks="blocks" />
    </div>
  </div>
</template>
