<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useGrip } from "../../composables/useGrip";
import { t } from "../../i18n";
import { prefs } from "../../state/prefs";
import { store } from "../../state/store";
import ReaderBody from "./ReaderBody.vue";
import ReaderHeader from "./ReaderHeader.vue";

const reader = ref<HTMLElement | null>(null);
const stage = ref<HTMLElement | null>(null);
const rail = ref<HTMLElement | null>(null);

const grip = useGrip(reader, stage, rail);

const open = computed(() => !!store.selected());

const onGripDown = (edge: "left" | "right", event: PointerEvent) => {
  grip.start(edge, event);
};

const onGripKey = (event: KeyboardEvent) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  grip.nudge(event.key === "ArrowRight" ? 20 : -20);
};

onMounted(() => {
  stage.value = document.getElementById("main");
  rail.value = document.getElementById("chapterRail");
  grip.paint(prefs.get().measure);
});
</script>

<template>
  <section id="reader" ref="reader" :class="{ 'is-open': open }" aria-live="polite">
    <ReaderHeader />
    <ReaderBody />
    <div class="reader-grip" data-edge="left" role="separator" aria-orientation="vertical" tabindex="0"
         :title="t('gripTitle')" @pointerdown="onGripDown('left', $event)"
         @dblclick="grip.reset()" @keydown="onGripKey"></div>
    <div class="reader-grip" data-edge="right" role="separator" aria-orientation="vertical" tabindex="0"
         :title="t('gripTitle')" @pointerdown="onGripDown('right', $event)"
         @dblclick="grip.reset()" @keydown="onGripKey"></div>
  </section>
</template>
