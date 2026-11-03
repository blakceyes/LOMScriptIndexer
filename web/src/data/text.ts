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
const shardKeys = meta.shards.map((shard) => shard.key);

const physical = reactive({
  head: "idle" as ShardState,
  shards: {} as Record<string, ShardState>,
  headError: "",
  shardError: "",
});

let headPromise: Promise<boolean> | null = null;
const pendingShards = new Map<string, Promise<boolean>>();

type TextTable = Record<string, string>;
type NameTable = Record<string, Record<string, string>>;

type View = {
  pack: TextPack | null;
  characters: TextTable | null;
  titles: TextTable | null;
  names: NameTable | null;
  edgeLabels: TextTable | null;
  stories: Record<string, BeatRow[]>;
};

const views = new Map<string, View>();

const viewOf = (lang: string): View => {
  let view = views.get(lang);
  if (!view) {
    view = {
      pack: null,
      characters: null,
      titles: null,
      names: null,
      edgeLabels: null,
      stories: {},
    };
    views.set(lang, view);
  }
  return view;
};

const rawPack = (): TextPack | null => (data.textPack() as Record<string, TextPack>)[source] || null;

const rawStories = (): Record<string, BeatRow[]> | null => rawPack()?.stories || null;

const converted = (lang: string): boolean => lang !== source && convert.ready(lang);

const ensureConvert = (lang: string): Promise<boolean> => {
  if (lang === source) return Promise.resolve(true);
  if (convert.ready(lang)) return Promise.resolve(true);
  return convert.ensure(lang);
};

const loadHead = (): Promise<boolean> => {
  physical.head = "loading";
  headPromise = loadScript(data.asset("textHead", { lang: source })).then(() => {
    if (!rawPack()) throw new Error(`text pack ${source} is empty`);
    physical.head = "ready";
    physical.headError = "";
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
  if (physical.shards[key] === "ready") return Promise.resolve(true);
  const pending = pendingShards.get(key);
  if (pending) return pending;
  physical.shards[key] = "loading";
  const job = loadScript(data.asset("textShard", { lang: source, key }))
    .then(() => {
      physical.shards[key] = "ready";
      pendingShards.delete(key);
      return true;
    }).catch((error: unknown) => {
      physical.shards[key] = "failed";
      physical.shardError = error instanceof Error ? error.message : String(error);
      pendingShards.delete(key);
      return false;
    });
  pendingShards.set(key, job);
  return job;
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
  const hit = view.stories[id];
  if (hit !== undefined) return hit;
  const next = convert.rows(lang, beats) || [];
  view.stories[id] = next;
  return next;
};

type TableKey = "characters" | "titles" | "edgeLabels";

const tableOf = (lang: string, key: TableKey): TextTable => {
  const raw = rawPack();
  if (!raw) return {};
  const value = raw[key] || {};
  if (!converted(lang)) return value;
  const view = viewOf(lang);
  const cached = view[key];
  if (cached) return cached;
  const next = convert.group(lang, value);
  view[key] = next;
  return next;
};

const characters = (lang: string): TextTable => tableOf(lang, "characters");

const titles = (lang: string): TextTable => tableOf(lang, "titles");

const edgeLabels = (lang: string): TextTable => tableOf(lang, "edgeLabels");

const names = (lang: string): NameTable => {
  const raw = rawPack();
  if (!raw) return {};
  const value = raw.names || {};
  if (!converted(lang)) return value;
  const view = viewOf(lang);
  if (view.names) return view.names;
  view.names = convert.group(lang, value);
  return view.names;
};

const edgeLabel = (lang: string, edgeId: string, fallback: string): string => (
  edgeLabels(lang)[edgeId] || fallback || ""
);

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
      characters: {},
      titles: {},
      names: {},
      edgeLabels: {},
      stories: view.stories,
    };
  }
  const result = view.pack;
  result.characters = characters(lang);
  result.titles = titles(lang);
  result.names = names(lang);
  result.edgeLabels = edgeLabels(lang);
  const stories = raw.stories || {};
  for (const id of Object.keys(stories)) {
    if (view.stories[id] === undefined) view.stories[id] = convert.rows(lang, stories[id]) || [];
  }
  return result;
};

const progress = (_lang: string): TextProgress => {
  const total = shardKeys.length;
  let loaded = 0;
  let failed = 0;
  for (const key of shardKeys) {
    const status = physical.shards[key];
    if (status === "ready") loaded++;
    else if (status === "failed") failed++;
  }
  return {
    head: physical.head,
    loaded,
    total,
    done: physical.head === "ready" && (total === 0 || loaded + failed >= total),
    headError: physical.headError || "",
    shardError: physical.shardError || "",
  };
};

const settleShard = (lang: string, key: string): Promise<boolean> => new Promise((resolve) => {
  const timer = setTimeout(() => {
    if (physical.shards[key] === "loading") {
      physical.shards[key] = "failed";
      physical.shardError = `timeout: ${key}`;
      pendingShards.delete(key);
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
  ensureHead(lang).then(async () => {
    for (let index = 0; index < shardKeys.length; index++) {
      await settleShard(lang, shardKeys[index]);
      if (onProgress) onProgress(index + 1, shardKeys.length);
    }
    return true;
  })
);

const shardState = (_lang: string, id: string): ShardState => {
  const key = meta.shardOf[id];
  if (!key) return "missing";
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
  progress,
  retry,
  shardState,
  story,
  titles,
};
