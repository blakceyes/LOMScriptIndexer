import { FOLLOW_BASE, FOLLOW_GROUP } from "./fontFamilies";

export type FontGroup = { id: string; label: string };

export type SpecimenBox = { tag: string; cls?: string };

export type FontType = {
  id: string;
  group: string;
  label: string;
  font: string;
  weight: number | null;
  scale?: number;
  noLeading?: boolean;
  text: string;
  boxes: SpecimenBox[];
};

export const GROUPS: FontGroup[] = [
  { id: "prose", label: "pref.group.prose" },
  { id: "choice", label: "pref.group.choice" },
  { id: "mark", label: "pref.group.mark" },
  { id: "heading", label: "pref.group.heading" },
  { id: "interface", label: "pref.group.interface" },
  { id: "system", label: "pref.group.system" },
];

export const TYPES: FontType[] = [
  {
    id: "dialog", group: "prose", label: "pref.type.dialog", font: FOLLOW_GROUP, weight: null,
    text: "previewText", boxes: [{ tag: "div", cls: "say" }, { tag: "div", cls: "what" }],
  },
  {
    id: "speaker", group: "prose", label: "pref.type.speaker", font: "kai", weight: 500, scale: 140,
    text: "previewWho", boxes: [{ tag: "div", cls: "say" }, { tag: "span", cls: "who is-link" }],
  },
  {
    id: "narration", group: "prose", label: "pref.type.narration", font: FOLLOW_GROUP, weight: null,
    scale: 160,
    text: "previewNarration",
    boxes: [{ tag: "div", cls: "say narration" }, { tag: "div", cls: "what" }],
  },
  {
    id: "think", group: "prose", label: "pref.type.think", font: FOLLOW_GROUP, weight: null,
    text: "previewThink", boxes: [{ tag: "div", cls: "say think" }, { tag: "div", cls: "what" }],
  },
  {
    id: "lore", group: "prose", label: "pref.type.lore", font: "kai", weight: null,
    text: "previewLore",
    boxes: [{ tag: "div", cls: "lore" }, { tag: "div", cls: "lore-text" }, { tag: "p", cls: "lore-p" }],
  },
  {
    id: "excerpt", group: "prose", label: "pref.type.excerpt", font: FOLLOW_GROUP, weight: null,
    text: "previewSnippet", boxes: [{ tag: "div", cls: "drop-item" }, { tag: "span", cls: "dtext" }],
  },
  {
    id: "battle-fact", group: "prose", label: "pref.type.battle-fact", font: FOLLOW_GROUP,
    weight: null, text: "previewBattle", boxes: [{ tag: "p", cls: "battle-fact" }],
  },
  {
    id: "option", group: "choice", label: "pref.type.option", font: FOLLOW_GROUP, weight: null,
    text: "previewOption",
    boxes: [
      { tag: "div", cls: "option-head row" },
      { tag: "span", cls: "option-main" },
      { tag: "span", cls: "option-text" },
    ],
  },
  {
    id: "option-index", group: "choice", label: "pref.type.option-index", font: "mono",
    weight: null, scale: 80, noLeading: true, text: "previewIndex",
    boxes: [{ tag: "span", cls: "option-idx" }],
  },
  {
    id: "option-condition", group: "choice", label: "pref.type.option-condition",
    font: FOLLOW_GROUP, weight: null, scale: 80, text: "previewOptionCond",
    boxes: [{ tag: "span", cls: "option-cond" }],
  },
  {
    id: "branch-condition", group: "choice", label: "pref.type.branch-condition",
    font: FOLLOW_GROUP, weight: 400, text: "previewBranchCond",
    boxes: [
      { tag: "div", cls: "branch" },
      { tag: "div", cls: "branch-head row" },
      { tag: "span", cls: "cond" },
    ],
  },
  {
    id: "battle-condition", group: "choice", label: "pref.type.battle-condition",
    font: FOLLOW_GROUP, weight: 600, text: "previewBattleCond",
    boxes: [
      { tag: "div", cls: "meta-chips battle-when" },
      { tag: "span", cls: "chip-stat chip chip-sm" },
    ],
  },
  {
    id: "scene-switch", group: "mark", label: "pref.type.scene-switch", font: "sans",
    weight: null, text: "previewLabel",
    boxes: [{ tag: "div", cls: "scene-switch" }, { tag: "span", cls: "scene-name" }],
  },
  {
    id: "jump", group: "mark", label: "pref.type.jump", font: FOLLOW_GROUP, weight: null,
    noLeading: true, text: "previewJump", boxes: [{ tag: "button", cls: "jump btn btn-sm" }],
  },
  {
    id: "badge", group: "mark", label: "pref.type.badge", font: FOLLOW_GROUP, weight: null,
    noLeading: true, text: "previewBadge", boxes: [{ tag: "span", cls: "badge" }],
  },
  {
    id: "story-title", group: "heading", label: "pref.type.story-title", font: FOLLOW_GROUP,
    weight: 600, text: "previewNode", boxes: [{ tag: "h2", cls: "node-title" }],
  },
  {
    id: "panel-title", group: "heading", label: "pref.type.panel-title", font: FOLLOW_GROUP,
    weight: 600, text: "previewHeading", boxes: [{ tag: "h2", cls: "panel-title" }],
  },
  {
    id: "overlay-title", group: "heading", label: "pref.type.overlay-title", font: FOLLOW_GROUP,
    weight: 600, text: "lookupSpeaker", boxes: [{ tag: "span", cls: "overlay-title" }],
  },
  {
    id: "brand", group: "heading", label: "pref.type.brand", font: FOLLOW_GROUP, weight: 600,
    text: "appTitle", boxes: [{ tag: "div", cls: "brand-text" }, { tag: "h1" }],
  },
  {
    id: "seal", group: "heading", label: "pref.type.seal", font: FOLLOW_GROUP, weight: 600,
    noLeading: true, text: "previewSeal", boxes: [{ tag: "span", cls: "seal" }],
  },
  {
    id: "rail-title", group: "heading", label: "pref.type.rail-title", font: FOLLOW_GROUP,
    weight: 600, text: "railTitle", boxes: [{ tag: "h2", cls: "rail-title" }],
  },
  {
    id: "stat-value", group: "heading", label: "pref.type.stat-value", font: FOLLOW_GROUP,
    weight: 600, text: "previewStat",
    boxes: [{ tag: "div", cls: "stat-card" }, { tag: "span", cls: "stat-value" }],
  },
  {
    id: "empty-title", group: "heading", label: "pref.type.empty-title", font: FOLLOW_GROUP,
    weight: 600, text: "noBeatsTitle",
    boxes: [{ tag: "div", cls: "empty-state" }, { tag: "h3" }],
  },
  {
    id: "breadcrumb", group: "heading", label: "pref.type.breadcrumb", font: "mono",
    weight: null, text: "previewCrumb", boxes: [{ tag: "p", cls: "crumb" }],
  },
  {
    id: "meta", group: "heading", label: "pref.type.meta", font: "mono", weight: null,
    text: "previewMeta", boxes: [{ tag: "div", cls: "drop-item" }, { tag: "span", cls: "dmeta" }],
  },
  {
    id: "ui", group: "interface", label: "pref.type.ui", font: FOLLOW_GROUP, weight: null,
    text: "previewText", boxes: [{ tag: "p", cls: "help-desc" }],
  },
  {
    id: "ui-compact", group: "interface", label: "pref.type.ui-compact", font: FOLLOW_GROUP,
    weight: null, text: "previewUi", boxes: [{ tag: "button", cls: "btn" }],
  },
  {
    id: "ui-micro", group: "interface", label: "pref.type.ui-micro", font: FOLLOW_GROUP,
    weight: null, scale: 85, text: "previewMicro", boxes: [{ tag: "p", cls: "menu-note" }],
  },
  {
    id: "caption", group: "interface", label: "pref.type.caption", font: "mono", weight: null,
    text: "previewCaption", boxes: [{ tag: "p", cls: "sub-label" }],
  },
  {
    id: "code", group: "interface", label: "pref.type.code", font: "mono", weight: null,
    text: "previewId", boxes: [{ tag: "div", cls: "drop-item" }, { tag: "span", cls: "did" }],
  },
  {
    id: "status", group: "system", label: "pref.type.status", font: FOLLOW_GROUP, weight: null,
    text: "previewStatus", boxes: [{ tag: "p", cls: "filter-status" }],
  },
  {
    id: "loading", group: "system", label: "pref.type.loading", font: "mono", weight: null,
    text: "previewLoading", boxes: [{ tag: "span", cls: "sk-caption" }],
  },
  {
    id: "empty-text", group: "system", label: "pref.type.empty-text", font: FOLLOW_GROUP,
    weight: null, text: "previewText", boxes: [{ tag: "p", cls: "drop-empty" }],
  },
];

const GROUP_BY_ID = new Map(GROUPS.map((group) => [group.id, group]));

const TYPE_BY_ID = new Map(TYPES.map((type) => [type.id, type]));

export const groupById = (id: string): FontGroup | null => GROUP_BY_ID.get(id) || null;

export const typeById = (id: string): FontType | null => TYPE_BY_ID.get(id) || null;

export const typesOfGroup = (groupId: string): FontType[] => (
  TYPES.filter((type) => type.group === groupId)
);

export const firstType = (): FontType => TYPES[0];
