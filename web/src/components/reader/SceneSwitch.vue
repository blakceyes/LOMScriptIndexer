<script setup lang="ts">
import { t } from "../../i18n";
import type { SceneView } from "../../types/beats";
import AppIcon from "../ui/AppIcon.vue";
import JumpLink from "./JumpLink.vue";

defineProps<{ view: SceneView }>();
</script>

<template>
  <div class="scene-switch">
    <span class="scene-label">{{ t("sceneSwitch") }}</span>
    <span v-if="view.scene" class="scene-name">{{ view.scene }}</span>
    <span v-if="view.sceneKey" class="scene-key">{{ view.sceneKey }}</span>
    <template v-if="view.nextScene && !view.afterScript">
      <AppIcon name="arrow-right" class="scene-arrow" />
      <span class="scene-next">{{ view.nextScene }}</span>
    </template>
    <template v-if="view.afterScript">
      <span class="scene-label">{{ t("battleAfterStory") }}</span>
      <JumpLink :jump="{ target: view.afterScript, dynamicSource: '' }" />
    </template>
  </div>
</template>
