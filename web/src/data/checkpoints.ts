import type { CheckpointModel } from "../types/condition";
import { loadScript } from "../lib/browser";
import { dataset } from "./dataset";

const pendingLoads = new Map<number, Promise<boolean>>();

const loadShard = (index: number): Promise<boolean> => {
  if (index < 0) return Promise.resolve(false);
  const pending = pendingLoads.get(index);
  if (pending) return pending;
  const job = loadScript(dataset.assetUrl("checkpoint", { index })).catch(() => false);
  pendingLoads.set(index, job);
  return job;
};

const ensure = (key: string): Promise<boolean> => {
  const index = dataset.checkpointShardByKey[key];
  if (typeof index !== "number" || index < 0) return Promise.resolve(false);
  return loadShard(index);
};

const loadAll = (): Promise<boolean> => {
  const indices = new Set<number>();
  for (const value of Object.values(dataset.checkpointShardByKey)) {
    if (typeof value === "number" && value >= 0) indices.add(value);
  }
  const jobs = Array.from(indices, (index) => loadShard(index));
  return Promise.all(jobs).then((results) => results.every(Boolean));
};

const getByKey = (key: string, kind?: string): CheckpointModel | null => {
  const all = dataset.getCheckpoints();
  const checkpoint = all && key ? all[key] : null;
  if (!checkpoint) return null;
  if (!kind || checkpoint.kind === kind) return checkpoint;
  const variants = Array.isArray(checkpoint.variants) ? checkpoint.variants : [];
  for (const variant of variants) {
    if (variant && variant.kind === kind) return variant;
  }
  return null;
};

export const checkpoints = { ensure, getByKey, loadAll };
