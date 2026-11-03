const PLACEHOLDER = /\{(\w+)\}/g;

export const format = (template: string, vars?: Record<string, unknown>): string => (
  String(template).replace(PLACEHOLDER, (whole, name: string) => (
    vars && vars[name] !== undefined ? String(vars[name]) : whole
  ))
);
