<script setup lang="ts">
import { computed } from "vue";
import { t } from "../../i18n";
import { typeById, typesOfGroup } from "../../state/fontTypes";
import type { FontTarget } from "../../types/font";
import TypeSpecimen from "./TypeSpecimen.vue";

const props = defineProps<{ target: FontTarget }>();

const list = computed(() => {
  if (props.target.scope === "type") return [props.target.id];
  return typesOfGroup(props.target.id).slice(0, 3).map((type) => type.id);
});

const specimenOf = (typeId: string) => typeById(typeId) || null;
</script>

<template>
  <div id="settingsPreview" class="preview">
    <template v-for="typeId in list" :key="typeId">
      <template v-if="specimenOf(typeId)">
        <div class="preview-head">
          <span class="preview-tag">{{ t(specimenOf(typeId)!.label) }}</span>
        </div>
        <div class="preview-specimen">
          <TypeSpecimen :boxes="specimenOf(typeId)!.boxes" :text="t(specimenOf(typeId)!.text)" />
        </div>
      </template>
    </template>
  </div>
</template>
