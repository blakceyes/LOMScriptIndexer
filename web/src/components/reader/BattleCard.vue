<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "../../i18n";
import type { BattleView } from "../../types/beats";
import AppIcon from "../ui/AppIcon.vue";
import BattleEvent from "./BattleEvent.vue";
import BattleHead from "./BattleHead.vue";
import JumpLink from "./JumpLink.vue";

const props = defineProps<{ battle: BattleView }>();

const open = ref(false);

const campaign = computed(() => props.battle.kind === "battle");

const staticDuel = computed(() => !campaign.value && props.battle.events.length === 0);

const expandable = computed(() => !campaign.value && !staticDuel.value);

const rootClass = computed(() => {
  if (campaign.value) return "battle battle-campaign";
  if (staticDuel.value) return "battle battle-static";
  return open.value ? "battle is-open" : "battle";
});

const headAttrs = computed(() => (expandable.value
  ? { role: "button", tabindex: 0, "aria-expanded": open.value }
  : {}));

const toggle = () => {
  if (!expandable.value) return;
  open.value = !open.value;
};

const onHeadClick = (event: MouseEvent) => {
  if (!expandable.value) return;
  const target = event.target as HTMLElement | null;
  if (target && target.closest && target.closest("button")) return;
  toggle();
};

const onHeadKey = (event: KeyboardEvent) => {
  if (!expandable.value) return;
  if (event.target !== event.currentTarget) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  toggle();
};
</script>

<template>
  <div :class="rootClass">
    <BattleHead v-bind="headAttrs" :data="battle" :toggle="expandable" @click="onHeadClick" @keydown="onHeadKey" />

    <div v-if="campaign && battle.rows.length" class="battle-campaign-rows">
      <span v-for="(row, index) in battle.rows" :key="index" class="cx-var">
        <span class="cx-type">{{ row.label }}</span>
        <span class="cx-name">{{ row.value }}</span>
      </span>
    </div>

    <div v-if="campaign && battle.events.length" class="battle-campaign-events">
      <BattleEvent v-for="(event, index) in battle.events" :key="index" :event="event" />
    </div>

    <div v-if="expandable" class="battle-body">
      <BattleEvent v-for="(event, index) in battle.events" :key="index" :event="event" />
    </div>

    <div v-if="battle.after" class="scene-switch">
      <span class="scene-label">{{ t("battleAfterStory") }}</span>
      <JumpLink :jump="{ target: battle.after, label: '' }" />
    </div>
    <div v-else-if="battle.next" class="scene-switch">
      <span class="scene-label">{{ t("battleAfter") }}</span>
      <AppIcon name="arrow-right" class="scene-arrow" />
      <span class="scene-next">{{ battle.next }}</span>
    </div>
  </div>
</template>
