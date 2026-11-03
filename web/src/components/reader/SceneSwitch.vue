<script setup lang="ts">
import { t } from "../../i18n";
import type { SceneView } from "../../types/beats";
import AppIcon from "../ui/AppIcon.vue";
import JumpLink from "./JumpLink.vue";

defineProps<{ scene: SceneView }>();
</script>

<template>
  <div class="scene-switch">
    <span class="scene-label">{{ t("sceneSwitch") }}</span>
    <span v-if="scene.name" class="scene-name">{{ scene.name }}</span>
    <span v-if="scene.key" class="scene-key">{{ scene.key }}</span>
    <template v-if="scene.next && !scene.after">
      <AppIcon name="arrow-right" class="scene-arrow" />
      <span class="scene-next">{{ scene.next }}</span>
    </template>
    <template v-if="scene.after">
      <span class="scene-label">{{ t("battleAfterStory") }}</span>
      <JumpLink :jump="{ target: scene.after, label: '' }" />
    </template>
  </div>
</template>
