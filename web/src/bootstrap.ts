import { createApp } from "vue";
import "./styles/00-tokens.css";
import "./styles/10-base.css";
import "./styles/20-shell.css";
import "./styles/30-controls.css";
import "./styles/40-reader.css";
import "./styles/50-panels.css";
import "./styles/60-responsive.css";
import "./styles/90-motion.css";
import App from "./components/App.vue";
import { graph } from "./data/graph";
import { text } from "./data/text";
import { applyFilter } from "./lib/filter";
import { searchIndex } from "./lib/search";
import { readHash } from "./composables/useHashRoute";
import { store } from "./state/store";

export const start = (): void => {
  const app = createApp(App);
  app.mount("#app");

  store.restore();

  const startId = readHash() || store.state.selectedId;
  if (startId && graph.nodeById.has(startId)) {
    store.select(startId, { history: false });
  }

  text.ensureHead(store.textLang()).then(() => {
    searchIndex.invalidate();
    if (store.state.filterSource.trim()) applyFilter(store.state.filterSource);
  });
};
