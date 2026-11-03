<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { graph } from "../../data/graph";
import { wordcount } from "../../data/wordcount";
import { chapterTitle, t } from "../../i18n";
import { formatNumber } from "../../lib/dom";
import { overlay } from "../../lib/overlay";
import { store } from "../../state/store";
import type { WordPair, WordPack } from "../../types/text";
import { UI_IDS } from "../../ui/ids";
import AppIcon from "../ui/AppIcon.vue";

const KIND_LABEL: Record<string, string> = {
  dialog: "typeDialog",
  narration: "typeNarration",
  think: "typeThink",
  option: "typeOption",
  lore: "typeLore",
};

const tick = ref(0);
const loading = ref(false);
const activeKind = ref("all");
const openChapter = ref("");

const open = computed(() => overlay.isOpen("stats"));

const pack = computed<WordPack | null>(() => {
  void tick.value;
  return wordcount.pack();
});

const summary = computed(() => {
  const data = pack.value;
  const total: WordPair = [0, 0];
  if (data) {
    Object.keys(data.stories || {}).forEach((id) => {
      const pair = wordcount.counts(data.stories[id], "all");
      if (!pair[0] && !pair[1]) return;
      total[0] += pair[0];
      total[1] += pair[1];
    });
  }
  return total;
});

const storyIdsOf = (index: number) => (graph.nodesByChapter()[index] || []).map((node) => node.id);

const kindItems = computed(() => {
  const items = [{ id: "all", key: "statsKindAll" }];
  for (const kind of wordcount.kinds()) {
    items.push({ id: kind, key: KIND_LABEL[kind] || "statsKindAll" });
  }
  return items;
});

type Row =
  | { type: "chapter"; id: string; title: string; open: boolean; stories: number; pair: WordPair }
  | { type: "story"; id: string; pair: WordPair };

const rows = computed<Row[]>(() => {
  const data = pack.value;
  if (!data) return [];
  const out: Row[] = [];
  graph.chapters.forEach((chapter, index) => {
    const pair = wordcount.counts((data.chapters || {})[chapter.id], activeKind.value);
    out.push({
      type: "chapter",
      id: chapter.id,
      title: chapterTitle(chapter),
      open: openChapter.value === chapter.id,
      stories: storyIdsOf(index).length,
      pair,
    });
    if (openChapter.value !== chapter.id) return;
    const stories = storyIdsOf(index)
      .map((id) => ({ id, pair: wordcount.counts((data.stories || {})[id], activeKind.value) }))
      .filter((item) => item.pair[0] || item.pair[1]);
    stories.sort((a, b) => (b.pair[0] + b.pair[1]) - (a.pair[0] + a.pair[1]));
    stories.forEach((item) => out.push({ type: "story", id: item.id, pair: item.pair }));
  });
  return out;
});

const footer = computed<WordPair>(() => {
  const total: WordPair = [0, 0];
  const data = pack.value;
  if (!data) return total;
  graph.chapters.forEach((chapter) => {
    const pair = wordcount.counts((data.chapters || {})[chapter.id], activeKind.value);
    total[0] += pair[0];
    total[1] += pair[1];
  });
  return total;
});

const close = () => overlay.close("stats");

const pickKind = (id: string) => {
  if (activeKind.value === id) return;
  activeKind.value = id;
};

const toggleChapter = (id: string) => {
  openChapter.value = openChapter.value === id ? "" : id;
};

const openStory = (id: string) => {
  overlay.close("stats");
  store.select(id, { history: true });
};

const load = () => {
  loading.value = true;
  void wordcount.ensure().then(() => {
    loading.value = false;
    tick.value++;
  });
};

watch(open, (value) => {
  if (!value) return;
  openChapter.value = "";
  load();
});

onMounted(() => {
  overlay.register("stats", {
    id: UI_IDS.statsPanel,
    triggerId: UI_IDS.statsBtn,
    group: "modal",
    autofocus: UI_IDS.statsClose,
  });
});
</script>

<template>
  <div id="statsPanel" class="stats-panel surface" role="dialog" aria-modal="true"
       aria-labelledby="statsHeading" :hidden="!open">
    <header class="panel-head">
      <h2 id="statsHeading" class="panel-title">{{ t("statsTitle") }}</h2>
      <button id="statsClose" class="btn btn-icon btn-sm" type="button" :title="t('closeTitle')" @click="close">
        <AppIcon name="close" />
      </button>
    </header>

    <div id="statsSummary" class="stats-summary">
      <div class="stat-card">
        <span class="stat-value">{{ formatNumber(summary[0]) }}</span>
        <span class="stat-label">{{ t("statsZh") }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ formatNumber(summary[1]) }}</span>
        <span class="stat-label">{{ t("statsEn") }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ formatNumber(summary[0] + summary[1]) }}</span>
        <span class="stat-label">{{ t("statsSum") }}</span>
      </div>
      <span class="stats-note">
        {{ t("statsNote", { n: graph.nodes.length, chapters: graph.chapters.length }) }}
      </span>
    </div>

    <div id="statsKinds" class="stats-kinds" role="group" :aria-label="t('fontTypes')">
      <button v-for="item in kindItems" :key="item.id" class="stats-kind btn btn-sm"
              :class="{ 'is-on': item.id === activeKind }" type="button"
              :aria-pressed="item.id === activeKind" @click="pickKind(item.id)">
        {{ t(item.key) }}
      </button>
    </div>

    <div id="statsBody" class="stats-body">
      <template v-if="!pack">
        <p :class="loading ? 'stats-loading' : 'stats-empty'">
          {{ t(loading ? "statsLoading" : "statsEmpty") }}
        </p>
      </template>
      <template v-else>
        <div class="stats-head">
          <table class="stats-table">
            <colgroup>
              <col class="col-name" />
              <col v-for="index in 4" :key="index" class="col-num" />
            </colgroup>
            <thead>
              <tr>
                <th class="name" scope="col">{{ t("statsChapter") }}</th>
                <th class="num" scope="col">{{ t("statsStories") }}</th>
                <th class="num" scope="col">{{ t("statsZh") }}</th>
                <th class="num" scope="col">{{ t("statsEn") }}</th>
                <th class="num" scope="col">{{ t("statsSum") }}</th>
              </tr>
            </thead>
          </table>
        </div>

        <table class="stats-table">
          <colgroup>
            <col class="col-name" />
            <col v-for="index in 4" :key="index" class="col-num" />
          </colgroup>
          <tbody>
            <template v-for="(row, index) in rows" :key="`${row.type}-${row.id}-${index}`">
              <tr v-if="row.type === 'chapter'" class="stats-chapter" :class="{ 'is-open': row.open }">
                <th class="name" scope="row">
                  <button class="stats-expand row" type="button" :aria-expanded="row.open"
                          @click="toggleChapter(row.id)">
                    <span class="stats-name">{{ row.title }}</span>
                  </button>
                </th>
                <td class="num">{{ formatNumber(row.stories) }}</td>
                <td class="num">{{ formatNumber(row.pair[0]) }}</td>
                <td class="num">{{ formatNumber(row.pair[1]) }}</td>
                <td class="num sum">{{ formatNumber(row.pair[0] + row.pair[1]) }}</td>
              </tr>
              <tr v-else class="stats-story">
                <td class="name">
                  <button class="stats-open btn-link" type="button" :title="t('statsOpen')"
                          @click="openStory(row.id)">
                    {{ row.id }}
                  </button>
                </td>
                <td class="num muted">—</td>
                <td class="num">{{ formatNumber(row.pair[0]) }}</td>
                <td class="num">{{ formatNumber(row.pair[1]) }}</td>
                <td class="num sum">{{ formatNumber(row.pair[0] + row.pair[1]) }}</td>
              </tr>
            </template>
          </tbody>
          <tfoot>
            <tr class="stats-total">
              <th class="name">{{ t("statsTotalRow") }}</th>
              <td class="num"></td>
              <td class="num">{{ formatNumber(footer[0]) }}</td>
              <td class="num">{{ formatNumber(footer[1]) }}</td>
              <td class="num sum">{{ formatNumber(footer[0] + footer[1]) }}</td>
            </tr>
          </tfoot>
        </table>
      </template>
    </div>

    <p class="panel-hint">{{ t("statsHint") }}</p>
  </div>
</template>
