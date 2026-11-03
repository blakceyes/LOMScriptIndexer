import type { CheckpointModel } from "../types/cond";
import { loadScript } from "../lib/dom";
import { data } from "./schema";

const loading = new Map<number, Promise<boolean>>();

const load = (index: number): Promise<boolean> => {
  if (index < 0) return Promise.resolve(false);
  const hit = loading.get(index);
  if (hit) return hit;
  const job = loadScript(data.asset("checkpoint", { index })).catch(() => false);
  loading.set(index, job);
  return job;
};

const ensure = (key: string): Promise<boolean> => {
  const index = data.checkpointShards[key];
  if (typeof index !== "number" || index < 0) return Promise.resolve(false);
  return load(index);
};

const get = (key: string, method?: string): CheckpointModel | null => {
  const all = data.checkpoints();
  const model = all && key ? all[key] : null;
  if (!model) return null;
  if (!method || model.kind === method) return model;
  const variants = Array.isArray(model.variants) ? model.variants : [];
  for (const variant of variants) {
    if (variant && variant.kind === method) return variant;
  }
  return null;
};

export const checkpoints = { ensure, get };
