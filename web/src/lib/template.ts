const PLACEHOLDER = /\{(\w+)\}/g;

export const fillTemplate = (template: string, vars?: Record<string, unknown>): string => (
  String(template).replace(PLACEHOLDER, (whole, name: string) => (
    vars && vars[name] !== undefined ? String(vars[name]) : whole
  ))
);
