<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { text } from "../../data/text";
import { buildBlocks } from "../../lib/beats";
import { clamp } from "../../lib/dom";
import { store } from "../../state/store";
import { focusTick, hideBranchPreview, takePendingHit } from "../../state/ui";
import BeatList from "./BeatList.vue";
import EmptyState from "./EmptyState.vue";
import ReaderSkeleton from "./ReaderSkeleton.vue";

const HIT_SELECTOR = ".say .what, .option-text, .lore-p, .meta-chips .chip, .meta-chips .meta-action";

const body = ref<HTMLElement | null>(null);
const tick = ref(0);
const readingId = ref("");
const needRestore = ref(false);
const scrollMemory = new Map<string, number>();

const node = computed(() => store.selected());

const fraction = (): number => {
  const el = body.value;
  if (!el) return 0;
  const max = el.scrollHeight - el.clientHeight;
  return max > 0 ? clamp(el.scrollTop / max, 0, 1) : 0;
};

const rows = computed(() => {
  void tick.value;
  const current = node.value;
  return current ? text.story(store.textLang(), current.id) : null;
});

const blocks = computed(() => (rows.value ? buildBlocks(rows.value) : null));

const shard = computed(() => {
  void tick.value;
  const current = node.value;
  return current ? text.shardState(store.textLang(), current.id) : "ready";
});

const loading = computed(() => !!node.value && blocks.value === null && shard.value !== "failed");

const failed = computed(() => !!node.value && blocks.value === null && shard.value === "failed");

const busy = computed(() => loading.value);

const hasBeats = computed(() => !!blocks.value && blocks.value.length > 0);

const restoreScroll = () => {
  const el = body.value;
  const current = node.value;
  if (!el || !current) return;
  const remembered = scrollMemory.get(current.id);
  if (remembered !== undefined) {
    el.scrollTop = remembered;
    return;
  }
  const position = store.positionOf(current.id);
  const max = el.scrollHeight - el.clientHeight;
  el.scrollTop = position > 0 && max > 0 ? position * max : 0;
};

const scrollHit = (target: HTMLElement) => {
  const el = body.value;
  if (!el) return;
  const bodyRect = el.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const offset = rect.top - bodyRect.top - Math.max(0, (el.clientHeight - rect.height) / 2);
  el.style.scrollBehavior = "auto";
  el.scrollTop = Math.max(0, el.scrollTop + offset);
  requestAnimationFrame(() => {
    el.style.scrollBehavior = "";
  });
};

const revealHit = (target: HTMLElement) => {
  const el = body.value;
  if (!el) return;
  let current = target.parentElement;
  while (current && current !== el) {
    const foldable = current.classList.contains("option")
      || current.classList.contains("branch")
      || current.classList.contains("battle");
    if (foldable && !current.classList.contains("is-open")) {
      const head = current.firstElementChild as HTMLElement | null;
      if (head) head.click();
    }
    current = current.parentElement;
  }
};

const applyHit = async () => {
  const current = node.value;
  if (!current) return;
  const pending = takePendingHit(current.id);
  if (!pending) return;
  const el = body.value;
  if (!el) return;
  const target = Array.from(el.querySelectorAll<HTMLElement>(HIT_SELECTOR))
    .find((element) => (element.textContent || "").toLowerCase().includes(pending.query));
  if (!target) return;
  revealHit(target);
  await nextTick();
  scrollHit(target);
};

watch(
  () => [store.state.selectedId, store.state.lang] as const,
  async ([id]) => {
    const el = body.value;
    if (el && readingId.value && readingId.value !== id) {
      scrollMemory.set(readingId.value, el.scrollTop);
      store.rememberPosition(readingId.value, fraction());
    }
    readingId.value = id;
    needRestore.value = true;
    const current = store.selected();
    if (!current) return;
    await text.ensureStory(store.textLang(), current.id);
    tick.value++;
  },
  { flush: "pre", immediate: true },
);

watch(blocks, async () => {
  if (!node.value) return;
  await nextTick();
  if (needRestore.value) {
    needRestore.value = false;
    restoreScroll();
  }
  await applyHit();
});

watch(focusTick, async () => {
  await nextTick();
  await applyHit();
});

const onScroll = () => {
  const current = node.value;
  if (current) store.rememberPosition(current.id, fraction());
  hideBranchPreview();
};

const retry = () => {
  tick.value++;
};

defineExpose({ body, fraction });
</script>

<template>
  <div id="readerBody" ref="body" class="reader-body" :aria-busy="busy ? 'true' : 'false'" @scroll.passive="onScroll">
    <EmptyState v-if="!node" empty />
    <ReaderSkeleton v-else-if="loading" />
    <ReaderSkeleton v-else-if="failed" failed @retry="retry" />
    <EmptyState v-else-if="!hasBeats" :empty="false" :flags-empty="!!node.flags.empty" />
    <BeatList v-else :blocks="blocks || []" />
  </div>
</template>
