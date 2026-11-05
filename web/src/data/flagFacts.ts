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
  M10009: {
    values: {
      "1": "fact.M10009.1",
      "2": "fact.M10009.2",
      "3": "fact.M10009.3",
      "4": "fact.M10009.4",
    },
    negated: {},
  },
  M20003: {
    values: {
      "1": "fact.M20003.1",
      "2": "fact.M20003.2",
      "3": "fact.M20003.3",
    },
    negated: {
      "1": "fact.M20003.not.1",
      "2": "fact.M20003.not.2",
      "3": "fact.M20003.not.3",
    },
  },
  M60018: {
    values: {
      "0": "fact.M60018.not.1",
      "1": "fact.M60018.1",
    },
    negated: {
      "0": "fact.M60018.1",
      "1": "fact.M60018.not.1",
    },
  },
  M70051: {
    values: {
      "0": "fact.M70051.not.1",
      "1": "fact.M70051.1",
    },
    negated: {
      "0": "fact.M70051.1",
      "1": "fact.M70051.not.1",
    },
  },
  M70056: {
    values: {
      "0": "fact.M70056.not.1",
      "1": "fact.M70056.1",
    },
    negated: {
      "0": "fact.M70056.1",
      "1": "fact.M70056.not.1",
    },
  },
  M70065: {
    values: {
      "0": "fact.M70065.not.1",
      "1": "fact.M70065.1",
    },
    negated: {
      "0": "fact.M70065.1",
      "1": "fact.M70065.not.1",
    },
  },
  M70066: {
    values: {
      "0": "fact.M70066.not.1",
      "1": "fact.M70066.1",
    },
    negated: {
      "0": "fact.M70066.1",
      "1": "fact.M70066.not.1",
    },
  },
};

export const flagFactKey = (flag: string, value: string, negated: boolean): string => {
  const table = flagFacts[flag];
  if (!table) return "";
  return (negated ? table.negated : table.values)[value] || "";
};
