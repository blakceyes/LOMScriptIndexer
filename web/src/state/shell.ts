import { ref } from "vue";
import { isOverlayRail } from "../composables/useLayout";
import { dataset } from "../data/dataset";
import { textStore } from "../data/text";
import { byId } from "../lib/browser";
import { applyFilter, resetFilterContext } from "../lib/filter";
import { overlay } from "../lib/overlay";
import { searchIndex } from "../lib/search";
import { UI_IDS } from "../ui/ids";
import { lang } from "./lang";
import { hideBranchPreview, hideLookup } from "./panels";
import { store } from "./store";

const CHAPTER_RAIL = "chapterRail";

export const isRailOpen = ref(false);

const syncBodyClass = (): void => {
  document.body.classList.toggle("rail-open", isRailOpen.value);
};

export const hideRail = (): void => {
  isRailOpen.value = false;
  syncBodyClass();
};

export const openRail = (): void => {
  if (!isOverlayRail()) return;
  isRailOpen.value = true;
  syncBodyClass();
  overlay.open(CHAPTER_RAIL, { trigger: byId(UI_IDS.railToggle) });
};

export const closeRail = (): void => {
  if (overlay.isOpen(CHAPTER_RAIL)) overlay.close(CHAPTER_RAIL);
  else hideRail();
};

export const toggleRail = (): void => {
  if (isRailOpen.value) closeRail();
  else openRail();
};

let langToken = 0;

export const switchLang = async (id: string): Promise<void> => {
  if (!id) return;
  const token = ++langToken;
  const content = dataset.meta.langs.indexOf(id) >= 0 ? id : store.textLang();
  const ok = await textStore.ensureHead(content);
  if (token !== langToken || !ok) return;
  if (!store.setLang(id)) return;
  lang.applyDocument(id);
  hideBranchPreview();
  hideLookup();
  overlay.close("lookup");
  searchIndex.invalidate();
  resetFilterContext();
  if (store.state.filterSource.trim()) applyFilter(store.state.filterSource);
};
