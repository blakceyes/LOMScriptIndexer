<script setup lang="ts">
import { ioText, toastText } from "../../state/toast";
</script>

<template>
  <div id="toast" class="toast" role="status" aria-live="polite" :hidden="!toastText">{{ toastText }}</div>
  <div id="ioStatus" class="io-status" role="status" aria-live="polite" :hidden="!ioText">{{ ioText }}</div>
</template>
