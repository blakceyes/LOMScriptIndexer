import { reactive } from "vue";
import { t } from "../i18n";
import { loadScript } from "../lib/dom";
import { toast } from "../state/toast";
import type { BeatRow } from "../types/beats";
import type { ShardState, TextPack, TextProgress } from "../types/text";
import { convert } from "./convert";
import { data } from "./schema";

const SHARD_TIMEOUT = 30000;

const meta = data.meta;
const source = meta.textSource || meta.langs[0] || "";
const legacy = !!meta.fullText || !Object.keys(meta.shardOf).length || meta.shards.length === 0;
const keys = meta.shards.map((shard) => shard.key);

const physical = reactive({
  head: "idle" as ShardState,
  shards: {} as Record<string, ShardState>,
  headError: "",
  shardError: "",
});

let headPromise: Promise<boolean> | null = null;
const pending: Record<string, Promise<boolean> | undefined> = Object.create(null);

type View = {
  pack: TextPack | null;
  characters: Record<string, string> | null;
  titles: Record<string, string> | null;
  names: Record<string, Record<string, string>> | null;
  edgeLabels: Record<string, string> | null;
  stories: Record<string, BeatRow[]>;
};

const views: Record<string, View> = Object.create(null);
const queue: { lang: string; key: string }[] = [];
let queueBusy = false;

const rawPack = (): TextPack | null => (data.textPack() as Record<string, TextPack>)[source] || null;

const rawStories = (): Record<string, BeatRow[]> | null => {
  const current = rawPack();
  return current && current.stories ? current.stories : null;
};

const viewOf = (lang: string): View => {
  let view = views[lang];
  if (!view) {
    view = views[lang] = {
      pack: null,
      characters: null,
      titles: null,
      names: null,
      edgeLabels: null,
      stories: Object.create(null) as Record<string, BeatRow[]>,
    };
  }
  return view;
};

const converted = (lang: string): boolean => lang !== source && convert.ready(lang);

const ensureConvert = (lang: string): Promise<boolean> => {
  if (lang === source) return Promise.resolve(true);
  if (convert.ready(lang)) return Promise.resolve(true);
  return convert.ensure(lang);
};

const loadHead = (): Promise<boolean> => {
  physical.head = "loading";
  const src = legacy
    ? data.asset("textFull", { lang: source })
    : data.asset("textHead", { lang: source });
  headPromise = loadScript(src).then(() => {
    if (!rawPack()) throw new Error(`text pack ${source} is empty`);
    physical.head = "ready";
    physical.headError = "";
    if (legacy) {
      for (const key of keys) physical.shards[key] = "ready";
    }
    return true;
  }).catch((error: unknown) => {
    physical.head = "failed";
    physical.headError = error instanceof Error ? error.message : String(error);
    toast(t("langFailed", { lang: source }));
    return false;
  });
  return headPromise;
};

const ensureHead = (lang: string): Promise<boolean> => {
  const current = physical.head === "ready"
    ? Promise.resolve(true)
    : (physical.head === "loading" && headPromise ? headPromise : loadHead());
  return Promise.all([current, ensureConvert(lang)]).then(([headOk, convOk]) => {
    if (!headOk) return false;
    if (!convOk && lang !== source) {
      toast(t("langFailed", { lang }));
      return false;
    }
    return true;
  });
};

const ensureShard = (lang: string, key: string): Promise<boolean> => {
  if (!key) return Promise.resolve(true);
  if (legacy) return Promise.resolve(true);
  if (physical.shards[key] === "ready") return Promise.resolve(true);
  if (pending[key]) return pending[key];
  physical.shards[key] = "loading";
  pending[key] = loadScript(data.asset("textShard", { lang: source, key }))
    .then(() => {
      physical.shards[key] = "ready";
      delete pending[key];
      return true;
    }).catch((error: unknown) => {
      physical.shards[key] = "failed";
      physical.shardError = error instanceof Error ? error.message : String(error);
      delete pending[key];
      return false;
    });
  return pending[key];
};

const hasStory = (id: string): boolean => {
  const stories = rawStories();
  return !!stories && Object.prototype.hasOwnProperty.call(stories, id);
};

const ensureStory = (lang: string, id: string): Promise<boolean> => ensureHead(lang).then(() => {
  if (hasStory(id)) return true;
  const key = meta.shardOf[id];
  if (!key) return false;
  return ensureShard(lang, key).then(() => hasStory(id));
}).catch(() => false);

const story = (lang: string, id: string): BeatRow[] | null => {
  const stories = rawStories();
  if (!stories) return null;
  const beats = stories[id];
  if (beats === undefined) return null;
  if (!converted(lang)) return beats;
  const view = viewOf(lang);
  let hit = view.stories[id];
  if (hit === undefined) {
    hit = convert.rows(lang, beats) || [];
    view.stories[id] = hit;
  }
  return hit;
};

const pack = (lang: string): TextPack | null => {
  const raw = rawPack();
  if (!raw) return null;
  if (!converted(lang)) return raw;
  const view = viewOf(lang);
  if (!view.pack) {
    view.pack = {
      schema: raw.schema,
      lang,
      source: raw.lang,
      missing: raw.missing,
      missingKeys: raw.missingKeys || [],
      shardKeys: raw.shardKeys || [],
      fullText: raw.fullText,
      characters: {},
      titles: {},
      names: {},
      edgeLabels: {},
      stories: view.stories,
    };
  }
  const result = view.pack;
  if (!result.characters || !Object.keys(result.characters).length) {
    result.characters = convert.group(lang, raw.characters || {});
  }
  if (!result.titles || !Object.keys(result.titles).length) {
    result.titles = convert.group(lang, raw.titles || {});
  }
  if (!result.names || !Object.keys(result.names).length) {
    result.names = convert.group(lang, raw.names || {});
  }
  if (!result.edgeLabels || !Object.keys(result.edgeLabels).length) {
    result.edgeLabels = convert.group(lang, raw.edgeLabels || {});
  }
  const stories = raw.stories || {};
  for (const id of Object.keys(stories)) {
    if (view.stories[id] === undefined) view.stories[id] = convert.rows(lang, stories[id]) || [];
  }
  return result;
};

const tableOf = (lang: string, field: "characters" | "titles" | "edgeLabels"): Record<string, string> => {
  const raw = rawPack();
  if (!raw) return {};
  const value = raw[field] || {};
  if (!converted(lang)) return value;
  const view = viewOf(lang);
  const bucket = view[field];
  if (!bucket || !Object.keys(bucket).length) {
    view[field] = convert.group(lang, value);
    return view[field] as Record<string, string>;
  }
  return bucket;
};

const characters = (lang: string): Record<string, string> => tableOf(lang, "characters");

const titles = (lang: string): Record<string, string> => tableOf(lang, "titles");

const names = (lang: string): Record<string, Record<string, string>> => {
  const raw = rawPack();
  if (!raw) return {};
  const value = raw.names || {};
  if (!converted(lang)) return value;
  const view = viewOf(lang);
  if (!view.names || !Object.keys(view.names).length) {
    view.names = convert.group(lang, value);
  }
  return view.names;
};

const edgeLabels = (lang: string): Record<string, string> => tableOf(lang, "edgeLabels");

const edgeLabel = (lang: string, edgeId: string, fallback: string): string => (
  edgeLabels(lang)[edgeId] || fallback || ""
);

const progress = (lang: string): TextProgress => {
  void lang;
  const total = legacy ? 0 : keys.length;
  let loaded = 0;
  let failed = 0;
  for (const key of keys) {
    const status = physical.shards[key];
    if (status === "ready") loaded++;
    else if (status === "failed") failed++;
  }
  return {
    head: physical.head,
    loaded,
    total,
    done: total === 0 ? physical.head === "ready" : loaded + failed >= total,
    headError: physical.headError || "",
    shardError: physical.shardError || "",
  };
};

const settleShard = (lang: string, key: string): Promise<boolean> => new Promise((resolve) => {
  const timer = setTimeout(() => {
    if (physical.shards[key] === "loading") {
      physical.shards[key] = "failed";
      physical.shardError = `timeout: ${key}`;
      delete pending[key];
    }
    resolve(false);
  }, SHARD_TIMEOUT);
  ensureShard(lang, key).then(() => {
    clearTimeout(timer);
    resolve(true);
  }, () => {
    clearTimeout(timer);
    resolve(false);
  });
});

const ensureAll = (lang: string, onProgress?: (loaded: number, total: number) => void): Promise<boolean> => (
  ensureHead(lang).then(() => {
    if (legacy) {
      if (onProgress) onProgress(1, 1);
      return true;
    }
    let index = 0;
    const step = (): Promise<boolean> => {
      if (index >= keys.length) return Promise.resolve(true);
      const key = keys[index++];
      return settleShard(lang, key).then(() => {
        if (onProgress) onProgress(index, keys.length);
        return step();
      });
    };
    return step();
  })
);

const pump = (): void => {
  if (queueBusy || !queue.length) return;
  queueBusy = true;
  const job = queue.shift() as { lang: string; key: string };
  ensureHead(job.lang)
    .then(() => ensureShard(job.lang, job.key))
    .catch(() => false)
    .then(() => {
      queueBusy = false;
      pump();
    });
};

const prefetch = (lang: string, ids: string[], limit?: number): number => {
  if (legacy) return 0;
  const max = typeof limit === "number" ? limit : 2;
  if (max <= 0) return 0;
  const seen: Record<string, number> = Object.create(null);
  let queued = 0;
  for (const id of ids || []) {
    if (queued >= max) break;
    const key = meta.shardOf[id];
    if (!key || seen[key]) continue;
    if (physical.shards[key] === "ready" || physical.shards[key] === "loading") continue;
    if (pending[key]) continue;
    seen[key] = 1;
    queue.push({ lang, key });
    queued++;
  }
  pump();
  return queued;
};

const shardState = (lang: string, id: string): ShardState => {
  void lang;
  const key = meta.shardOf[id];
  if (!key) return legacy ? "ready" : "missing";
  return physical.shards[key] || "idle";
};

const retry = (lang: string, id: string): Promise<boolean> => {
  const key = meta.shardOf[id];
  if (key && physical.shards[key] === "failed") delete physical.shards[key];
  return ensureStory(lang, id);
};

export const text = {
  characters,
  edgeLabel,
  ensureAll,
  ensureHead,
  ensureStory,
  names,
  pack,
  prefetch,
  progress,
  retry,
  shardState,
  story,
  titles,
};
