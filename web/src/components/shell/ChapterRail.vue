<script setup lang="ts">
import { computed, ref } from "vue";
import { graph } from "../../data/graph";
import { chapterTitle, t } from "../../i18n";
import { normalizeQuery } from "../../lib/dom";
import { closeRail } from "../../state/shell";
import { store } from "../../state/store";
import { bookmarks, bookmarkTick, clearBookmarks, toggleBookmark } from "../../state/storage";
import { toast } from "../../state/toast";
import type { GraphNode } from "../../types/graph";
import AppIcon from "../ui/AppIcon.vue";

const ENTRY_KEYS: Record<string, string> = { combat: "entryCombat", free: "entryFree" };
const RAIL_TABS = ["outline", "bookmarks"];

const query = ref("");

const bookmarkIds = computed(() => {
  void bookmarkTick.value;
  return Array.from(bookmarks);
});

const openChapter = computed(() => {
  const explicit = store.state.outlineChapter;
  if (explicit !== undefined) return explicit;
  const node = store.selected();
  return node ? node.chapter : -1;
});

const chapters = computed(() => {
  const needle = normalizeQuery(query.value);
  const byChapter = graph.nodesByChapter();
  const rows: { index: number; chapter: (typeof graph.chapters)[number]; members: GraphNode[]; open: boolean }[] = [];
  graph.chapters.forEach((chapter, index) => {
    let members = byChapter[index] || [];
    if (needle) {
      const title = chapterTitle(chapter).toLowerCase();
      if (title.indexOf(needle) < 0 && chapter.id.toLowerCase().indexOf(needle) < 0) {
        members = members.filter((node) => node.id.toLowerCase().indexOf(needle) >= 0);
      }
      if (!members.length) return;
    }
    rows.push({ index, chapter, members, open: index === openChapter.value });
  });
  return rows;
});

const memberLimit = computed(() => (query.value.trim() ? 200 : Infinity));

const setTab = (tab: string) => {
  if (RAIL_TABS.indexOf(tab) < 0 || tab === store.state.railTab) return;
  query.value = "";
  store.setRailTab(tab);
};

const toggleChapter = (index: number) => {
  store.setOutlineChapter(store.state.outlineChapter === index ? -1 : index);
};

const pick = (id: string) => {
  store.select(id, { history: true });
};

const removeBookmark = (id: string) => {
  const on = store.toggleBookmark(id);
  toast(t(on ? "bookmarkAdded" : "bookmarkRemoved"));
};

const clearAll = () => {
  store.clearBookmarks();
  toast(t("bookmarkCleared"));
};

const entryKey = (node: GraphNode) => (node.entry && ENTRY_KEYS[node.entry] ? ENTRY_KEYS[node.entry] : "");

const metaOf = (id: string) => {
  const node = graph.nodeById.get(id);
  return node ? chapterTitle(graph.chapterOf(node)) : "";
};

const entryMark = (id: string) => {
  const node = graph.nodeById.get(id);
  return node ? entryKey(node) : "";
};

</script>

<template>
  <aside id="chapterRail" :aria-label="t('railTitle')">
    <div class="rail-head">
      <h2 class="rail-title">{{ t("railTitle") }}</h2>
      <button id="railClose" class="btn btn-icon rail-close" type="button" :title="t('closeTitle')"
              @click="closeRail">
        <AppIcon name="close" />
      </button>
    </div>
    <div class="rail-tabs tabs" role="tablist" :aria-label="t('railTabsLabel')">
      <button class="rail-tab tab" :class="{ 'is-on': store.state.railTab === 'outline' }"
              data-rail="outline" role="tab" :aria-selected="store.state.railTab === 'outline'"
              type="button" @click="setTab('outline')">
        {{ t("railTabOutline") }}
      </button>
      <button class="rail-tab tab" :class="{ 'is-on': store.state.railTab === 'bookmarks' }"
              data-rail="bookmarks" role="tab" :aria-selected="store.state.railTab === 'bookmarks'"
              type="button" @click="setTab('bookmarks')">
        {{ t("railTabBookmarks") }}
      </button>
    </div>
    <div id="railSearchBox" class="rail-search" :hidden="store.state.railTab === 'bookmarks'">
      <AppIcon name="search" />
      <input id="railSearch" v-model="query" class="search-input" type="search" autocomplete="off"
             spellcheck="false" :placeholder="t('railSearchPlaceholder')"
             :aria-label="t('railSearchPlaceholder')">
    </div>

    <div id="chapterList" class="rail-list">
      <template v-if="store.state.railTab === 'bookmarks'">
        <template v-if="!bookmarkIds.length">
          <p class="rail-empty">{{ t("bookmarkEmpty") }}</p>
        </template>
        <template v-else>
          <p class="rail-group">{{ `${t("railTabBookmarks")} · ${bookmarkIds.length}` }}</p>
          <div v-for="id in bookmarkIds" :key="id" class="rail-item row row-tall"
               :class="{ 'is-on': store.state.selectedId === id }" :data-id="id" role="option"
               :aria-selected="store.state.selectedId === id" tabindex="0"
               @click="pick(id)" @keydown.enter.prevent="pick(id)" @keydown.space.prevent="pick(id)">
            <span class="ri-id">{{ id }}</span>
            <span v-if="entryMark(id)" :class="`ri-entry is-${graph.nodeById.get(id)?.entry}`" :title="t(entryMark(id))"></span>
            <span v-if="graph.nodeById.has(id)" class="ri-meta">{{ metaOf(id) }}</span>
            <button class="ri-del btn btn-icon btn-sm" type="button" :title="t('bookmarkRemove')"
                    @click.stop="removeBookmark(id)">
              <AppIcon name="close" />
            </button>
          </div>
          <button class="link-btn btn-link" type="button" @click="clearAll">{{ t("bookmarkClear") }}</button>
        </template>
      </template>

      <template v-else>
        <template v-for="row in chapters" :key="row.chapter.id">
          <div class="rail-item rail-chap row row-tall" :class="{ 'is-open': row.open }" role="button"
               tabindex="0" @click="toggleChapter(row.index)"
               @keydown.enter.prevent="toggleChapter(row.index)"
               @keydown.space.prevent="toggleChapter(row.index)">
            <span class="ri-id">{{ chapterTitle(row.chapter) }}</span>
            <span class="ri-meta">{{ row.members.length }}</span>
          </div>
          <div v-if="row.open || query.trim()" class="rail-body">
            <div v-for="node in row.members.slice(0, memberLimit)" :key="node.id"
                 class="rail-item row row-tall is-card"
                 :class="{ 'is-on': store.state.selectedId === node.id }" :data-id="node.id"
                 role="option" :aria-selected="store.state.selectedId === node.id" tabindex="0"
                 @click="pick(node.id)" @keydown.enter.prevent="pick(node.id)"
                 @keydown.space.prevent="pick(node.id)">
              <span class="ri-id">{{ node.id }}</span>
              <span v-if="entryKey(node)" :class="`ri-entry is-${node.entry}`" :title="t(entryKey(node))"></span>
              <span class="ri-meta">{{ t("tagSay", { n: node.say }) }}</span>
            </div>
          </div>
        </template>
        <p v-if="!chapters.length" class="rail-empty">{{ t("searchEmpty") }}</p>
      </template>
    </div>
  </aside>
</template>
