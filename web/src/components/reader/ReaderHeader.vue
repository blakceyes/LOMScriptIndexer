<script setup lang="ts">
import { computed } from "vue";
import { graph } from "../../data/graph";
import { chapterTitle, t, timeText } from "../../i18n";
import { byId } from "../../lib/dom";
import { overlay } from "../../lib/overlay";
import { store } from "../../state/store";
import { toast } from "../../state/toast";
import { UI_IDS } from "../../ui/ids";
import AppIcon from "../ui/AppIcon.vue";
import EntryBadge from "../ui/EntryBadge.vue";
import NavMenu from "./NavMenu.vue";

const node = computed(() => store.selected());

const canBack = computed(() => store.state.hIndex > 0);

const canForward = computed(() => store.state.hIndex < store.state.history.length - 1);

const bookmarked = computed(() => {
  void store.bookmarkTick.value;
  return !!node.value && store.isBookmarked(node.value.id);
});

const navOpen = computed(() => overlay.isOpen("navMenu"));

const chapter = computed(() => (node.value ? chapterTitle(graph.chapterOf(node.value)) : ""));

const toggleNav = (event: MouseEvent) => {
  event.stopPropagation();
  if (overlay.isOpen("navMenu")) overlay.close("navMenu");
  else overlay.open("navMenu", { trigger: byId(UI_IDS.navBtn) });
};

const toggleBookmark = () => {
  const current = node.value;
  if (!current) return;
  const on = store.toggleBookmark(current.id);
  toast(t(on ? "bookmarkAdded" : "bookmarkRemoved"));
};
</script>

<template>
  <header class="reader-head">
    <div class="reader-title">
      <div class="reader-title-row">
        <div class="reader-headline">
          <p id="nodeChapter" class="crumb" :hidden="!node">
            <template v-if="node">
              {{ chapter }}<EntryBadge :node="node" /><span
                v-if="typeof node.time === 'number'" class="crumb-time">{{ ` · ${timeText(node.time)}` }}</span>
            </template>
          </p>
          <h2 id="nodeTitle" class="node-title" :title="node ? node.id : ''">
            {{ node ? node.id : t("readerEmptyTitle") }}
          </h2>
        </div>
        <div class="reader-actions">
          <button id="backBtn" class="btn btn-icon btn-sm" type="button" :title="t('backTitle')"
                  :disabled="!canBack" @click="store.back()">
            <AppIcon name="back" />
          </button>
          <button id="forwardBtn" class="btn btn-icon btn-sm" type="button" :title="t('forwardTitle')"
                  :disabled="!canForward" @click="store.forward()">
            <AppIcon name="forward" />
          </button>
          <div class="menu-wrap reader-nav" id="navWrap">
            <button id="navBtn" class="btn btn-icon btn-sm" :class="{ 'is-on': navOpen }" type="button"
                    aria-haspopup="true" :aria-expanded="navOpen" aria-controls="navMenu"
                    :title="t('navBtnTitle')" :disabled="!node" @click="toggleNav">
              <AppIcon name="jump" />
            </button>
            <NavMenu />
          </div>
          <button id="bookmarkBtn" class="btn btn-icon btn-sm" type="button"
                  :aria-pressed="bookmarked" :title="t(bookmarked ? 'bookmarkRemove' : 'bookmarkAdd')"
                  @click="toggleBookmark">
            <AppIcon name="star" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
