<script setup lang="ts">
import { graph } from "../../data/graph";
import { specialScriptName, specialScripts } from "../../data/special";
import { chapterTitle, t } from "../../i18n";
import { toNeedle } from "../../lib/browser";
import type { GraphNode } from "../../types/graph";
import AppIcon from "../ui/AppIcon.vue";
import { useScriptStore } from "../../stores/script";
import { useViewStore } from "../../stores/view";
import { useUiStore } from "../../stores/ui";

const store = useScriptStore();
const view = useViewStore();
const ui = useUiStore();

const ENTRY_LABEL_KEYS: Record<string, string> = {
  combat: "entry.combat",
  free: "entry.free",
};
const RAIL_TABS = ["outline", "bookmarks", "special"];

const query = ref("");

const bookmarkIds = computed(() => {
  void store.bookmarkVersion;
  return store.bookmarkList();
});

const expandedChapterIndex = computed(() => {
  const explicit = view.outlineChapter;
  if (explicit !== undefined) return explicit;
  const node = store.selected();
  return node ? node.chapterIndex : -1;
});

const chapters = computed(() => {
  const needle = toNeedle(query.value);
  const byChapter = graph.nodesByChapter();
  const rows: {
    index: number;
    chapter: (typeof graph.chapters)[number];
    members: GraphNode[];
    isOpen: boolean;
  }[] = [];
  graph.chapters.forEach((chapter, index) => {
    let members = byChapter[index] || [];
    if (needle) {
      const title = chapterTitle(chapter).toLowerCase();
      if (title.indexOf(needle) < 0 && chapter.id.toLowerCase().indexOf(needle) < 0) {
        members = members.filter((node) => node.id.toLowerCase().indexOf(needle) >= 0);
      }
      if (!members.length) return;
    }
    rows.push({ index, chapter, members, isOpen: index === expandedChapterIndex.value });
  });
  return rows;
});

const memberLimit = computed(() => (query.value.trim() ? 200 : Infinity));

const specialRows = computed(() =>
  specialScripts.map((entry) => ({
    entry,
    name: specialScriptName(entry, store.lang),
    known: graph.nodeById.has(entry.id),
  })),
);

const setTab = (tab: string) => {
  if (RAIL_TABS.indexOf(tab) < 0 || tab === view.railTab) return;
  query.value = "";
  view.setRailTab(tab);
};

const toggleChapter = (index: number) => {
  view.setOutlineChapter(view.outlineChapter === index ? -1 : index);
};

const pick = (id: string) => {
  store.select(id, { history: true });
};

const pickSpecial = (row: { entry: { id: string }; known: boolean }) => {
  if (row.known) pick(row.entry.id);
};

const removeBookmark = (id: string) => {
  const on = store.toggleBookmark(id);
  ui.toast(t(on ? "bookmarkAdded" : "bookmarkRemoved"));
};

const clearAll = () => {
  store.clearBookmarks();
  ui.toast(t("bookmarkCleared"));
};

const entryLabelKey = (node: GraphNode) =>
  node.entry && ENTRY_LABEL_KEYS[node.entry] ? ENTRY_LABEL_KEYS[node.entry] : "";

const metaOf = (id: string) => {
  const node = graph.nodeById.get(id);
  return node ? chapterTitle(graph.chapterOf(node)) : "";
};

const entryMark = (id: string) => {
  const node = graph.nodeById.get(id);
  return node ? entryLabelKey(node) : "";
};
</script>

<template>
  <aside id="chapterRail" :aria-label="t('railTitle')">
    <div class="rail-head">
      <h2 class="rail-title">{{ t("railTitle") }}</h2>
      <button
        id="railClose"
        class="btn btn-icon rail-close"
        type="button"
        :title="t('closeTitle')"
        @click="view.closeRail"
      >
        <AppIcon name="close" />
      </button>
    </div>
    <div class="rail-tabs tabs" role="tablist" :aria-label="t('railTabsLabel')">
      <button
        class="rail-tab tab"
        :class="{ 'is-on': view.railTab === 'outline' }"
        data-rail="outline"
        role="tab"
        :aria-selected="view.railTab === 'outline'"
        :title="t('railTabOutline')"
        type="button"
        @click="setTab('outline')"
      >
        <span class="rail-tab-text">{{ t("railTabOutline") }}</span>
      </button>
      <button
        class="rail-tab tab"
        :class="{ 'is-on': view.railTab === 'bookmarks' }"
        data-rail="bookmarks"
        role="tab"
        :aria-selected="view.railTab === 'bookmarks'"
        :title="t('railTabBookmarks')"
        type="button"
        @click="setTab('bookmarks')"
      >
        <span class="rail-tab-text">{{ t("railTabBookmarks") }}</span>
      </button>
      <button
        class="rail-tab tab"
        :class="{ 'is-on': view.railTab === 'special' }"
        data-rail="special"
        role="tab"
        :aria-selected="view.railTab === 'special'"
        :title="t('railTabSpecial')"
        type="button"
        @click="setTab('special')"
      >
        <span class="rail-tab-text">{{ t("railTabSpecial") }}</span>
      </button>
    </div>
    <div id="railSearchBox" class="rail-search" :hidden="view.railTab !== 'outline'">
      <AppIcon name="search" />
      <input
        id="railSearch"
        v-model="query"
        class="search-input"
        type="search"
        autocomplete="off"
        spellcheck="false"
        :placeholder="t('railSearchPlaceholder')"
        :aria-label="t('railSearchPlaceholder')"
      />
    </div>

    <div id="chapterList" class="rail-list">
      <template v-if="view.railTab === 'bookmarks'">
        <template v-if="!bookmarkIds.length">
          <p class="rail-empty">{{ t("bookmarkEmpty") }}</p>
        </template>
        <template v-else>
          <p class="rail-group">{{ `${t("railTabBookmarks")} · ${bookmarkIds.length}` }}</p>
          <div
            v-for="id in bookmarkIds"
            :key="id"
            class="rail-item row row-tall"
            :class="{ 'is-on': store.selectedId === id }"
            :data-id="id"
            role="option"
            :aria-selected="store.selectedId === id"
            tabindex="0"
            @click="pick(id)"
            @keydown.enter.prevent="pick(id)"
            @keydown.space.prevent="pick(id)"
          >
            <span class="ri-id">{{ id }}</span>
            <span
              v-if="entryMark(id)"
              :class="`ri-entry is-${graph.nodeById.get(id)?.entry}`"
              :title="t(entryMark(id))"
            ></span>
            <span v-if="graph.nodeById.has(id)" class="ri-meta">{{ metaOf(id) }}</span>
            <button
              class="ri-del btn btn-icon btn-sm"
              type="button"
              :title="t('bookmarkRemove')"
              @click.stop="removeBookmark(id)"
            >
              <AppIcon name="close" />
            </button>
          </div>
          <button class="link-btn btn-link" type="button" @click="clearAll">
            {{ t("bookmarkClear") }}
          </button>
        </template>
      </template>

      <template v-else-if="view.railTab === 'special'">
        <p class="rail-group">{{ `${t("railTabSpecial")} · ${specialRows.length}` }}</p>
        <div
          v-for="row in specialRows"
          :key="row.entry.id"
          class="rail-item row row-tall is-special"
          :class="{ 'is-on': store.selectedId === row.entry.id, 'is-missing': !row.known }"
          :data-id="row.entry.id"
          role="option"
          :aria-selected="store.selectedId === row.entry.id"
          :aria-disabled="!row.known"
          :tabindex="row.known ? 0 : -1"
          @click="pickSpecial(row)"
          @keydown.enter.prevent="pickSpecial(row)"
          @keydown.space.prevent="pickSpecial(row)"
        >
          <span class="ri-name" :title="row.name">{{ row.name }}</span>
          <span class="ri-code" :title="row.entry.id">{{ row.entry.id }}</span>
        </div>
      </template>

      <template v-else>
        <template v-for="row in chapters" :key="row.chapter.id">
          <div
            class="rail-item rail-chap row row-tall"
            :class="{ 'is-open': row.isOpen }"
            role="button"
            tabindex="0"
            @click="toggleChapter(row.index)"
            @keydown.enter.prevent="toggleChapter(row.index)"
            @keydown.space.prevent="toggleChapter(row.index)"
          >
            <span class="ri-id">{{ chapterTitle(row.chapter) }}</span>
            <span class="ri-meta">{{ row.members.length }}</span>
          </div>
          <div v-if="row.isOpen || query.trim()" class="rail-body">
            <div
              v-for="node in row.members.slice(0, memberLimit)"
              :key="node.id"
              class="rail-item row row-tall is-card"
              :class="{ 'is-on': store.selectedId === node.id }"
              :data-id="node.id"
              role="option"
              :aria-selected="store.selectedId === node.id"
              tabindex="0"
              @click="pick(node.id)"
              @keydown.enter.prevent="pick(node.id)"
              @keydown.space.prevent="pick(node.id)"
            >
              <span class="ri-id">{{ node.id }}</span>
              <span
                v-if="entryLabelKey(node)"
                :class="`ri-entry is-${node.entry}`"
                :title="t(entryLabelKey(node))"
              ></span>
              <span class="ri-meta">{{ t("sayCount", { n: node.sayCount }) }}</span>
            </div>
          </div>
        </template>
        <p v-if="!chapters.length" class="rail-empty">{{ t("searchEmpty") }}</p>
      </template>
    </div>
  </aside>
</template>
