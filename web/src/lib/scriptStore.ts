import { pinia } from "../stores";
import { useScriptStore } from "../stores/script";

type ScriptStore = ReturnType<typeof useScriptStore>;

let handle: ScriptStore | null = null;

export const scriptStore = (): ScriptStore => (handle ??= useScriptStore(pinia));
