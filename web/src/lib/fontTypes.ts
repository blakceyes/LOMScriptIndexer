import { FOLLOW_GROUP } from "./fontFamilies";

export type FontGroup = { id: string; label: string; font?: string; scale?: number };

export type Wrapper = { tag: string; cls?: string };

export type TypeSlot = {
  id: string;
  group: string;
  label: string;
  font: string;
  weight: number | null;
  scale?: number;
  leading?: number;
  isLeadingDisabled?: boolean;
  previewKey: string;
  wrappers: Wrapper[];
};

export const GROUPS: FontGroup[] = [
  { id: "prose", label: "pref.group.prose", scale: 130 },
  { id: "choice", label: "pref.group.choice", scale: 120 },
  { id: "mark", label: "pref.group.mark" },
  { id: "heading", label: "pref.group.heading" },
  { id: "interface", label: "pref.group.interface" },
  { id: "system", label: "pref.group.system" },
];

export const TYPE_SLOTS: TypeSlot[] = [
  {
    id: "dialog",
    group: "prose",
    label: "pref.type.dialog",
    font: FOLLOW_GROUP,
    weight: null,
    previewKey: "previewText",
    wrappers: [
      { tag: "div", cls: "say" },
      { tag: "div", cls: "what" },
    ],
  },
  {
    id: "speaker",
    group: "prose",
    label: "pref.type.speaker",
    font: "kai",
    weight: 500,
    scale: 140,
    previewKey: "previewWho",
    wrappers: [
      { tag: "div", cls: "say" },
      { tag: "span", cls: "who is-link" },
    ],
  },
  {
    id: "narration",
    group: "prose",
    label: "pref.type.narration",
    font: FOLLOW_GROUP,
    weight: null,
    scale: 160,
    previewKey: "previewNarration",
    wrappers: [
      { tag: "div", cls: "say narration" },
      { tag: "div", cls: "what" },
    ],
  },
  {
    id: "think",
    group: "prose",
    label: "pref.type.think",
    font: FOLLOW_GROUP,
    weight: null,
    previewKey: "previewThink",
    wrappers: [
      { tag: "div", cls: "say think" },
      { tag: "div", cls: "what" },
    ],
  },
  {
    id: "lore",
    group: "prose",
    label: "pref.type.lore",
    font: "kai",
    weight: null,
    previewKey: "previewLore",
    wrappers: [
      { tag: "div", cls: "lore" },
      { tag: "div", cls: "lore-text" },
      { tag: "p", cls: "lore-p" },
    ],
  },
  {
    id: "death-ending",
    group: "prose",
    label: "pref.type.death-ending",
    font: "kai",
    weight: null,
    scale: 150,
    leading: 75,
    previewKey: "previewEnding",
    wrappers: [
      { tag: "div", cls: "ending" },
      { tag: "div", cls: "ending-head" },
      { tag: "span", cls: "ending-title" },
    ],
  },
  {
    id: "excerpt",
    group: "prose",
    label: "pref.type.excerpt",
    font: FOLLOW_GROUP,
    weight: null,
    previewKey: "previewSnippet",
    wrappers: [
      { tag: "div", cls: "drop-item" },
      { tag: "span", cls: "dtext" },
    ],
  },
  {
    id: "battle-fact",
    group: "prose",
    label: "pref.type.battle-fact",
    font: "sans",
    weight: null,
    previewKey: "previewBattle",
    wrappers: [{ tag: "p", cls: "battle-fact" }],
  },
  {
    id: "option",
    group: "choice",
    label: "pref.type.option",
    font: FOLLOW_GROUP,
    weight: null,
    scale: 120,
    previewKey: "previewOption",
    wrappers: [
      { tag: "div", cls: "option-head row" },
      { tag: "span", cls: "option-main" },
      { tag: "span", cls: "option-text" },
    ],
  },
  {
    id: "option-index",
    group: "choice",
    label: "pref.type.option-index",
    font: "mono",
    weight: null,
    scale: 85,
    isLeadingDisabled: true,
    previewKey: "previewIndex",
    wrappers: [{ tag: "span", cls: "option-idx" }],
  },
  {
    id: "option-condition",
    group: "choice",
    label: "pref.type.option-condition",
    font: FOLLOW_GROUP,
    weight: null,
    previewKey: "previewOptionCond",
    wrappers: [{ tag: "span", cls: "option-cond" }],
  },
  {
    id: "branch-condition",
    group: "choice",
    label: "pref.type.branch-condition",
    font: FOLLOW_GROUP,
    weight: 400,
    scale: 120,
    previewKey: "previewBranchCond",
    wrappers: [
      { tag: "div", cls: "branch" },
      { tag: "div", cls: "branch-head row" },
      { tag: "span", cls: "cond" },
    ],
  },
  {
    id: "battle-condition",
    group: "choice",
    label: "pref.type.battle-condition",
    font: FOLLOW_GROUP,
    weight: 600,
    previewKey: "previewBattleCond",
    wrappers: [
      { tag: "div", cls: "meta-chips battle-when" },
      { tag: "span", cls: "chip-stat chip chip-sm" },
    ],
  },
  {
    id: "jump-condition",
    group: "choice",
    label: "pref.type.jump-condition",
    font: FOLLOW_GROUP,
    weight: 400,
    previewKey: "previewJumpCondition",
    wrappers: [{ tag: "span", cls: "jump-cond-text" }],
  },
  {
    id: "scene-switch",
    group: "mark",
    label: "pref.type.scene-switch",
    font: FOLLOW_GROUP,
    weight: null,
    previewKey: "previewLabel",
    wrappers: [
      { tag: "div", cls: "scene-switch" },
      { tag: "span", cls: "scene-name" },
    ],
  },
  {
    id: "jump",
    group: "mark",
    label: "pref.type.jump",
    font: FOLLOW_GROUP,
    weight: null,
    isLeadingDisabled: true,
    previewKey: "previewJump",
    wrappers: [{ tag: "button", cls: "jump btn btn-sm" }],
  },
  {
    id: "badge",
    group: "mark",
    label: "pref.type.badge",
    font: FOLLOW_GROUP,
    weight: null,
    isLeadingDisabled: true,
    previewKey: "previewBadge",
    wrappers: [{ tag: "span", cls: "badge" }],
  },
  {
    id: "jump-weight",
    group: "mark",
    label: "pref.type.jump-weight",
    font: FOLLOW_GROUP,
    weight: null,
    scale: 85,
    isLeadingDisabled: true,
    previewKey: "previewJumpWeight",
    wrappers: [{ tag: "span", cls: "jump-weight" }],
  },
  {
    id: "script-title",
    group: "heading",
    label: "pref.type.script-title",
    font: FOLLOW_GROUP,
    weight: 600,
    previewKey: "previewNode",
    wrappers: [{ tag: "h2", cls: "node-title" }],
  },
  {
    id: "panel-title",
    group: "heading",
    label: "pref.type.panel-title",
    font: FOLLOW_GROUP,
    weight: 600,
    previewKey: "previewHeading",
    wrappers: [{ tag: "h2", cls: "panel-title" }],
  },
  {
    id: "overlay-title",
    group: "heading",
    label: "pref.type.overlay-title",
    font: FOLLOW_GROUP,
    weight: 600,
    previewKey: "lookupSpeaker",
    wrappers: [{ tag: "span", cls: "overlay-title" }],
  },
  {
    id: "brand",
    group: "heading",
    label: "pref.type.brand",
    font: FOLLOW_GROUP,
    weight: 600,
    previewKey: "appTitle",
    wrappers: [{ tag: "div", cls: "brand-text" }, { tag: "h1" }],
  },
  {
    id: "seal",
    group: "heading",
    label: "pref.type.seal",
    font: FOLLOW_GROUP,
    weight: 600,
    isLeadingDisabled: true,
    previewKey: "previewSeal",
    wrappers: [{ tag: "span", cls: "seal" }],
  },
  {
    id: "rail-title",
    group: "heading",
    label: "pref.type.rail-title",
    font: FOLLOW_GROUP,
    weight: 600,
    previewKey: "railTitle",
    wrappers: [{ tag: "h2", cls: "rail-title" }],
  },
  {
    id: "stat-value",
    group: "heading",
    label: "pref.type.stat-value",
    font: FOLLOW_GROUP,
    weight: 600,
    previewKey: "previewStat",
    wrappers: [
      { tag: "div", cls: "stat-card" },
      { tag: "span", cls: "stat-value" },
    ],
  },
  {
    id: "empty-title",
    group: "heading",
    label: "pref.type.empty-title",
    font: FOLLOW_GROUP,
    weight: 600,
    previewKey: "noBeatsTitle",
    wrappers: [{ tag: "div", cls: "empty-state" }, { tag: "h3" }],
  },
  {
    id: "breadcrumb",
    group: "heading",
    label: "pref.type.breadcrumb",
    font: "mono",
    weight: null,
    previewKey: "previewCrumb",
    wrappers: [{ tag: "p", cls: "crumb" }],
  },
  {
    id: "meta",
    group: "heading",
    label: "pref.type.meta",
    font: "mono",
    weight: null,
    previewKey: "previewTime",
    wrappers: [
      { tag: "div", cls: "drop-item" },
      { tag: "span", cls: "dmeta" },
    ],
  },
  {
    id: "ui",
    group: "interface",
    label: "pref.type.ui",
    font: FOLLOW_GROUP,
    weight: null,
    previewKey: "previewText",
    wrappers: [{ tag: "p", cls: "help-desc" }],
  },
  {
    id: "ui-compact",
    group: "interface",
    label: "pref.type.ui-compact",
    font: FOLLOW_GROUP,
    weight: null,
    previewKey: "previewUi",
    wrappers: [{ tag: "button", cls: "btn" }],
  },
  {
    id: "ui-micro",
    group: "interface",
    label: "pref.type.ui-micro",
    font: FOLLOW_GROUP,
    weight: null,
    scale: 85,
    previewKey: "previewMicro",
    wrappers: [{ tag: "p", cls: "menu-note" }],
  },
  {
    id: "caption",
    group: "interface",
    label: "pref.type.caption",
    font: "mono",
    weight: null,
    previewKey: "previewCaption",
    wrappers: [{ tag: "p", cls: "sub-label" }],
  },
  {
    id: "code",
    group: "interface",
    label: "pref.type.code",
    font: "mono",
    weight: null,
    previewKey: "previewId",
    wrappers: [
      { tag: "div", cls: "drop-item" },
      { tag: "span", cls: "did" },
    ],
  },
  {
    id: "status",
    group: "system",
    label: "pref.type.status",
    font: FOLLOW_GROUP,
    weight: null,
    previewKey: "previewStatus",
    wrappers: [{ tag: "p", cls: "filter-status" }],
  },
  {
    id: "loading",
    group: "system",
    label: "pref.type.loading",
    font: "mono",
    weight: null,
    previewKey: "previewLoading",
    wrappers: [{ tag: "span", cls: "sk-caption" }],
  },
  {
    id: "empty-text",
    group: "system",
    label: "pref.type.empty-text",
    font: FOLLOW_GROUP,
    weight: null,
    previewKey: "previewText",
    wrappers: [{ tag: "p", cls: "drop-empty" }],
  },
];

const GROUP_BY_ID = new Map(GROUPS.map((group) => [group.id, group]));

const SLOT_BY_ID = new Map(TYPE_SLOTS.map((slot) => [slot.id, slot]));

export const groupById = (id: string): FontGroup | null => GROUP_BY_ID.get(id) || null;

export const slotById = (id: string): TypeSlot | null => SLOT_BY_ID.get(id) || null;

export const slotsOfGroup = (groupId: string): TypeSlot[] =>
  TYPE_SLOTS.filter((slot) => slot.group === groupId);

export const firstSlot = (): TypeSlot => TYPE_SLOTS[0];
