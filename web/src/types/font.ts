export type FontScope = "group" | "type";

export type FontTarget = { scope: FontScope; id: string };

export type PrefEntry = {
  font: string;
  scale: number;
  leading: number;
  weight: number | null;
};

export type PrefState = {
  groups: Record<string, PrefEntry>;
  types: Record<string, PrefEntry>;
  measure: number;
};

export type PrefPatch = {
  measure?: number;
  groups?: Record<string, Partial<PrefEntry>>;
  types?: Record<string, Partial<PrefEntry>>;
};

export type ComputedEntry = {
  scope: FontScope;
  id: string;
  group: string;
  scale: number;
  leading: number;
  px: number;
  lineHeight: number;
  weight: number | null;
  font: string;
  fontStack: string;
};
