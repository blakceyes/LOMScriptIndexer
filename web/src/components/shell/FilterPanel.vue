<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { graph } from "../../data/graph";
import { chapterTitle, t } from "../../i18n";
import { debounce } from "../../lib/dom";
import { applyFilter, EXAMPLES, FIELD_LABEL_KEYS, filterIndex, RESULT_LIMIT } from "../../lib/filter";
import { overlay } from "../../lib/overlay";
import { query } from "../../lib/query";
import { store } from "../../state/store";
import type { QuerySuggestion } from "../../types/cond";
import AppIcon from "../ui/AppIcon.vue";

const OPS = ["AND", "OR", "NOT", "(", ")"];

const exprInput = ref<HTMLInputElement | null>(null);
const resultsBox = ref<HTMLElement | null>(null);
const exprValue = ref(store.state.filterSource);
const suggest = ref<{ open: boolean; items: QuerySuggestion[]; active: number; from: number; to: number; mode: string }>({
  open: false, items: [], active: 0, from: 0, to: 0, mode: "field",
});
const shown = ref(RESULT_LIMIT);

const fields = computed(() => query.fields());

const active = computed(() => !!store.state.filterSet);

const badge = computed(() => {
  const set = store.state.filterSet;
  if (!set) return "";
  return set.size > 99 ? "99+" : String(set.size);
});

const statusText = computed(() => {
  const state = store.state;
  if (state.filterError) return state.filterError;
  if (!state.filterSource.trim()) return t("filterIdle");
  if (state.filterSet && state.filterSet.size === 0) {
    return state.filterLoading ? t("filterLoadingText") : t("filterNoMatch");
  }
  return state.filterLoading ? t("filterLoadingText") : "";
});

const statusClass = computed(() => {
  const state = store.state;
  if (state.filterError) return "filter-status is-error";
  if (!state.filterSource.trim()) return "filter-status";
  if (state.filterSet && state.filterSet.size === 0) {
    return state.filterLoading ? "filter-status" : "filter-status is-error";
  }
  return "filter-status is-ok";
});

const indexes = computed(() => {
  void store.state.filterVersion;
  const set = store.state.filterSet;
  return set ? Array.from(set) : [];
});

const resultRows = computed(() => indexes.value.slice(0, shown.value).map((index) => {
  const node = graph.nodes[index];
  return { id: node.id, chapter: chapterTitle(graph.chapterOf(node)) };
}));

const suggestLabel = (item: QuerySuggestion) => {
  if (item.kind === "field") return t(FIELD_LABEL_KEYS[String(item.value)] || String(item.value));
  if (item.kind === "logic") return "";
  return item.label || "";
};

const suggestShown = (item: QuerySuggestion) => (
  item.kind === "logic" ? item.value : `${item.value}${item.kind === "field" ? ":" : ""}`
);

const replaceRange = (start: number, end: number, value: string) => {
  const current = exprValue.value || "";
  exprValue.value = current.slice(0, start) + value + current.slice(end);
  const caret = start + value.length;
  void nextTick(() => {
    const node = exprInput.value;
    if (!node) return;
    node.setSelectionRange(caret, caret);
    node.focus();
  });
};

const insertAtCursor = (value: string) => {
  const node = exprInput.value;
  if (!node) return;
  replaceRange(node.selectionStart || 0, node.selectionEnd || 0, value);
};

const hideSuggest = () => {
  overlay.close("filterSuggest");
  suggest.value = { open: false, items: [], active: 0, from: 0, to: 0, mode: "field" };
};

const updateSuggest = () => {
  const node = exprInput.value;
  if (!node) return;
  if (!node.value) {
    hideSuggest();
    return;
  }
  const result = query.suggest(node.value, node.selectionStart ?? node.value.length, filterIndex());
  suggest.value = {
    open: true,
    items: result.items || [],
    active: 0,
    from: result.from,
    to: result.to,
    mode: result.mode,
  };
  void nextTick(() => {
    overlay.open("filterSuggest", {
      trigger: node,
      keep: ["filterPanel"],
      placement: { align: "start", gap: 6, matchWidth: true, fit: true },
    });
  });
};

const accept = (index?: number) => {
  const node = exprInput.value;
  const item = suggest.value.items[index === undefined ? suggest.value.active : index];
  if (!node || !item) return;
  const insert = item.insert || item.value;
  replaceRange(suggest.value.from, suggest.value.to, insert);
  hideSuggest();
  schedule();
  if (/(:|\(|\s)$/.test(insert)) updateSuggest();
};

const onExpressInput = () => {
  schedule();
  updateSuggest();
};

const schedule = debounce(() => {
  applyFilter(exprValue.value);
}, 250);

const onKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === "Escape") {
    if (suggest.value.open) {
      event.preventDefault();
      event.stopPropagation();
      hideSuggest();
      return;
    }
    hideSuggest();
    return;
  }
  if (suggest.value.open && suggest.value.items.length
    && (event.key === "Tab" || event.key === "Enter")) {
    event.preventDefault();
    accept(suggest.value.active);
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    schedule.cancel();
    hideSuggest();
    applyFilter(exprValue.value);
  }
};

const onKeyup = (event: KeyboardEvent) => {
  if (["ArrowLeft", "ArrowRight", "Home", "End"].indexOf(event.key) >= 0) updateSuggest();
};

let blurTimer: ReturnType<typeof setTimeout> | null = null;

const onBlur = () => {
  if (blurTimer !== null) clearTimeout(blurTimer);
  blurTimer = setTimeout(() => hideSuggest(), 120);
};

const openPanel = () => {
  exprValue.value = store.state.filterSource;
  overlay.open("filterPanel", { trigger: document.getElementById("filterBtn") });
  void nextTick(() => {
    const node = exprInput.value;
    if (!node) return;
    node.focus();
    node.select();
  });
};

const toggle = () => {
  if (overlay.isOpen("filterPanel")) overlay.close("filterPanel");
  else openPanel();
};

const applyNow = () => {
  schedule.cancel();
  applyFilter(exprValue.value);
};

const applyExample = (expr: string) => {
  exprValue.value = expr;
  applyFilter(expr);
};

const onChipInsert = (value: string) => {
  insertAtCursor(value);
  schedule();
};

const onResultsScroll = () => {
  const node = resultsBox.value;
  if (!node) return;
  if (node.scrollHeight - node.scrollTop - node.clientHeight < 40) {
    shown.value = Math.min(indexes.value.length, shown.value + RESULT_LIMIT);
  }
};

const pickNode = (id: string) => {
  overlay.close("filterPanel");
  store.select(id, { history: true });
};

watch(
  () => store.state.filterSource,
  (value) => {
    const node = exprInput.value;
    if (node && document.activeElement === node) return;
    if (exprValue.value !== value) exprValue.value = value;
  },
);

onMounted(() => {
  overlay.register("filterPanel", {
    id: "filterPanel",
    triggerId: "filterBtn",
    group: "pop",
    onHide: () => {
      hideSuggest();
    },
  });
  overlay.register("filterSuggest", {
    id: "filterSuggest",
    group: "menu",
    keep: ["filterPanel"],
    onHide: () => {
      suggest.value = { open: false, items: [], active: 0, from: 0, to: 0, mode: "field" };
    },
    placement: { align: "start", gap: 6, matchWidth: true, fit: true },
  });
});

const panelOpen = computed(() => overlay.isOpen("filterPanel"));
const suggestOpen = computed(() => overlay.isOpen("filterSuggest"));
</script>

<template>
  <div class="menu-wrap">
    <button id="filterBtn" class="btn filter-btn" type="button" aria-haspopup="dialog"
            :aria-expanded="panelOpen" aria-controls="filterPanel" :title="t('filterBtnTitle')"
            :class="{ 'is-on': active }" @click.stop="toggle">
      <AppIcon name="filter" class="ico" />
      <span class="btn-label">{{ t("filterBtn") }}</span>
      <span id="filterBadge" class="badge badge-solid badge-num" :hidden="!active">{{ badge }}</span>
    </button>

    <div id="filterPanel" class="filter-panel surface popover" role="dialog" :aria-label="t('filterBtn')"
         :hidden="!panelOpen">
      <div class="filter-row">
        <div class="filter-input-wrap">
          <input id="filterExpr" ref="exprInput" v-model="exprValue" class="input input-mono" type="text"
                 spellcheck="false" autocomplete="off" role="combobox" aria-autocomplete="list"
                 :aria-expanded="suggestOpen" aria-controls="filterSuggest"
                 :class="{ 'is-error': !!store.state.filterError }"
                 :placeholder="t('filterPlaceholder')" :aria-label="t('filterPlaceholder')"
                 @input="onExpressInput" @click="updateSuggest" @keyup="onKeyup"
                 @keydown="onKeydown" @blur="onBlur">
          <div id="filterSuggest" class="filter-suggest surface popover" role="listbox" :hidden="!suggestOpen">
            <template v-if="suggest.items.length">
              <button v-for="(item, index) in suggest.items" :key="`${item.value}-${index}`"
                      class="suggest-item row row-sm" :class="{ 'is-active': index === suggest.active }"
                      type="button" role="option" @mousedown.prevent="accept(index)">
                <span class="sg-value">{{ suggestShown(item) }}</span>
                <span v-if="suggestLabel(item)" class="sg-label">{{ suggestLabel(item) }}</span>
                <span v-if="item.count" class="sg-count">{{ t("suggestCount", { n: item.count }) }}</span>
              </button>
            </template>
            <div v-else class="suggest-empty popover-empty">{{ t("suggestEmpty") }}</div>
          </div>
        </div>
        <button id="filterApply" class="btn" type="button" @click="applyNow">{{ t("filterApply") }}</button>
      </div>
      <div id="filterStatus" :class="statusClass">{{ statusText }}</div>

      <div class="filter-section">
        <p class="filter-label">{{ t("filterFields") }}</p>
        <div id="filterFieldChips" class="filter-chips">
          <button v-for="field in fields" :key="field.id" class="filter-chip btn btn-sm btn-mono"
                  type="button" :data-insert="`${field.id}:`"
                  @click="onChipInsert(`${field.id}:`)">
            {{ t(FIELD_LABEL_KEYS[field.id] || field.id) }}
          </button>
        </div>
      </div>
      <div class="filter-section">
        <p class="filter-label">{{ t("filterOperators") }}</p>
        <div id="filterOpChips" class="filter-chips">
          <button v-for="op in OPS" :key="op" class="filter-chip btn btn-sm btn-mono" type="button"
                  :data-insert="op === '(' || op === ')' ? op : ` ${op} `"
                  @click="onChipInsert(op === '(' || op === ')' ? op : ` ${op} `)">
            {{ op }}
          </button>
        </div>
      </div>
      <div class="filter-section">
        <p class="filter-label">{{ t("filterExamples") }}</p>
        <div id="filterExampleChips" class="filter-chips">
          <button v-for="example in EXAMPLES" :key="example.key" class="filter-chip btn btn-sm btn-mono"
                  type="button" :data-expr="example.expr" @click="applyExample(example.expr)">
            {{ t(example.key) }}
          </button>
        </div>
      </div>

      <div id="filterResults" class="filter-results" :hidden="!active || !store.state.filterSource.trim()">
        <div class="filter-results-title">
          {{ t("filterResults", { n: indexes.length }) }}
          <span class="filter-count">{{ t("filterCount", { n: indexes.length, total: graph.nodes.length }) }}</span>
        </div>
        <div v-if="!indexes.length" class="filter-results-empty">{{ t("filterResultsEmpty") }}</div>
        <div v-else ref="resultsBox" class="filter-results-list" @scroll.passive="onResultsScroll">
          <button v-for="row in resultRows" :key="row.id" class="result-item row row-sm"
                  :class="{ 'is-active': store.state.selectedId === row.id }" type="button"
                  :data-id="row.id" @click="pickNode(row.id)">
            <span class="ri-id">{{ row.id }}</span>
            <span class="ri-ch">{{ row.chapter }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
