import { ref } from "vue";
import { keys, readJson, writeJson } from "./storage";

const stored = readJson<boolean>(keys.infer);

export const inferEnabled = ref(stored === null ? true : stored === true);

export const toggleInfer = (): void => {
  inferEnabled.value = !inferEnabled.value;
  writeJson(keys.infer, inferEnabled.value);
};
