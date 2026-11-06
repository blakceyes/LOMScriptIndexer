<script setup lang="ts">
import { t } from "../../i18n";
import { openLookup } from "../../state/panels";
import { revealHeld } from "../../state/reveal";
import type { MetaChip, MetaSeal } from "../../types/beats";

const props = defineProps<{ chips: MetaChip[]; method?: string }>();

const sealText = (seal: MetaSeal): string => (
  seal === "infer" ? "推" : t(seal === "true" ? "sealTrue" : "sealFalse")
);

const sealClass = (seal: MetaSeal): string | undefined => (
  seal === "infer" ? undefined : `is-${seal}`
);

const open = (chip: MetaChip, event: Event) => {
  if (!chip.target) return;
  event.stopPropagation();
  openLookup(chip.target.kind, chip.target.key, event.currentTarget as HTMLElement, props.method || chip.target.method);
};
</script>

<template>
  <div class="meta-chips">
    <template v-for="(chip, index) in chips" :key="index">
      <button v-if="chip.target" class="btn btn-sm meta-action meta-chip" type="button"
              :class="{ 'is-hidden': chip.hidden && !revealHeld }" aria-haspopup="dialog"
              :title="chip.title" :data-kind="chip.match?.kind" :data-key="chip.match?.key"
              @click="open(chip, $event)">
        <span v-if="chip.seal" class="infer-seal" :class="sealClass(chip.seal)"
              aria-hidden="true"><span>{{ sealText(chip.seal) }}</span></span>
        {{ chip.text }}
      </button>
      <span v-else class="chip-stat chip chip-sm meta-chip"
            :class="{ 'is-hidden': chip.hidden && !revealHeld }" :title="chip.title"
            :data-kind="chip.match?.kind" :data-key="chip.match?.key">
        <span v-if="chip.seal" class="infer-seal" :class="sealClass(chip.seal)"
              aria-hidden="true"><span>{{ sealText(chip.seal) }}</span></span>
        {{ chip.text }}
      </span>
    </template>
  </div>
</template>
