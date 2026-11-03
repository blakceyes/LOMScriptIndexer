<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { text } from "../../data/text";
import { t } from "../../i18n";
import { debounce, rafBatch } from "../../lib/dom";
import { overlay } from "../../lib/overlay";
import { searchIndex, type SearchHit } from "../../lib/search";
import { store } from "../../state/store";
import { progress } from "../../state/toast";
import { focusText } from "../../state/ui";
import AppIcon from "../ui/AppIcon.vue";
import FilterPanel from "./FilterPanel.vue";
import SearchResults from "./SearchResults.vue";

const PAGE = 50;
const SCROLL_GAP = 96;

const input = ref<HTMLInputElement | null>(null);
const query = ref("");
const hits = ref<SearchHit[]>([]);
const total = ref(0);
const outside = ref(0);
const rendered = ref(0);

let lastQuery = "";
let renderedQuery = "";
let renderedFilterSet: Set<number> | null = null;
let stale = true;
let warming: Promise<unknown> | null = null;
let warmingLang = "";

const openState = ref(false);

const scoped = () => !!store.state.filterSet;

const show = () => {
  overlay.open("searchResults", {
    trigger: input.value,
    placement: { align: "start", gap: 8, matchWidth: true, fit: true },
  });
  openState.value = true;
};

const hide = () => {
  overlay.close("searchResults");
  openState.value = false;
};

const loadingText = () => {
  const state = text.progress();
  if (state.done) return "";
  return t("searchLoadingText", { loaded: state.loaded, total: state.total });
};

const noteText = () => {
  const loading = loadingText();
  if (loading) return loading;
  return scoped() ? t("searchScoped") : "";
};

const messageText = (value: string) => {
  if (value.length < 2) return t("searchTooShort");
  if (hits.value.length) return "";
  if (!text.progress().done) return "";
  return t(scoped() ? "searchNoHit" : "searchEmpty");
};

const status = ref({ count: "", note: "", outside: "", message: "" });

const updateStatus = (value: string) => {
  status.value = {
    count: t("searchCount", { n: hits.value.length }),
    note: noteText(),
    outside: outside.value > 0 ? t("searchOutside", { n: outside.value }) : "",
    message: messageText(value),
  };
};

const render = (value: string, keepScroll = false) => {
  const result = searchIndex.search(value);
  hits.value = result.hits;
  total.value = result.total;
  outside.value = result.outside;
  const limit = keepScroll ? Math.max(rendered.value, PAGE) : PAGE;
  rendered.value = Math.min(hits.value.length, limit);
  updateStatus(value);
  renderedQuery = value;
  renderedFilterSet = store.state.filterSet;
  stale = false;
};

const appendMore = () => {
  if (rendered.value >= hits.value.length) return;
  rendered.value = Math.min(hits.value.length, rendered.value + PAGE);
};

const clearFilter = () => {
  store.applyFilter({ source: "", set: null, error: "", loading: false });
  run();
};

const run = (): number => {
  const value = query.value.trim();
  lastQuery = value;
  if (!value) {
    hide();
    return 0;
  }
  const filterSet = store.state.filterSet;
  if (!stale && value === renderedQuery && filterSet === renderedFilterSet && hits.value.length) {
    updateStatus(value);
    show();
    return hits.value.length;
  }
  render(value);
  show();
  return hits.value.length;
};

const refresh = rafBatch(() => {
  const value = query.value.trim();
  if (value.length < 2) return;
  lastQuery = value;
  if (!openState.value) {
    stale = true;
    return;
  }
  const result = searchIndex.search(value);
  if (result.total !== total.value || !hits.value.length) {
    render(value, true);
    return;
  }
  updateStatus(value);
});

const warmFullText = (lang: string) => {
  if (warming && warmingLang === lang) return warming;
  warmingLang = lang;
  const chain = text.ensureAll(lang, (loaded, size) => {
    progress(t("searchLoadingText", { loaded, total: size }));
    refresh();
  }).then(() => {
    if (warming === chain) {
      warming = null;
      warmingLang = "";
    }
    progress("");
    if (query.value.trim()) run();
  }).catch(() => {
    if (warming === chain) {
      warming = null;
      warmingLang = "";
    }
    progress("");
  });
  warming = chain;
  return chain;
};

const perform = () => {
  run();
  const value = query.value.trim();
  const state = text.progress();
  if (value.length < 2 || state.done) return;
  progress(t("searchLoadingText", { loaded: state.loaded, total: state.total }));
  warmFullText(store.textLang());
};

const onInput = debounce(perform, 160);

const choose = (): boolean => {
  const hit = hits.value[0];
  if (!hit) return false;
  hide();
  focusText(hit.id, lastQuery);
  store.select(hit.id, { history: true });
  return true;
};

const pick = (hit: SearchHit) => {
  hide();
  focusText(hit.id, lastQuery);
  store.select(hit.id, { history: true });
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    hide();
    input.value?.blur();
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    choose();
  }
};

const onFocus = () => {
  if (query.value.trim()) perform();
};

const focusSearch = () => input.value?.focus();

const reset = () => {
  hits.value = [];
  total.value = 0;
  outside.value = 0;
  rendered.value = 0;
  renderedQuery = "";
  renderedFilterSet = null;
  stale = true;
  progress("");
  hide();
};

watch(() => store.state.lang, () => {
  reset();
});

onMounted(() => {
  overlay.register("searchResults", {
    id: "searchResults",
    triggerId: "search",
    group: "menu",
    placement: { align: "start", gap: 8, matchWidth: true, fit: true },
    onHide: () => {
      openState.value = false;
    },
  });
});

defineExpose({ focusSearch, reset, refresh });
</script>

<template>
  <div class="searchwrap">
    <div class="search-field">
      <AppIcon name="search" class="search-icon" />
      <input id="search" v-model="query" class="search-input" type="search" autocomplete="off"
             spellcheck="false" role="combobox" :aria-expanded="openState" aria-controls="searchResults"
             :placeholder="t('searchPlaceholder')" :title="t('searchTitle')" :aria-label="t('searchPlaceholder')"
             @input="onInput" @focus="onFocus" @keydown="onKeydown">
      <kbd class="search-key" aria-hidden="true">/</kbd>
      <SearchResults :hits="hits" :rendered="rendered" :outside="outside" :query="lastQuery"
                     :status="status" :hidden="!openState" :scoped="scoped()"
                     @pick="pick" @more="appendMore" @clear-filter="clearFilter" />
    </div>

    <FilterPanel />
  </div>
</template>
