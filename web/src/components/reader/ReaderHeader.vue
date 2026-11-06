<script setup lang="ts">
import { computed } from "vue";
import { graph } from "../../data/graph";
import { chapterTitle, t, timeText } from "../../i18n";
import { byId } from "../../lib/browser";
import { overlay } from "../../lib/overlay";
import { inferEnabled, toggleInfer } from "../../state/infer";
import { holdReveal, releaseReveal, revealHeld } from "../../state/reveal";
import { store } from "../../state/store";
import { toast } from "../../state/toast";
import { UI_IDS } from "../../ui/ids";
import AppIcon from "../ui/AppIcon.vue";
import EntryBadge from "../ui/EntryBadge.vue";
import NavMenu from "./NavMenu.vue";

const selectedScript = computed(() => store.selected());

const canBack = computed(() => store.state.historyIndex > 0);

const canForward = computed(() => (
  store.state.historyIndex < store.state.history.length - 1
));

const isBookmarked = computed(() => {
  void store.bookmarkTick.value;
  return !!selectedScript.value && store.isBookmarked(selectedScript.value.id);
});

const navOpen = computed(() => overlay.isOpen("navMenu"));

const inferOn = computed(() => inferEnabled.value);

const revealOn = computed(() => revealHeld.value);

const pressReveal = (event: PointerEvent) => {
  const target = event.currentTarget as HTMLElement | null;
  if (target && target.setPointerCapture) target.setPointerCapture(event.pointerId);
  holdReveal();
};

const chapterTitleText = computed(() => (
  selectedScript.value ? chapterTitle(graph.chapterOf(selectedScript.value)) : ""
));

const toggleNav = (event: MouseEvent) => {
  event.stopPropagation();
  if (overlay.isOpen("navMenu")) overlay.close("navMenu");
  else overlay.open("navMenu", { trigger: byId(UI_IDS.navBtn) });
};

const toggleBookmark = () => {
  const current = selectedScript.value;
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
          <p id="nodeChapter" class="crumb" :hidden="!selectedScript">
            <template v-if="selectedScript">
              {{ chapterTitleText }}<EntryBadge :node="selectedScript" /><span
                v-if="typeof selectedScript.time === 'number'"
                class="crumb-time">{{ ` · ${timeText(selectedScript.time)}` }}</span>
            </template>
          </p>
          <h2 id="nodeTitle" class="node-title"
              :title="selectedScript ? selectedScript.id : ''">
            {{ selectedScript ? selectedScript.id : t("readerEmptyTitle") }}
          </h2>
        </div>
        <div class="reader-actions">
          <span class="tip-host" :title="t('backTitle')">
            <button id="backBtn" class="btn btn-icon btn-sm" type="button"
                    :title="t('backTitle')" :aria-label="t('backTitle')"
                    :disabled="!canBack" @click="store.back()">
              <AppIcon name="back" />
            </button>
          </span>
          <span class="tip-host" :title="t('forwardTitle')">
            <button id="forwardBtn" class="btn btn-icon btn-sm" type="button"
                    :title="t('forwardTitle')" :aria-label="t('forwardTitle')"
                    :disabled="!canForward" @click="store.forward()">
              <AppIcon name="forward" />
            </button>
          </span>
          <span class="tip-host" :title="t('inferBtnTitle')">
            <button id="inferBtn" class="btn btn-icon btn-sm" :class="{ 'is-on': inferOn }"
                    type="button" :aria-pressed="inferOn" :title="t('inferBtnTitle')"
                    :aria-label="t('inferBtnTitle')" @click="toggleInfer">
              <span class="infer-toggle-mark" aria-hidden="true">推</span>
            </button>
          </span>
          <span class="tip-host" :title="t('revealBtnTitle')">
            <button id="revealBtn" class="btn btn-icon btn-sm" :class="{ 'is-on': revealOn }"
                    type="button" :title="t('revealBtnTitle')"
                    :aria-label="t('revealBtnTitle')"
                    @pointerdown="pressReveal"
                    @pointerup="releaseReveal" @pointercancel="releaseReveal"
                    @pointerleave="releaseReveal" @blur="releaseReveal"
                    @keydown.space.prevent="holdReveal" @keydown.enter.prevent="holdReveal"
                    @keyup="releaseReveal">
              <AppIcon :name="revealOn ? 'eye' : 'eye-off'" />
            </button>
          </span>
          <div class="menu-wrap reader-nav" id="navWrap">
            <span class="tip-host" :title="t('navBtnTitle')">
              <button id="navBtn" class="btn btn-icon btn-sm" :class="{ 'is-on': navOpen }"
                      type="button" aria-haspopup="true" :aria-expanded="navOpen"
                      aria-controls="navMenu" :title="t('navBtnTitle')"
                      :aria-label="t('navBtnTitle')" :disabled="!selectedScript"
                      @click="toggleNav">
                <AppIcon name="jump" />
              </button>
            </span>
            <NavMenu />
          </div>
          <span class="tip-host"
                :title="t(isBookmarked ? 'bookmarkRemoveTitle' : 'bookmarkAddTitle')">
            <button id="bookmarkBtn" class="btn btn-icon btn-sm" type="button"
                    :aria-pressed="isBookmarked"
                    :aria-label="t(isBookmarked ? 'bookmarkRemoveTitle' : 'bookmarkAddTitle')"
                    :title="t(isBookmarked ? 'bookmarkRemoveTitle' : 'bookmarkAddTitle')"
                    @click="toggleBookmark">
              <AppIcon name="star" />
            </button>
          </span>
        </div>
      </div>
    </div>
  </header>
</template>
