<script setup lang="ts">
import { graph } from "../../data/graph";
import { specialScriptName, specialScripts } from "../../data/special";
import { chapterTitle, t } from "../../i18n";
import { toNeedle } from "../../lib/browser";
import type { Chapter, GraphNode } from "../../types/graph";
import AppIcon from "../ui/AppIcon.vue";
import { useScriptStore } from "../../stores/script";
import { useUiStore } from "../../stores/ui";
import { useViewStore } from "../../stores/view";

type RailTab = "outline" | "bookmarks" | "special";

type ChapterRow = {
  index: number;
  chapter: Chapter;
  title: string;
  ordinal: string;
  members: GraphNode[];
  total: number;
  hidden: number;
  open: boolean;
};

type BookmarkRow = {
  id: string;
  chapter: string;
  index: number;
  known: boolean;
};

const TAB_IDS: RailTab[] = ["outline", "bookmarks", "special"];
const TAB_LABEL_KEYS: Record<RailTab, string> = {
  outline: "railTabOutline",
  bookmarks: "railTabBookmarks",
  special: "railTabSpecial",
};
const SEARCH_MEMBER_LIMIT = 200;

const store = useScriptStore();
const view = useViewStore();
const ui = useUiStore();

const query = ref("");
const listRef = ref<HTMLElement | null>(null);
const tablistRef = ref<HTMLElement | null>(null);
const searchRef = ref<HTMLInputElement | null>(null);

const searching = computed(() => toNeedle(query.value).length > 0);

const openChapter = computed(() => {
  const explicit = view.outlineChapter;
  if (explicit !== undefined) return explicit;
  const node = store.selected();
  return node ? node.chapterIndex : -1;
});

const chapterRows = computed<ChapterRow[]>(() => {
  const needle = toNeedle(query.value);
  const byChapter = graph.nodesByChapter();
  const rows: ChapterRow[] = [];
  graph.chapters.forEach((chapter, index) => {
    let members = byChapter[index] || [];
    const title = chapterTitle(chapter);
    if (needle) {
      const hit =
        title.toLowerCase().indexOf(needle) >= 0 || chapter.id.toLowerCase().indexOf(needle) >= 0;
      if (!hit) members = members.filter((node) => node.id.toLowerCase().indexOf(needle) >= 0);
      if (!members.length) return;
    }
    const total = members.length;
    const shown = needle ? members.slice(0, SEARCH_MEMBER_LIMIT) : members;
    rows.push({
      index,
      chapter,
      title,
      ordinal: String(index + 1).padStart(2, "0"),
      members: shown,
      total,
      hidden: total - shown.length,
      open: needle ? true : openChapter.value === index,
    });
  });
  return rows;
});

const bookmarkRows = computed<BookmarkRow[]>(() => {
  void store.bookmarkVersion;
  const needle = toNeedle(query.value);
  const rows: BookmarkRow[] = [];
  for (const id of store.bookmarkList()) {
    const node = graph.nodeById.get(id);
    const chapter = node ? chapterTitle(graph.chapterOf(node)) : "";
    if (
      needle &&
      id.toLowerCase().indexOf(needle) < 0 &&
      chapter.toLowerCase().indexOf(needle) < 0
    ) {
      continue;
    }
    rows.push({ id, chapter, index: graph.indexById.get(id) ?? -1, known: !!node });
  }
  return rows;
});

const specialRows = computed(() => {
  const needle = toNeedle(query.value);
  return specialScripts
    .map((entry) => ({
      entry,
      name: specialScriptName(entry, store.lang),
      known: graph.nodeById.has(entry.id),
    }))
    .filter((row) => {
      if (!needle) return true;
      return (
        row.name.toLowerCase().indexOf(needle) >= 0 ||
        row.entry.id.toLowerCase().indexOf(needle) >= 0
      );
    });
});

const matchCount = computed(() => {
  if (view.railTab === "bookmarks") return bookmarkRows.value.length;
  if (view.railTab === "special") return specialRows.value.length;
  return chapterRows.value.reduce((sum, row) => sum + row.total, 0);
});

const tabs = computed(() => {
  void store.bookmarkVersion;
  return TAB_IDS.map((id) => ({
    id,
    labelKey: TAB_LABEL_KEYS[id],
    count:
      id === "outline"
        ? graph.nodes.length
        : id === "bookmarks"
          ? store.bookmarkList().length
          : specialScripts.length,
  }));
});

const summary = computed(() =>
  t("railSummary", { chapters: graph.chapters.length, scripts: graph.nodes.length }),
);

const nodeIndex = (id: string) => graph.indexById.get(id) ?? -1;

const setTab = (tab: RailTab) => {
  if (tab === view.railTab) return;
  view.setRailTab(tab);
};

const focusTab = (id: RailTab) => {
  const button = tablistRef.value?.querySelector<HTMLButtonElement>(`[data-rail="${id}"]`);
  button?.focus();
};

const onTabKeydown = (event: KeyboardEvent) => {
  const current = TAB_IDS.indexOf(view.railTab as RailTab);
  let next = -1;
  if (event.key === "ArrowRight") next = (Math.max(current, 0) + 1) % TAB_IDS.length;
  else if (event.key === "ArrowLeft")
    next = (Math.max(current, 0) + TAB_IDS.length - 1) % TAB_IDS.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = TAB_IDS.length - 1;
  if (next < 0) return;
  event.preventDefault();
  const id = TAB_IDS[next];
  setTab(id);
  focusTab(id);
};

const toggleChapter = (index: number) => {
  if (searching.value) return;
  view.setOutlineChapter(view.outlineChapter === index ? -1 : index);
};

const revealSelected = async (id: string) => {
  const node = graph.nodeById.get(id);
  if (!node) return;
  view.setOutlineChapter(node.chapterIndex);
  if (view.railTab !== "outline") return;
  if (view.isOverlayRail() && !view.railOpen) return;
  await nextTick();
  const index = graph.indexById.get(id);
  if (index === undefined || !listRef.value) return;
  const row = listRef.value.querySelector<HTMLElement>(`[data-index="${index}"]`);
  row?.scrollIntoView({ block: "nearest" });
};

const clearQuery = () => {
  query.value = "";
  searchRef.value?.focus();
};

const pick = (id: string) => {
  if (!store.select(id, { history: true })) return;
  if (view.isOverlayRail()) view.closeRail();
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

watch(
  () => store.selectedId,
  (id) => {
    if (id) void revealSelected(id);
  },
  { immediate: true },
);
</script>

<template>
  <aside id="chapterRail" :aria-label="t('railTitle')">
    <header class="rail-head">
      <div class="rail-head-text">
        <h2 class="rail-title">{{ t("railTitle") }}</h2>
        <p class="rail-summary">{{ summary }}</p>
      </div>
      <button
        id="railClose"
        class="btn btn-icon rail-close"
        type="button"
        :title="t('closeTitle')"
        :aria-label="t('closeTitle')"
        @click="view.closeRail"
      >
        <AppIcon name="close" />
      </button>
    </header>

    <div
      ref="tablistRef"
      class="rail-tabs"
      role="tablist"
      :aria-label="t('railTabsLabel')"
      @keydown="onTabKeydown"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :id="`railTab-${tab.id}`"
        class="rail-tab"
        :class="{ 'is-on': view.railTab === tab.id }"
        :data-rail="tab.id"
        role="tab"
        type="button"
        :aria-selected="view.railTab === tab.id"
        aria-controls="chapterList"
        :tabindex="view.railTab === tab.id ? 0 : -1"
        @click="setTab(tab.id)"
      >
        <span class="rail-tab-text">{{ t(tab.labelKey) }}</span>
        <span class="rail-tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <div class="rail-search">
      <AppIcon name="search" />
      <input
        id="railSearch"
        ref="searchRef"
        v-model="query"
        class="search-input"
        type="search"
        autocomplete="off"
        spellcheck="false"
        :placeholder="t('railSearchPlaceholder')"
        :aria-label="t('railSearchPlaceholder')"
      />
      <button
        v-if="query"
        class="rail-search-clear"
        type="button"
        :title="t('railSearchClear')"
        :aria-label="t('railSearchClear')"
        @click="clearQuery"
      >
        <AppIcon name="close" />
      </button>
    </div>

    <div
      id="chapterList"
      ref="listRef"
      class="rail-list"
      role="tabpanel"
      :aria-labelledby="`railTab-${view.railTab}`"
    >
      <p v-if="searching" class="cat-result">{{ t("searchCount", { n: matchCount }) }}</p>

      <template v-if="view.railTab === 'bookmarks'">
        <template v-if="bookmarkRows.length">
          <div
            v-for="row in bookmarkRows"
            :key="row.id"
            class="cat-book"
            :class="{ 'is-on': store.selectedId === row.id }"
          >
            <button
              class="cat-book-main"
              type="button"
              :disabled="!row.known"
              :data-index="row.index"
              :aria-current="store.selectedId === row.id ? 'true' : undefined"
              @click="pick(row.id)"
            >
              <span class="cat-id">{{ row.id }}</span>
              <span v-if="row.chapter" class="cat-meta">{{ row.chapter }}</span>
            </button>
            <button
              class="cat-del"
              type="button"
              :title="t('bookmarkRemove')"
              :aria-label="t('bookmarkRemove')"
              @click.stop="removeBookmark(row.id)"
            >
              <AppIcon name="close" />
            </button>
          </div>
          <button class="cat-clear" type="button" @click="clearAll">
            {{ t("bookmarkClear") }}
          </button>
        </template>
        <p v-else class="cat-empty">{{ t(searching ? "searchEmpty" : "bookmarkEmpty") }}</p>
      </template>

      <template v-else-if="view.railTab === 'special'">
        <template v-if="specialRows.length">
          <button
            v-for="row in specialRows"
            :key="row.entry.id"
            class="cat-row cat-special"
            :class="{ 'is-on': store.selectedId === row.entry.id }"
            type="button"
            :disabled="!row.known"
            :aria-current="store.selectedId === row.entry.id ? 'true' : undefined"
            @click="pickSpecial(row)"
          >
            <span class="cat-name">{{ row.name }}</span>
            <span class="cat-code">{{ row.entry.id }}</span>
          </button>
        </template>
        <p v-else class="cat-empty">{{ t("searchEmpty") }}</p>
      </template>

      <template v-else>
        <template v-for="row in chapterRows" :key="row.chapter.id">
          <button
            class="cat-chap"
            :class="{ 'is-open': row.open }"
            type="button"
            :disabled="searching"
            :aria-expanded="row.open"
            @click="toggleChapter(row.index)"
          >
            <span class="cat-chap-ord">{{ row.ordinal }}</span>
            <span class="cat-chap-mark" :style="{ backgroundColor: row.chapter.color }"></span>
            <span class="cat-chap-title">{{ row.title }}</span>
            <span class="cat-chap-count">{{ t("railScripts", { n: row.total }) }}</span>
            <AppIcon class="cat-chap-arrow" name="chevron" />
          </button>
          <div v-if="row.open" class="cat-entries">
            <button
              v-for="node in row.members"
              :key="node.id"
              class="cat-row"
              :class="{ 'is-on': store.selectedId === node.id }"
              type="button"
              :data-index="nodeIndex(node.id)"
              :aria-current="store.selectedId === node.id ? 'true' : undefined"
              @click="pick(node.id)"
            >
              <span class="cat-id">{{ node.id }}</span>
              <span class="cat-meta">{{ t("sayCount", { n: node.sayCount }) }}</span>
            </button>
            <p v-if="row.hidden" class="cat-more">{{ t("previewMore", { n: row.hidden }) }}</p>
          </div>
        </template>
        <p v-if="!chapterRows.length" class="cat-empty">{{ t("searchEmpty") }}</p>
      </template>
    </div>
  </aside>
</template>
