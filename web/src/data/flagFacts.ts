export type FlagFactTable = {
  values: Record<string, string>;
  negated: Record<string, string>;
};

export const flagFacts: Record<string, FlagFactTable> = {
  G30000: {
    values: {
      "0": "fact.G30000.0",
      "1": "fact.G30000.1",
    },
    negated: {
      "0": "fact.G30000.1",
      "1": "fact.G30000.0",
    },
  },
  M20011: {
    values: {
      "1": "fact.M20011.1",
      "2": "fact.M20011.2",
      "3": "fact.M20011.3",
      "4": "fact.M20011.4",
    },
    negated: {
      "1": "fact.M20011.not.1",
      "2": "fact.M20011.not.2",
      "3": "fact.M20011.not.3",
      "4": "fact.M20011.not.4",
    },
  },
};

export const flagFactKey = (flag: string, value: string, negated: boolean): string => {
  const table = flagFacts[flag];
  if (!table) return "";
  return (negated ? table.negated : table.values)[value] || "";
};
