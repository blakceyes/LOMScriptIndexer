<script setup lang="ts">
import { computed, ref } from "vue";
import { chapterTitle, t } from "../../i18n";
import type { SearchHit } from "../../lib/search";

const SCROLL_GAP = 96;

const props = defineProps<{
  hits: SearchHit[];
  rendered: number;
  outside: number;
  query: string;
  status: { count: string; note: string; outside: string; message: string };
  hidden: boolean;
  scoped: boolean;
}>();

const emit = defineEmits<{
  (event: "pick", hit: SearchHit): void;
  (event: "more"): void;
  (event: "clear-filter"): void;
}>();

const box = ref<HTMLElement | null>(null);

const visible = computed(() => props.hits.slice(0, props.rendered));

const tooShort = computed(() => props.query.length < 2);

const snippet = (hit: SearchHit) => {
  const needle = props.query.toLowerCase();
  const lower = hit.snippet.toLowerCase();
  const position = needle ? lower.indexOf(needle) : -1;
  if (position < 0 || !needle) return null;
  return {
    head: hit.snippet.slice(0, position),
    mark: hit.snippet.slice(position, position + needle.length),
    tail: hit.snippet.slice(position + needle.length),
  };
};

const onScroll = () => {
  const node = box.value;
  if (!node) return;
  if (node.scrollTop + node.clientHeight >= node.scrollHeight - SCROLL_GAP) emit("more");
};
</script>

<template>
  <div id="searchResults" ref="box" class="dropdown surface popover" role="listbox" :hidden="hidden"
       @scroll="onScroll">
    <template v-if="!tooShort">
      <div class="drop-scope">
        <span>{{ status.count }}</span>
        <span :hidden="!status.note">{{ status.note }}</span>
        <button v-if="scoped" class="btn-link" type="button" @click="emit('clear-filter')">
          {{ t("searchClearFilters") }}
        </button>
      </div>
      <div class="drop-empty popover-empty" :hidden="outside <= 0">
        <button class="drop-more btn-link" type="button" @click="emit('clear-filter')">
          {{ status.outside }}
        </button>
      </div>
      <div class="drop-empty popover-empty" :hidden="!status.message">{{ status.message }}</div>
      <div v-for="(hit, position) in visible" :key="hit.id" class="drop-item row row-tall"
           :class="{ 'is-active': position === 0 }" :data-id="hit.id" @click="emit('pick', hit)">
        <span class="did">{{ hit.id }}</span>
        <span class="dmeta">{{ hit.chapter ? chapterTitle(hit.chapter) : "" }}</span>
        <span v-if="hit.snippet" class="dtext">
          <template v-if="snippet(hit)">
            {{ snippet(hit)?.head }}<mark>{{ snippet(hit)?.mark }}</mark>{{ snippet(hit)?.tail }}
          </template>
          <template v-else>{{ hit.snippet }}</template>
        </span>
      </div>
    </template>
    <div v-else class="drop-empty popover-empty">{{ status.message }}</div>
  </div>
</template>
