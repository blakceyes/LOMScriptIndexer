import { ref } from "vue";
import { isOverlayRail } from "../composables/useLayout";
import { data } from "../data/schema";
import { text } from "../data/text";
import { byId } from "../lib/dom";
import { applyFilter, resetFilterContext } from "../lib/filter";
import { overlay } from "../lib/overlay";
import { searchIndex } from "../lib/search";
import { UI_IDS } from "../ui/ids";
import { lang } from "./lang";
import { hideBranchPreview, hideLookup } from "./panels";
import { store } from "./store";

export const railOpen = ref(false);

const sync = (): void => {
  document.body.classList.toggle("rail-open", railOpen.value);
};

export const hideRail = (): void => {
  railOpen.value = false;
  sync();
};

export const openRail = (): void => {
  if (!isOverlayRail()) return;
  railOpen.value = true;
  sync();
  overlay.open("rail", { trigger: byId(UI_IDS.railToggle) });
};

export const closeRail = (): void => {
  if (overlay.isOpen("rail")) overlay.close("rail");
  else hideRail();
};

export const toggleRail = (): void => {
  if (railOpen.value) closeRail();
  else openRail();
};

let langToken = 0;

export const switchLang = async (id: string): Promise<void> => {
  if (!id) return;
  const token = ++langToken;
  const content = data.meta.langs.indexOf(id) >= 0 ? id : store.textLang();
  const ok = await text.ensureHead(content);
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
