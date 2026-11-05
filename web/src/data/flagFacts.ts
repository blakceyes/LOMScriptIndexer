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
  E10000: {
    values: {
      "0": "fact.E10000.0",
      "1": "fact.E10000.1",
    },
    negated: {
      "0": "fact.E10000.1",
      "1": "fact.E10000.0",
    },
  },
  E10005: {
    values: {
      "0": "fact.E10005.0",
      "1": "fact.E10005.1",
    },
    negated: {
      "0": "fact.E10005.1",
      "1": "fact.E10005.0",
    },
  },
  E10006: {
    values: {
      "0": "fact.E10006.0",
      "1": "fact.E10006.1",
    },
    negated: {
      "0": "fact.E10006.1",
      "1": "fact.E10006.0",
    },
  },
  E11000: {
    values: {
      "0": "fact.E11000.0",
      "1": "fact.E11000.1",
    },
    negated: {
      "0": "fact.E11000.1",
      "1": "fact.E11000.0",
    },
  },
  E12000: {
    values: {
      "0": "fact.E12000.0",
      "1": "fact.E12000.1",
    },
    negated: {
      "0": "fact.E12000.1",
      "1": "fact.E12000.0",
    },
  },
  E12001: {
    values: {
      "0": "fact.E12001.0",
      "1": "fact.E12001.1",
    },
    negated: {
      "0": "fact.E12001.1",
      "1": "fact.E12001.0",
    },
  },
  E12002: {
    values: {
      "0": "fact.E12002.0",
      "1": "fact.E12002.1",
    },
    negated: {
      "0": "fact.E12002.1",
      "1": "fact.E12002.0",
    },
  },
  E12003: {
    values: {
      "0": "fact.E12003.0",
      "1": "fact.E12003.1",
    },
    negated: {
      "0": "fact.E12003.1",
      "1": "fact.E12003.0",
    },
  },
  E12004: {
    values: {
      "0": "fact.E12004.0",
      "1": "fact.E12004.1",
    },
    negated: {
      "0": "fact.E12004.1",
      "1": "fact.E12004.0",
    },
  },
  E12005: {
    values: {
      "0": "fact.E12005.0",
      "1": "fact.E12005.1",
    },
    negated: {
      "0": "fact.E12005.1",
      "1": "fact.E12005.0",
    },
  },
  E12006: {
    values: {
      "0": "fact.E12006.0",
      "1": "fact.E12006.1",
    },
    negated: {
      "0": "fact.E12006.1",
      "1": "fact.E12006.0",
    },
  },
  E12100: {
    values: {
      "0": "fact.E12100.0",
      "1": "fact.E12100.1",
    },
    negated: {
      "0": "fact.E12100.1",
      "1": "fact.E12100.0",
    },
  },
  E12103: {
    values: {
      "0": "fact.E12103.0",
      "1": "fact.E12103.1",
    },
    negated: {
      "0": "fact.E12103.1",
      "1": "fact.E12103.0",
    },
  },
  E12105: {
    values: {
      "0": "fact.E12105.0",
      "1": "fact.E12105.1",
    },
    negated: {
      "0": "fact.E12105.1",
      "1": "fact.E12105.0",
    },
  },
  E12200: {
    values: {
      "1": "fact.E12200.1",
    },
    negated: {
      "1": "fact.E12200.not.1",
    },
  },
  E13001: {
    values: {
      "1": "fact.E13001.1",
    },
    negated: {
      "1": "fact.E13001.not.1",
    },
  },
  E13003: {
    values: {
      "0": "fact.E13003.0",
      "1": "fact.E13003.1",
    },
    negated: {
      "0": "fact.E13003.1",
      "1": "fact.E13003.0",
    },
  },
  E13004: {
    values: {
      "1": "fact.E13004.1",
    },
    negated: {
      "1": "fact.E13004.not.1",
    },
  },
  E13007: {
    values: {
      "0": "fact.E13007.0",
      "1": "fact.E13007.1",
    },
    negated: {
      "0": "fact.E13007.1",
      "1": "fact.E13007.0",
    },
  },
  E13008: {
    values: {
      "0": "fact.E13008.0",
      "1": "fact.E13008.1",
    },
    negated: {
      "0": "fact.E13008.1",
      "1": "fact.E13008.0",
    },
  },
  E13009: {
    values: {
      "1": "fact.E13009.1",
    },
    negated: {
      "1": "fact.E13009.not.1",
    },
  },
  E13010: {
    values: {
      "1": "fact.E13010.1",
    },
    negated: {
      "1": "fact.E13010.not.1",
    },
  },
  E14000: {
    values: {
      "1": "fact.E14000.1",
    },
    negated: {
      "1": "fact.E14000.not.1",
    },
  },
  E14001: {
    values: {
      "1": "fact.E14001.1",
    },
    negated: {
      "1": "fact.E14001.not.1",
    },
  },
  E14002: {
    values: {
      "1": "fact.E14002.1",
    },
    negated: {
      "1": "fact.E14002.not.1",
    },
  },
  E14003: {
    values: {
      "1": "fact.E14003.1",
    },
    negated: {
      "1": "fact.E14003.not.1",
    },
  },
  M20008: {
    values: {
      "0": "fact.M20008.0",
      "1": "fact.M20008.1",
      "2": "fact.M20008.2",
    },
    negated: {},
  },
  M20028: {
    values: {
      "1": "fact.M20028.1",
      "2": "fact.M20028.2",
    },
    negated: {},
  },
  M20035: {
    values: {
      "1": "fact.M20035.1",
      "2": "fact.M20035.2",
      "3": "fact.M20035.3",
    },
    negated: {},
  },
  M20037: {
    values: {
      "1": "fact.M20037.1",
      "2": "fact.M20037.2",
      "3": "fact.M20037.3",
    },
    negated: {},
  },
  M30005: {
    values: {
      "1": "fact.M30005.1",
      "2": "fact.M30005.2",
      "3": "fact.M30005.3",
    },
    negated: {},
  },
  M40014: {
    values: {
      "1": "fact.M40014.1",
      "2": "fact.M40014.2",
    },
    negated: {},
  },
  M40020: {
    values: {
      "1": "fact.M40020.1",
      "2": "fact.M40020.2",
    },
    negated: {},
  },
  M50017: {
    values: {
      "1": "fact.M50017.1",
      "2": "fact.M50017.2",
    },
    negated: {},
  },
  M50046: {
    values: {
      "1": "fact.M50046.1",
      "2": "fact.M50046.2",
    },
    negated: {},
  },
  M60006: {
    values: {
      "0": "fact.M60006.0",
      "1": "fact.M60006.1",
    },
    negated: {
      "0": "fact.M60006.1",
      "1": "fact.M60006.0",
    },
  },
  M60016: {
    values: {
      "1": "fact.M60016.1",
      "2": "fact.M60016.2",
    },
    negated: {},
  },
  M60033: {
    values: {
      "1": "fact.M60033.1",
      "2": "fact.M60033.2",
    },
    negated: {},
  },
  M60038: {
    values: {
      "1": "fact.M60038.1",
      "2": "fact.M60038.2",
    },
    negated: {},
  },
  M60060: {
    values: {
      "1": "fact.M60060.1",
      "2": "fact.M60060.2",
      "3": "fact.M60060.3",
    },
    negated: {},
  },
  M70002: {
    values: {
      "1": "fact.M70002.1",
      "2": "fact.M70002.2",
    },
    negated: {},
  },
  M70015: {
    values: {
      "1": "fact.M70015.1",
      "2": "fact.M70015.2",
      "3": "fact.M70015.3",
      "4": "fact.M70015.4",
    },
    negated: {},
  },
  M70028: {
    values: {
      "1": "fact.M70028.1",
      "2": "fact.M70028.2",
      "3": "fact.M70028.3",
      "4": "fact.M70028.4",
    },
    negated: {},
  },
  M70045: {
    values: {
      "1": "fact.M70045.1",
      "2": "fact.M70045.2",
      "3": "fact.M70045.3",
    },
    negated: {},
  },
  M70046: {
    values: {
      "1": "fact.M70046.1",
      "2": "fact.M70046.2",
      "3": "fact.M70046.3",
    },
    negated: {},
  },
  M70050: {
    values: {
      "1": "fact.M70050.1",
      "2": "fact.M70050.2",
    },
    negated: {},
  },
  M80007: {
    values: {
      "1": "fact.M80007.1",
      "2": "fact.M80007.2",
      "3": "fact.M80007.3",
      "4": "fact.M80007.4",
    },
    negated: {},
  },
  M80016: {
    values: {
      "1": "fact.M80016.1",
      "2": "fact.M80016.2",
      "3": "fact.M80016.3",
      "4": "fact.M80016.4",
    },
    negated: {},
  },
  S2600_02: {
    values: {
      "1": "fact.S2600_02.1",
      "2": "fact.S2600_02.2",
      "3": "fact.S2600_02.3",
    },
    negated: {},
  },
  M00058: {
    values: {
      "1": "fact.M00058.1",
      "2": "fact.M00058.2",
    },
    negated: {
      "1": "fact.M00058.2",
      "2": "fact.M00058.1",
    },
  },
  M10012: {
    values: {
      "1": "fact.M10012.1",
      "2": "fact.M10012.2",
    },
    negated: {
      "1": "fact.M10012.2",
      "2": "fact.M10012.1",
    },
  },
  M50008: {
    values: {
      "1": "fact.M50008.1",
      "2": "fact.M50008.2",
    },
    negated: {
      "1": "fact.M50008.2",
      "2": "fact.M50008.1",
    },
  },
  M50022: {
    values: {
      "1": "fact.M50022.1",
      "2": "fact.M50022.2",
    },
    negated: {
      "1": "fact.M50022.2",
      "2": "fact.M50022.1",
    },
  },
  M50036: {
    values: {
      "1": "fact.M50036.1",
      "2": "fact.M50036.2",
      "3": "fact.M50036.3",
    },
    negated: {},
  },
  M60048: {
    values: {
      "1": "fact.M60048.1",
      "2": "fact.M60048.2",
    },
    negated: {
      "1": "fact.M60048.2",
      "2": "fact.M60048.1",
    },
  },
  M60049: {
    values: {
      "1": "fact.M60049.1",
      "2": "fact.M60049.2",
    },
    negated: {
      "1": "fact.M60049.2",
      "2": "fact.M60049.1",
    },
  },
  M60050: {
    values: {
      "1": "fact.M60050.1",
      "2": "fact.M60050.2",
    },
    negated: {
      "1": "fact.M60050.2",
      "2": "fact.M60050.1",
    },
  },
  M60051: {
    values: {
      "1": "fact.M60051.1",
      "2": "fact.M60051.2",
    },
    negated: {
      "1": "fact.M60051.2",
      "2": "fact.M60051.1",
    },
  },
  M60052: {
    values: {
      "1": "fact.M60052.1",
      "2": "fact.M60052.2",
    },
    negated: {
      "1": "fact.M60052.2",
      "2": "fact.M60052.1",
    },
  },
  M60053: {
    values: {
      "1": "fact.M60053.1",
      "2": "fact.M60053.2",
    },
    negated: {
      "1": "fact.M60053.2",
      "2": "fact.M60053.1",
    },
  },
  M60054: {
    values: {
      "1": "fact.M60054.1",
      "2": "fact.M60054.2",
    },
    negated: {
      "1": "fact.M60054.2",
      "2": "fact.M60054.1",
    },
  },
  M60055: {
    values: {
      "1": "fact.M60055.1",
      "2": "fact.M60055.2",
    },
    negated: {
      "1": "fact.M60055.2",
      "2": "fact.M60055.1",
    },
  },
  M70014: {
    values: {
      "1": "fact.M70014.1",
      "2": "fact.M70014.2",
    },
    negated: {
      "1": "fact.M70014.2",
      "2": "fact.M70014.1",
    },
  },
  M70017: {
    values: {
      "1": "fact.M70017.1",
      "2": "fact.M70017.2",
    },
    negated: {
      "1": "fact.M70017.2",
      "2": "fact.M70017.1",
    },
  },
  M70035: {
    values: {
      "1": "fact.M70035.1",
      "2": "fact.M70035.2",
      "3": "fact.M70035.3",
    },
    negated: {},
  },
  M70048: {
    values: {
      "1": "fact.M70048.1",
      "2": "fact.M70048.2",
      "3": "fact.M70048.3",
    },
    negated: {},
  },
  M70049: {
    values: {
      "1": "fact.M70049.1",
      "2": "fact.M70049.2",
      "3": "fact.M70049.3",
    },
    negated: {},
  },
  M80050: {
    values: {
      "1": "fact.M80050.1",
      "2": "fact.M80050.2",
      "3": "fact.M80050.3",
    },
    negated: {},
  },
  M40062: {
    values: {
      "1": "fact.M40062.1",
      "2": "fact.M40062.2",
      "3": "fact.M40062.3",
    },
    negated: {},
  },
  M60066: {
    values: {
      "1": "fact.M60066.1",
      "2": "fact.M60066.2",
      "3": "fact.M60066.3",
    },
    negated: {},
  },
  M20064: {
    values: {
      "1": "fact.M20064.1",
      "2": "fact.M20064.2",
    },
    negated: {
      "1": "fact.M20064.2",
      "2": "fact.M20064.1",
    },
  },
  M50009: {
    values: {
      "1": "fact.M50009.1",
      "2": "fact.M50009.2",
    },
    negated: {
      "1": "fact.M50009.2",
      "2": "fact.M50009.1",
    },
  },
  M50010: {
    values: {
      "1": "fact.M50010.1",
      "2": "fact.M50010.2",
    },
    negated: {
      "1": "fact.M50010.2",
      "2": "fact.M50010.1",
    },
  },
  M50011: {
    values: {
      "1": "fact.M50011.1",
      "2": "fact.M50011.2",
    },
    negated: {
      "1": "fact.M50011.2",
      "2": "fact.M50011.1",
    },
  },
  M60010: {
    values: {
      "0": "fact.M60010.0",
      "1": "fact.M60010.1",
    },
    negated: {
      "0": "fact.M60010.1",
      "1": "fact.M60010.0",
    },
  },
  M60011: {
    values: {
      "0": "fact.M60011.0",
      "1": "fact.M60011.1",
    },
    negated: {
      "0": "fact.M60011.1",
      "1": "fact.M60011.0",
    },
  },
  M60012: {
    values: {
      "0": "fact.M60012.0",
      "1": "fact.M60012.1",
    },
    negated: {
      "0": "fact.M60012.1",
      "1": "fact.M60012.0",
    },
  },
  M20046: {
    values: {
      "0": "fact.M20046.0",
      "1": "fact.M20046.1",
    },
    negated: {
      "0": "fact.M20046.1",
      "1": "fact.M20046.0",
    },
  },
  M40001: {
    values: {
      "0": "fact.M40001.0",
      "1": "fact.M40001.1",
    },
    negated: {
      "0": "fact.M40001.1",
      "1": "fact.M40001.0",
    },
  },
  M40002: {
    values: {
      "0": "fact.M40002.0",
      "1": "fact.M40002.1",
    },
    negated: {
      "0": "fact.M40002.1",
      "1": "fact.M40002.0",
    },
  },
  M30029: {
    values: {
      "0": "fact.M30029.0",
      "1": "fact.M30029.1",
    },
    negated: {
      "0": "fact.M30029.1",
      "1": "fact.M30029.0",
    },
  },
  E21008: {
    values: {
      "1": "fact.E21008.1",
      "2": "fact.E21008.2",
      "3": "fact.E21008.3",
    },
    negated: {},
  },
  G11003: {
    values: {
      "1": "fact.G11003.1",
      "2": "fact.G11003.2",
    },
    negated: {
      "1": "fact.G11003.2",
      "2": "fact.G11003.1",
    },
  },
  G11005: {
    values: {
      "1": "fact.G11005.1",
      "2": "fact.G11005.2",
    },
    negated: {
      "1": "fact.G11005.2",
      "2": "fact.G11005.1",
    },
  },
  M00023: {
    values: {
      "0": "fact.M00023.0",
      "1": "fact.M00023.1",
    },
    negated: {
      "0": "fact.M00023.1",
      "1": "fact.M00023.0",
    },
  },
  M30003: {
    values: {
      "1": "fact.M30003.1",
      "2": "fact.M30003.2",
    },
    negated: {
      "1": "fact.M30003.2",
      "2": "fact.M30003.1",
    },
  },
  M30052: {
    values: {
      "1": "fact.M30052.1",
      "2": "fact.M30052.2",
      "3": "fact.M30052.3",
    },
    negated: {},
  },
  M40036: {
    values: {
      "1": "fact.M40036.1",
      "2": "fact.M40036.2",
    },
    negated: {
      "1": "fact.M40036.2",
      "2": "fact.M40036.1",
    },
  },
  M50013: {
    values: {
      "1": "fact.M50013.1",
      "2": "fact.M50013.2",
    },
    negated: {
      "1": "fact.M50013.2",
      "2": "fact.M50013.1",
    },
  },
  M50040: {
    values: {
      "1": "fact.M50040.1",
      "2": "fact.M50040.2",
    },
    negated: {
      "1": "fact.M50040.2",
      "2": "fact.M50040.1",
    },
  },
  M60001: {
    values: {
      "1": "fact.M60001.1",
      "2": "fact.M60001.2",
    },
    negated: {
      "1": "fact.M60001.2",
      "2": "fact.M60001.1",
    },
  },
  M60079: {
    values: {
      "1": "fact.M60079.1",
      "2": "fact.M60079.2",
      "3": "fact.M60079.3",
    },
    negated: {},
  },
  M60080: {
    values: {
      "1": "fact.M60080.1",
      "2": "fact.M60080.2",
      "3": "fact.M60080.3",
    },
    negated: {},
  },
  M60081: {
    values: {
      "1": "fact.M60081.1",
      "2": "fact.M60081.2",
    },
    negated: {
      "1": "fact.M60081.2",
      "2": "fact.M60081.1",
    },
  },
  M80006: {
    values: {
      "1": "fact.M80006.1",
      "2": "fact.M80006.2",
      "3": "fact.M80006.3",
    },
    negated: {},
  },
  M80011: {
    values: {
      "1": "fact.M80011.1",
      "2": "fact.M80011.2",
    },
    negated: {
      "1": "fact.M80011.2",
      "2": "fact.M80011.1",
    },
  },
  M80017: {
    values: {
      "1": "fact.M80017.1",
      "2": "fact.M80017.2",
      "3": "fact.M80017.3",
    },
    negated: {},
  },
  M80043: {
    values: {
      "1": "fact.M80043.1",
      "2": "fact.M80043.2",
    },
    negated: {
      "1": "fact.M80043.2",
      "2": "fact.M80043.1",
    },
  },
  S9904_01: {
    values: {
      "1": "fact.S9904_01.1",
      "2": "fact.S9904_01.2",
    },
    negated: {
      "1": "fact.S9904_01.2",
      "2": "fact.S9904_01.1",
    },
  },
  G20000: {
    values: {
      "0": "fact.G20000.0",
      "1": "fact.G20000.1",
      "2": "fact.G20000.2",
    },
    negated: {
      "0": "fact.G20000.1",
    },
  },
  Pinball_Award_02_01: {
    values: {
      "1": "fact.Pinball_Award_02_01.1",
    },
    negated: {},
  },
  Pinball_Award_03_01: {
    values: {
      "1": "fact.Pinball_Award_03_01.1",
    },
    negated: {},
  },
  Pinball_Broken: {
    values: {
      "0": "fact.Pinball_Broken.0",
      "1": "fact.Pinball_Broken.1",
    },
    negated: {
      "0": "fact.Pinball_Broken.1",
      "1": "fact.Pinball_Broken.0",
    },
  },
  S0033_01: {
    values: {
      "1": "fact.S0033_01.1",
    },
    negated: {},
  },
  M60003: {
    values: {
      "0": "fact.M60003.0",
      "1": "fact.M60003.1",
    },
    negated: {
      "0": "fact.M60003.1",
      "1": "fact.M60003.0",
    },
  },
  M60004: {
    values: {
      "0": "fact.M60004.0",
      "1": "fact.M60004.1",
    },
    negated: {
      "0": "fact.M60004.1",
      "1": "fact.M60004.0",
    },
  },
  M60005: {
    values: {
      "0": "fact.M60005.0",
      "1": "fact.M60005.1",
    },
    negated: {
      "0": "fact.M60005.1",
      "1": "fact.M60005.0",
    },
  },
  M60007: {
    values: {
      "0": "fact.M60007.0",
      "1": "fact.M60007.1",
    },
    negated: {
      "0": "fact.M60007.1",
      "1": "fact.M60007.0",
    },
  },
  M60015: {
    values: {
      "0": "fact.M60015.0",
      "1": "fact.M60015.1",
    },
    negated: {
      "0": "fact.M60015.1",
      "1": "fact.M60015.0",
    },
  },
  G11000: {
    values: {
      "0": "fact.G11000.0",
      "1": "fact.G11000.1",
    },
    negated: {
      "0": "fact.G11000.1",
      "1": "fact.G11000.0",
    },
  },
  G11001: {
    values: {
      "2": "fact.G11001.2",
    },
    negated: {},
  },
  G11002: {
    values: {
      "1": "fact.G11002.1",
    },
    negated: {},
  },
  G11004: {
    values: {
      "1": "fact.G11004.1",
    },
    negated: {},
  },
  G11006: {
    values: {
      "1": "fact.G11006.1",
    },
    negated: {},
  },
  E12104: {
    values: {
      "1": "fact.E12104.1",
    },
    negated: {},
  },
  E12106: {
    values: {
      "1": "fact.E12106.1",
    },
    negated: {},
  },
  E13005: {
    values: {
      "1": "fact.E13005.1",
    },
    negated: {},
  },
  E13012: {
    values: {
      "1": "fact.E13012.1",
    },
    negated: {},
  },
  E13013: {
    values: {
      "1": "fact.E13013.1",
    },
    negated: {},
  },
  E21001: {
    values: {
      "1": "fact.E21001.1",
    },
    negated: {},
  },
  M60008: {
    values: {
      "1": "fact.M60008.1",
    },
    negated: {},
  },
  M60013: {
    values: {
      "1": "fact.M60013.1",
    },
    negated: {},
  },
  M50018: {
    values: {
      "1": "fact.M50018.1",
    },
    negated: {},
  },
  M60021: {
    values: {
      "1": "fact.M60021.1",
    },
    negated: {},
  },
  M70069: {
    values: {
      "1": "fact.M70069.1",
    },
    negated: {},
  },
  M60082: {
    values: {
      "1": "fact.M60082.1",
    },
    negated: {},
  },
  M20062: {
    values: {
      "1": "fact.M20062.1",
    },
    negated: {},
  },
  E22000: {
    values: {
      "1": "fact.E22000.1",
    },
    negated: {},
  },
  S0014_02: {
    values: {
      "1": "fact.S0014_02.1",
    },
    negated: {},
  },
  E00002: {
    values: {
      "1": "fact.E00002.1",
    },
    negated: {},
  },
  E00016: {
    values: {
      "1": "fact.E00016.1",
    },
    negated: {},
  },
  E00017: {
    values: {
      "1": "fact.E00017.1",
    },
    negated: {},
  },
  E12101: {
    values: {
      "1": "fact.E12101.1",
    },
    negated: {},
  },
  E13002: {
    values: {
      "1": "fact.E13002.1",
    },
    negated: {},
  },
  E20001: {
    values: {
      "1": "fact.E20001.1",
    },
    negated: {},
  },
  E21004: {
    values: {
      "1": "fact.E21004.1",
    },
    negated: {},
  },
  E21009: {
    values: {
      "1": "fact.E21009.1",
    },
    negated: {},
  },
  G10004: {
    values: {
      "1": "fact.G10004.1",
    },
    negated: {},
  },
  G30010: {
    values: {
      "1": "fact.G30010.1",
    },
    negated: {},
  },
  G30014: {
    values: {
      "1": "fact.G30014.1",
    },
    negated: {},
  },
  M00001: {
    values: {
      "1": "fact.M00001.1",
    },
    negated: {},
  },
  M00026: {
    values: {
      "1": "fact.M00026.1",
    },
    negated: {},
  },
  M00028: {
    values: {
      "1": "fact.M00028.1",
    },
    negated: {},
  },
  M00042: {
    values: {
      "1": "fact.M00042.1",
    },
    negated: {},
  },
  M00055: {
    values: {
      "1": "fact.M00055.1",
    },
    negated: {},
  },
  M00059: {
    values: {
      "1": "fact.M00059.1",
    },
    negated: {},
  },
  M10006: {
    values: {
      "1": "fact.M10006.1",
    },
    negated: {},
  },
  M10023: {
    values: {
      "1": "fact.M10023.1",
    },
    negated: {},
  },
  M20001: {
    values: {
      "1": "fact.M20001.1",
    },
    negated: {},
  },
  M20012: {
    values: {
      "1": "fact.M20012.1",
    },
    negated: {},
  },
  M20021: {
    values: {
      "1": "fact.M20021.1",
    },
    negated: {},
  },
  M20025: {
    values: {
      "1": "fact.M20025.1",
    },
    negated: {},
  },
  M20051: {
    values: {
      "1": "fact.M20051.1",
    },
    negated: {},
  },
  M20055: {
    values: {
      "1": "fact.M20055.1",
    },
    negated: {},
  },
  M30026: {
    values: {
      "1": "fact.M30026.1",
    },
    negated: {},
  },
  M30071: {
    values: {
      "1": "fact.M30071.1",
    },
    negated: {},
  },
  M30078: {
    values: {
      "1": "fact.M30078.1",
    },
    negated: {},
  },
  M30081: {
    values: {
      "1": "fact.M30081.1",
    },
    negated: {},
  },
  M40011: {
    values: {
      "1": "fact.M40011.1",
    },
    negated: {},
  },
  M40052: {
    values: {
      "1": "fact.M40052.1",
    },
    negated: {},
  },
  M60029: {
    values: {
      "1": "fact.M60029.1",
    },
    negated: {},
  },
  M60068: {
    values: {
      "1": "fact.M60068.1",
    },
    negated: {},
  },
  M70001: {
    values: {
      "1": "fact.M70001.1",
    },
    negated: {},
  },
  M70052: {
    values: {
      "1": "fact.M70052.1",
    },
    negated: {},
  },
  G10001: {
    values: {
      "1": "fact.G10001.1",
    },
    negated: {},
  },
  G10002: {
    values: {
      "1": "fact.G10002.1",
    },
    negated: {},
  },
  G10003: {
    values: {
      "1": "fact.G10003.1",
    },
    negated: {},
  },
  G10005: {
    values: {
      "1": "fact.G10005.1",
    },
    negated: {},
  },
  G10006: {
    values: {
      "1": "fact.G10006.1",
    },
    negated: {},
  },
  G10007: {
    values: {
      "1": "fact.G10007.1",
    },
    negated: {},
  },
};

export const flagFactKey = (flag: string, value: string, negated: boolean): string => {
  const table = flagFacts[flag];
  if (!table) return "";
  return (negated ? table.negated : table.values)[value] || "";
};

export const flagMeasures: Record<string, string> = {
  Score_01: "measure.Score_01",
  Pinball_Broken_Count: "measure.Pinball_Broken_Count",
  Talk_Count_01: "measure.Talk_Count_01",
  H00001: "measure.H00001",
  H00002: "measure.H00002",
  H00003: "measure.H00003",
  H00004: "measure.H00004",
  H00005: "measure.H00005",
  H00006: "measure.H00006",
  H01001: "measure.H01001",
  H01002: "measure.H01002",
  H01003: "measure.H01003",
  H02001: "measure.H02001",
  H02002: "measure.H02002",
  H02003: "measure.H02003",
  Pinball_Award_01: "measure.Pinball_Award_01",
  Pinball_Award_02: "measure.Pinball_Award_02",
  Pinball_Award_03: "measure.Pinball_Award_03",
  G20000: "measure.G20000",
};

export const flagMeasureKey = (flag: string): string => flagMeasures[flag] || "";
