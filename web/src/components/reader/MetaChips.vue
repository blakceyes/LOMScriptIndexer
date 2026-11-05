<script setup lang="ts">
import { openLookup } from "../../state/panels";
import type { MetaChip } from "../../types/beats";
import AppIcon from "../ui/AppIcon.vue";

const props = defineProps<{ chips: MetaChip[]; method?: string }>();

const open = (chip: MetaChip, event: Event) => {
  if (!chip.target) return;
  event.stopPropagation();
  openLookup(chip.target.kind, chip.target.key, event.currentTarget as HTMLElement, props.method || chip.target.method);
};
</script>

<template>
  <div class="meta-chips">
    <template v-for="(chip, index) in chips" :key="index">
      <button v-if="chip.target" class="btn btn-sm meta-action" type="button" aria-haspopup="dialog"
              :title="chip.title" :data-kind="chip.match?.kind" :data-key="chip.match?.key"
              @click="open(chip, $event)">
        <AppIcon v-if="chip.inferred" name="infer-check" class="chip-infer" />
        {{ chip.text }}
      </button>
      <span v-else class="chip-stat chip chip-sm" :title="chip.title"
            :data-kind="chip.match?.kind" :data-key="chip.match?.key">
        <AppIcon v-if="chip.inferred" name="infer-check" class="chip-infer" />
        {{ chip.text }}
      </span>
    </template>
  </div>
</template>
