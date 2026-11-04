<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { graph } from "../../data/graph";
import { wordCount } from "../../data/wordcount";
import { chapterTitle, t } from "../../i18n";
import { formatCount } from "../../lib/browser";
import { overlay } from "../../lib/overlay";
import { store } from "../../state/store";
import type { WordCount as WordCountPair, WordPack } from "../../types/text";
import { EN_INDEX, ZH_INDEX } from "../../types/text";
import { UI_IDS } from "../../ui/ids";
import AppIcon from "../ui/AppIcon.vue";

const KIND_LABEL_KEYS: Record<string, string> = {
  dialog: "typeDialog",
  narration: "typeNarration",
  think: "typeThink",
  option: "typeOption",
  lore: "typeLore",
};

const reloadTick = ref(0);
const loading = ref(false);
const activeKind = ref("all");
const openChapter = ref("");

const open = computed(() => overlay.isOpen("stats"));

const wordPack = computed<WordPack | null>(() => {
  void reloadTick.value;
  return wordCount.wordPack();
});

const totalPair = computed(() => {
  const pack = wordPack.value;
  const total: WordCountPair = [0, 0];
  if (pack) {
    Object.keys(pack.scripts || {}).forEach((id) => {
      const counts = wordCount.countsOf(pack.scripts[id], "all");
      if (!counts[ZH_INDEX] && !counts[EN_INDEX]) return;
      total[ZH_INDEX] += counts[ZH_INDEX];
      total[EN_INDEX] += counts[EN_INDEX];
    });
  }
  return total;
});

const scriptIdsOf = (index: number) => (
  (graph.nodesByChapter()[index] || []).map((node) => node.id)
);

const kindItems = computed(() => {
  const items = [{ id: "all", key: "statsKindAll" }];
  for (const kind of wordCount.kinds()) {
    items.push({ id: kind, key: KIND_LABEL_KEYS[kind] || "statsKindAll" });
  }
  return items;
});

type TableRow =
  | {
    type: "chapter"; id: string; title: string; isOpen: boolean;
    scriptCount: number; counts: WordCountPair;
  }
  | { type: "script"; id: string; counts: WordCountPair };

const tableRows = computed<TableRow[]>(() => {
  const pack = wordPack.value;
  if (!pack) return [];
  const out: TableRow[] = [];
  graph.chapters.forEach((chapter, index) => {
    const counts = wordCount.countsOf(
      (pack.chapters || {})[chapter.id], activeKind.value);
    out.push({
      type: "chapter",
      id: chapter.id,
      title: chapterTitle(chapter),
      isOpen: openChapter.value === chapter.id,
      scriptCount: scriptIdsOf(index).length,
      counts,
    });
    if (openChapter.value !== chapter.id) return;
    const scripts = scriptIdsOf(index)
      .map((id) => ({
        id,
        counts: wordCount.countsOf((pack.scripts || {})[id], activeKind.value),
      }))
      .filter((item) => item.counts[ZH_INDEX] || item.counts[EN_INDEX]);
    scripts.sort((a, b) => (
      (b.counts[ZH_INDEX] + b.counts[EN_INDEX]) - (a.counts[ZH_INDEX] + a.counts[EN_INDEX])
    ));
    scripts.forEach((item) => out.push({ type: "script", id: item.id, counts: item.counts }));
  });
  return out;
});

const filteredTotal = computed<WordCountPair>(() => {
  const total: WordCountPair = [0, 0];
  const pack = wordPack.value;
  if (!pack) return total;
  graph.chapters.forEach((chapter) => {
    const counts = wordCount.countsOf(
      (pack.chapters || {})[chapter.id], activeKind.value);
    total[ZH_INDEX] += counts[ZH_INDEX];
    total[EN_INDEX] += counts[EN_INDEX];
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

const openScript = (id: string) => {
  overlay.close("stats");
  store.select(id, { history: true });
};

const load = () => {
  loading.value = true;
  void wordCount.loadWordCount().then(() => {
    loading.value = false;
    reloadTick.value++;
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
      <button id="statsClose" class="btn btn-icon btn-sm" type="button"
              :title="t('closeTitle')" @click="close">
        <AppIcon name="close" />
      </button>
    </header>

    <div id="statsSummary" class="stats-summary">
      <div class="stat-card">
        <span class="stat-value">{{ formatCount(totalPair[0]) }}</span>
        <span class="stat-label">{{ t("statsZh") }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ formatCount(totalPair[1]) }}</span>
        <span class="stat-label">{{ t("statsEn") }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ formatCount(totalPair[0] + totalPair[1]) }}</span>
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
      <template v-if="!wordPack">
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
                <th class="num" scope="col">{{ t("statsScripts") }}</th>
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
            <template v-for="(row, index) in tableRows" :key="`${row.type}-${row.id}-${index}`">
              <tr v-if="row.type === 'chapter'" class="stats-chapter"
                  :class="{ 'is-open': row.isOpen }">
                <th class="name" scope="row">
                  <button class="stats-expand row" type="button" :aria-expanded="row.isOpen"
                          @click="toggleChapter(row.id)">
                    <span class="stats-name">{{ row.title }}</span>
                  </button>
                </th>
                <td class="num">{{ formatCount(row.scriptCount) }}</td>
                <td class="num">{{ formatCount(row.counts[0]) }}</td>
                <td class="num">{{ formatCount(row.counts[1]) }}</td>
                <td class="num sum">{{ formatCount(row.counts[0] + row.counts[1]) }}</td>
              </tr>
              <tr v-else class="stats-script">
                <td class="name">
                  <button class="stats-open btn-link" type="button" :title="t('statsOpen')"
                          @click="openScript(row.id)">
                    {{ row.id }}
                  </button>
                </td>
                <td class="num muted">—</td>
                <td class="num">{{ formatCount(row.counts[0]) }}</td>
                <td class="num">{{ formatCount(row.counts[1]) }}</td>
                <td class="num sum">{{ formatCount(row.counts[0] + row.counts[1]) }}</td>
              </tr>
            </template>
          </tbody>
          <tfoot>
            <tr class="stats-total">
              <th class="name">{{ t("statsTotalRow") }}</th>
              <td class="num"></td>
              <td class="num">{{ formatCount(filteredTotal[0]) }}</td>
              <td class="num">{{ formatCount(filteredTotal[1]) }}</td>
              <td class="num sum">{{ formatCount(filteredTotal[0] + filteredTotal[1]) }}</td>
            </tr>
          </tfoot>
        </table>
      </template>
    </div>

    <p class="panel-hint">{{ t("statsHint") }}</p>
  </div>
</template>
