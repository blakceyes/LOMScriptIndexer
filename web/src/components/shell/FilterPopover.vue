<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { graph } from "../../data/graph";
import { chapterTitle, t } from "../../i18n";
import { byId, debounce } from "../../lib/browser";
import {
  applyFilter, EXAMPLES, FIELD_LABEL_KEYS, queryIndex, RESULT_LIMIT,
} from "../../lib/filter";
import { overlay } from "../../lib/overlay";
import { query } from "../../lib/query";
import { store } from "../../state/store";
import type { QuerySuggestion } from "../../types/query";
import { UI_IDS } from "../../ui/ids";
import AppIcon from "../ui/AppIcon.vue";

const OPS = ["AND", "OR", "NOT", "(", ")"];

const POPOVER_KEY = "filterPopover";
const SUGGEST_KEY = "filterSuggestions";

const exprInput = ref<HTMLInputElement | null>(null);
const resultsPanel = ref<HTMLElement | null>(null);
const exprValue = ref(store.state.filterSource);
const suggestState = ref({
  isOpen: false,
  items: [] as QuerySuggestion[],
  activeIndex: 0,
  from: 0,
  to: 0,
  mode: "field",
});
const visibleLimit = ref(RESULT_LIMIT);

const fields = computed(() => query.fields());

const hasAppliedFilter = computed(() => !!store.state.filterSet);

const badgeCount = computed(() => {
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

const hitNodeIndexes = computed(() => {
  void store.state.filterRevision;
  const set = store.state.filterSet;
  return set ? Array.from(set) : [];
});

const resultRows = computed(() => (
  hitNodeIndexes.value.slice(0, visibleLimit.value).map((index) => {
    const node = graph.nodes[index];
    return { id: node.id, chapter: chapterTitle(graph.chapterOf(node)) };
  })
));

const suggestLabel = (item: QuerySuggestion) => {
  if (item.kind === "field") {
    return t(FIELD_LABEL_KEYS[String(item.value)] || String(item.value));
  }
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

const hideSuggestions = () => {
  overlay.close(SUGGEST_KEY);
  suggestState.value = {
    isOpen: false, items: [], activeIndex: 0, from: 0, to: 0, mode: "field",
  };
};

const updateSuggestions = () => {
  const node = exprInput.value;
  if (!node) return;
  if (!node.value) {
    hideSuggestions();
    return;
  }
  const result = query.suggest(
    node.value, node.selectionStart ?? node.value.length, queryIndex());
  suggestState.value = {
    isOpen: true,
    items: result.items || [],
    activeIndex: 0,
    from: result.from,
    to: result.to,
    mode: result.mode,
  };
  void nextTick(() => {
    overlay.open(SUGGEST_KEY, {
      trigger: node,
      keep: [POPOVER_KEY],
      placement: { align: "start", gap: 6, matchWidth: true, fit: true },
    });
  });
};

const acceptSuggestion = (index?: number) => {
  const node = exprInput.value;
  const item = suggestState.value.items[
    index === undefined ? suggestState.value.activeIndex : index];
  if (!node || !item) return;
  const insert = item.insert || item.value;
  replaceRange(suggestState.value.from, suggestState.value.to, insert);
  hideSuggestions();
  applyDebounced();
  if (/(:|\(|\s)$/.test(insert)) updateSuggestions();
};

const onExpressionInput = () => {
  applyDebounced();
  updateSuggestions();
};

const applyDebounced = debounce(() => {
  applyFilter(exprValue.value);
}, 250);

const onKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === "Escape") {
    if (suggestState.value.isOpen) {
      event.preventDefault();
      event.stopPropagation();
      hideSuggestions();
      return;
    }
    hideSuggestions();
    return;
  }
  if (suggestState.value.isOpen && suggestState.value.items.length
    && (event.key === "Tab" || event.key === "Enter")) {
    event.preventDefault();
    acceptSuggestion(suggestState.value.activeIndex);
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    applyDebounced.cancel();
    hideSuggestions();
    applyFilter(exprValue.value);
  }
};

const onKeyup = (event: KeyboardEvent) => {
  if (["ArrowLeft", "ArrowRight", "Home", "End"].indexOf(event.key) >= 0) {
    updateSuggestions();
  }
};

let blurTimer: ReturnType<typeof setTimeout> | null = null;

const onBlur = () => {
  if (blurTimer !== null) clearTimeout(blurTimer);
  blurTimer = setTimeout(() => hideSuggestions(), 120);
};

const openPopover = () => {
  exprValue.value = store.state.filterSource;
  overlay.open(POPOVER_KEY, { trigger: byId(UI_IDS.filterBtn) });
  void nextTick(() => {
    const node = exprInput.value;
    if (!node) return;
    node.focus();
    node.select();
  });
};

const toggle = () => {
  if (overlay.isOpen(POPOVER_KEY)) overlay.close(POPOVER_KEY);
  else openPopover();
};

const applyNow = () => {
  applyDebounced.cancel();
  applyFilter(exprValue.value);
};

const applyExample = (expr: string) => {
  exprValue.value = expr;
  applyFilter(expr);
};

const onChipInsert = (value: string) => {
  insertAtCursor(value);
  applyDebounced();
};

const onResultsScroll = () => {
  const node = resultsPanel.value;
  if (!node) return;
  if (node.scrollHeight - node.scrollTop - node.clientHeight < 40) {
    visibleLimit.value = Math.min(
      hitNodeIndexes.value.length, visibleLimit.value + RESULT_LIMIT);
  }
};

const pickNode = (id: string) => {
  overlay.close(POPOVER_KEY);
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
  overlay.register(POPOVER_KEY, {
    id: "filterPopover",
    triggerId: UI_IDS.filterBtn,
    group: "pop",
    onHide: () => {
      hideSuggestions();
    },
  });
  overlay.register(SUGGEST_KEY, {
    id: "filterSuggestions",
    group: "menu",
    keep: [POPOVER_KEY],
    onHide: () => {
      suggestState.value = {
        isOpen: false, items: [], activeIndex: 0, from: 0, to: 0, mode: "field",
      };
    },
    placement: { align: "start", gap: 6, matchWidth: true, fit: true },
  });
});

const isPopoverOpen = computed(() => overlay.isOpen(POPOVER_KEY));
const isSuggestOpen = computed(() => overlay.isOpen(SUGGEST_KEY));
</script>

<template>
  <div class="menu-wrap">
    <button id="filterBtn" class="btn filter-btn" type="button" aria-haspopup="dialog"
            :aria-expanded="isPopoverOpen" aria-controls="filterPopover"
            :title="t('filterBtnTitle')" :class="{ 'is-on': hasAppliedFilter }"
            @click.stop="toggle">
      <AppIcon name="filter" class="ico" />
      <span class="btn-label">{{ t("filterBtn") }}</span>
      <span id="filterBadge" class="badge badge-solid badge-num"
            :hidden="!hasAppliedFilter">{{ badgeCount }}</span>
    </button>

    <div id="filterPopover" class="filter-panel surface popover" role="dialog"
         :aria-label="t('filterBtn')" :hidden="!isPopoverOpen">
      <div class="filter-row">
        <div class="filter-input-wrap">
          <input id="filterExpr" ref="exprInput" v-model="exprValue" class="input input-mono"
                 type="text" spellcheck="false" autocomplete="off" role="combobox"
                 aria-autocomplete="list" :aria-expanded="isSuggestOpen"
                 aria-controls="filterSuggestions"
                 :class="{ 'is-error': !!store.state.filterError }"
                 :placeholder="t('filterPlaceholder')" :aria-label="t('filterPlaceholder')"
                 @input="onExpressionInput" @click="updateSuggestions" @keyup="onKeyup"
                 @keydown="onKeydown" @blur="onBlur">
          <div id="filterSuggestions" class="filter-suggest surface popover" role="listbox"
               :hidden="!isSuggestOpen">
            <template v-if="suggestState.items.length">
              <button v-for="(item, index) in suggestState.items" :key="`${item.value}-${index}`"
                      class="suggest-item row row-sm"
                      :class="{ 'is-active': index === suggestState.activeIndex }"
                      type="button" role="option" @mousedown.prevent="acceptSuggestion(index)">
                <span class="sg-value">{{ suggestShown(item) }}</span>
                <span v-if="suggestLabel(item)" class="sg-label">{{ suggestLabel(item) }}</span>
                <span v-if="item.count" class="sg-count">
                  {{ t("suggestCount", { n: item.count }) }}
                </span>
              </button>
            </template>
            <div v-else class="suggest-empty popover-empty">{{ t("suggestEmpty") }}</div>
          </div>
        </div>
        <button id="filterApply" class="btn" type="button" @click="applyNow">
          {{ t("filterApply") }}
        </button>
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
          <button v-for="op in OPS" :key="op" class="filter-chip btn btn-sm btn-mono"
                  type="button" :data-insert="op === '(' || op === ')' ? op : ` ${op} `"
                  @click="onChipInsert(op === '(' || op === ')' ? op : ` ${op} `)">
            {{ op }}
          </button>
        </div>
      </div>
      <div class="filter-section">
        <p class="filter-label">{{ t("filterExamples") }}</p>
        <div id="filterExampleChips" class="filter-chips">
          <button v-for="example in EXAMPLES" :key="example.key"
                  class="filter-chip btn btn-sm btn-mono" type="button"
                  :data-expr="example.expr" @click="applyExample(example.expr)">
            {{ t(example.key) }}
          </button>
        </div>
      </div>

      <div id="filterResults" class="filter-results"
           :hidden="!hasAppliedFilter || !store.state.filterSource.trim()">
        <div class="filter-results-title">
          {{ t("filterResults", { n: hitNodeIndexes.length }) }}
          <span class="filter-count">
            {{ t("filterCount", { n: hitNodeIndexes.length, total: graph.nodes.length }) }}
          </span>
        </div>
        <div v-if="!hitNodeIndexes.length" class="filter-results-empty">
          {{ t("filterResultsEmpty") }}
        </div>
        <div v-else ref="resultsPanel" class="filter-results-list"
             @scroll.passive="onResultsScroll">
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
