export type FlagFactTable = {
  values: Record<string, string>;
  negated: Record<string, string>;
};

export const flagFacts: Record<string, FlagFactTable> = {
  G30000: {
    values: {
      "1": "fact.G30000.1",
    },
    negated: {},
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
      "1": "fact.M60018.1",
    },
    negated: {},
  },
  M70051: {
    values: {
      "1": "fact.M70051.1",
    },
    negated: {},
  },
  M70056: {
    values: {
      "1": "fact.M70056.1",
    },
    negated: {},
  },
  M70065: {
    values: {
      "1": "fact.M70065.1",
    },
    negated: {},
  },
  M70066: {
    values: {
      "1": "fact.M70066.1",
    },
    negated: {},
  },
  E10000: {
    values: {
      "1": "fact.E10000.1",
    },
    negated: {},
  },
  E10005: {
    values: {
      "1": "fact.E10005.1",
    },
    negated: {},
  },
  E10006: {
    values: {
      "1": "fact.E10006.1",
    },
    negated: {},
  },
  E11000: {
    values: {
      "1": "fact.E11000.1",
    },
    negated: {},
  },
  E12000: {
    values: {
      "1": "fact.E12000.1",
    },
    negated: {},
  },
  E12001: {
    values: {
      "1": "fact.E12001.1",
    },
    negated: {},
  },
  E12002: {
    values: {
      "1": "fact.E12002.1",
    },
    negated: {},
  },
  E12003: {
    values: {
      "1": "fact.E12003.1",
    },
    negated: {},
  },
  E12004: {
    values: {
      "1": "fact.E12004.1",
    },
    negated: {},
  },
  E12005: {
    values: {
      "1": "fact.E12005.1",
    },
    negated: {},
  },
  E12006: {
    values: {
      "1": "fact.E12006.1",
    },
    negated: {},
  },
  E12100: {
    values: {
      "1": "fact.E12100.1",
    },
    negated: {},
  },
  E12103: {
    values: {
      "1": "fact.E12103.1",
    },
    negated: {},
  },
  E12105: {
    values: {
      "1": "fact.E12105.1",
    },
    negated: {},
  },
  E12200: {
    values: {
      "1": "fact.E12200.1",
    },
    negated: {},
  },
  E13001: {
    values: {
      "1": "fact.E13001.1",
    },
    negated: {},
  },
  E13003: {
    values: {
      "1": "fact.E13003.1",
    },
    negated: {},
  },
  E13004: {
    values: {
      "1": "fact.E13004.1",
    },
    negated: {},
  },
  E13007: {
    values: {
      "1": "fact.E13007.1",
    },
    negated: {},
  },
  E13008: {
    values: {
      "1": "fact.E13008.1",
    },
    negated: {},
  },
  E13009: {
    values: {
      "1": "fact.E13009.1",
    },
    negated: {},
  },
  E13010: {
    values: {
      "1": "fact.E13010.1",
    },
    negated: {},
  },
  E14000: {
    values: {
      "1": "fact.E14000.1",
    },
    negated: {},
  },
  E14001: {
    values: {
      "1": "fact.E14001.1",
    },
    negated: {},
  },
  E14002: {
    values: {
      "1": "fact.E14002.1",
    },
    negated: {},
  },
  E14003: {
    values: {
      "1": "fact.E14003.1",
    },
    negated: {},
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
      "1": "fact.M60006.1",
    },
    negated: {},
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
      "1": "fact.M60010.1",
    },
    negated: {},
  },
  M60011: {
    values: {
      "1": "fact.M60011.1",
    },
    negated: {},
  },
  M60012: {
    values: {
      "1": "fact.M60012.1",
    },
    negated: {},
  },
  M20046: {
    values: {
      "1": "fact.M20046.1",
    },
    negated: {},
  },
  M40001: {
    values: {
      "1": "fact.M40001.1",
    },
    negated: {},
  },
  M40002: {
    values: {
      "1": "fact.M40002.1",
    },
    negated: {},
  },
  M30029: {
    values: {
      "1": "fact.M30029.1",
    },
    negated: {},
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
      "1": "fact.M00023.1",
    },
    negated: {},
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
      "1": "fact.Pinball_Broken.1",
    },
    negated: {},
  },
  S0033_01: {
    values: {
      "1": "fact.S0033_01.1",
    },
    negated: {},
  },
  M60003: {
    values: {
      "1": "fact.M60003.1",
    },
    negated: {},
  },
  M60004: {
    values: {
      "1": "fact.M60004.1",
    },
    negated: {},
  },
  M60005: {
    values: {
      "1": "fact.M60005.1",
    },
    negated: {},
  },
  M60007: {
    values: {
      "1": "fact.M60007.1",
    },
    negated: {},
  },
  M60015: {
    values: {
      "1": "fact.M60015.1",
    },
    negated: {},
  },
  G11000: {
    values: {
      "1": "fact.G11000.1",
    },
    negated: {},
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
  M00002: {
    values: {
      "1": "fact.M00002.1",
    },
    negated: {},
  },
  M10019: {
    values: {
      "1": "fact.M10019.1",
      "2": "fact.M10019.2",
      "3": "fact.M10019.3",
    },
    negated: {},
  },
  M20048: {
    values: {
      "1": "fact.M20048.1",
    },
    negated: {},
  },
  M20050: {
    values: {
      "1": "fact.M20050.1",
    },
    negated: {},
  },
  M20052: {
    values: {
      "1": "fact.M20052.1",
    },
    negated: {},
  },
  M20056: {
    values: {
      "1": "fact.M20056.1",
      "2": "fact.M20056.2",
    },
    negated: {
      "1": "fact.M20056.2",
      "2": "fact.M20056.1",
    },
  },
  M30048: {
    values: {
      "1": "fact.M30048.1",
    },
    negated: {},
  },
  M40017: {
    values: {
      "1": "fact.M40017.1",
    },
    negated: {},
  },
  M40025: {
    values: {
      "1": "fact.M40025.1",
    },
    negated: {},
  },
  M40031: {
    values: {
      "1": "fact.M40031.1",
      "2": "fact.M40031.2",
      "3": "fact.M40031.3",
      "4": "fact.M40031.4",
    },
    negated: {},
  },
  M40054: {
    values: {
      "1": "fact.M40054.1",
    },
    negated: {},
  },
  M40056: {
    values: {
      "1": "fact.M40056.1",
    },
    negated: {},
  },
  M40061: {
    values: {
      "0": "fact.M40061.0",
      "1": "fact.M40061.1",
      "2": "fact.M40061.2",
    },
    negated: {
      "2": "fact.M40061.not.2",
    },
  },
  M50021: {
    values: {
      "1": "fact.M50021.1",
    },
    negated: {},
  },
  M50038: {
    values: {
      "1": "fact.M50038.1",
    },
    negated: {},
  },
  M60032: {
    values: {
      "1": "fact.M60032.1",
    },
    negated: {},
  },
  M60064: {
    values: {
      "1": "fact.M60064.1",
    },
    negated: {},
  },
  M70027: {
    values: {
      "1": "fact.M70027.1",
    },
    negated: {},
  },
  M70030: {
    values: {
      "1": "fact.M70030.1",
    },
    negated: {},
  },
  M70031: {
    values: {
      "1": "fact.M70031.1",
    },
    negated: {},
  },
  M70038: {
    values: {
      "1": "fact.M70038.1",
    },
    negated: {},
  },
  M70073: {
    values: {
      "1": "fact.M70073.1",
    },
    negated: {},
  },
  M80037: {
    values: {
      "1": "fact.M80037.1",
    },
    negated: {},
  },
  M80040: {
    values: {
      "1": "fact.M80040.1",
    },
    negated: {},
  },
  M80049: {
    values: {
      "1": "fact.M80049.1",
    },
    negated: {},
  },
  M80076: {
    values: {
      "1": "fact.M80076.1",
    },
    negated: {},
  },
  M80077: {
    values: {
      "1": "fact.M80077.1",
    },
    negated: {},
  },
  G00004: {
    values: {
      "1": "fact.G00004.1",
    },
    negated: {},
  },
  M10016: {
    values: {
      "1": "fact.M10016.1",
    },
    negated: {},
  },
  M70054: {
    values: {
      "1": "fact.M70054.1",
    },
    negated: {},
  },
  M60036: {
    values: {
      "1": "fact.M60036.1",
    },
    negated: {},
  },
  M60091: {
    values: {
      "1": "fact.M60091.1",
    },
    negated: {},
  },
  M60057: {
    values: {
      "1": "fact.M60057.1",
    },
    negated: {},
  },
  M60030: {
    values: {
      "1": "fact.M60030.1",
    },
    negated: {},
  },
  M80010: {
    values: {
      "1": "fact.M80010.1",
      "2": "fact.M80010.2",
      "3": "fact.M80010.3",
      "4": "fact.M80010.4",
    },
    negated: {
      "1": "fact.M80010.not.1",
    },
  },
  M40065: {
    values: {
      "1": "fact.M40065.1",
    },
    negated: {},
  },
  M40059: {
    values: {
      "1": "fact.M40059.1",
    },
    negated: {},
  },
  M30013: {
    values: {
      "1": "fact.M30013.1",
    },
    negated: {},
  },
  M30080: {
    values: {
      "1": "fact.M30080.1",
    },
    negated: {},
  },
  M60037: {
    values: {
      "1": "fact.M60037.1",
    },
    negated: {},
  },
  M60026: {
    values: {
      "1": "fact.M60026.1",
    },
    negated: {},
  },
  M50047: {
    values: {
      "1": "fact.M50047.1",
    },
    negated: {},
  },
  M30019: {
    values: {
      "1": "fact.M30019.1",
    },
    negated: {},
  },
  M20053: {
    values: {
      "1": "fact.M20053.1",
    },
    negated: {},
  },
  M60088: {
    values: {
      "1": "fact.M60088.1",
    },
    negated: {},
  },
  E13011: {
    values: {
      "1": "fact.E13011.1",
    },
    negated: {},
  },
  M60028: {
    values: {
      "1": "fact.M60028.1",
    },
    negated: {},
  },
  M50034: {
    values: {
      "1": "fact.M50034.1",
    },
    negated: {},
  },
  M50014: {
    values: {
      "1": "fact.M50014.1",
    },
    negated: {},
  },
  M00032: {
    values: {
      "1": "fact.M00032.1",
    },
    negated: {},
  },
  M00033: {
    values: {
      "1": "fact.M00033.1",
    },
    negated: {},
  },
  M00046: {
    values: {
      "1": "fact.M00046.1",
    },
    negated: {},
  },
  M40018: {
    values: {
      "1": "fact.M40018.1",
    },
    negated: {},
  },
  M80072: {
    values: {
      "1": "fact.M80072.1",
    },
    negated: {},
  },
  M80009: {
    values: {
      "1": "fact.M80009.1",
    },
    negated: {},
  },
  M70021: {
    values: {
      "1": "fact.M70021.1",
    },
    negated: {},
  },
  M30077: {
    values: {
      "1": "fact.M30077.1",
    },
    negated: {},
  },
  M30054: {
    values: {
      "1": "fact.M30054.1",
    },
    negated: {},
  },
  M60074: {
    values: {
      "1": "fact.M60074.1",
    },
    negated: {},
  },
  M60086: {
    values: {
      "1": "fact.M60086.1",
    },
    negated: {},
  },
  M00003: {
    values: {
      "1": "fact.M00003.1",
    },
    negated: {},
  },
  M20044: {
    values: {
      "1": "fact.M20044.1",
    },
    negated: {},
  },
  M20067: {
    values: {
      "1": "fact.M20067.1",
    },
    negated: {},
  },
  M50015: {
    values: {
      "1": "fact.M50015.1",
    },
    negated: {},
  },
  M80031: {
    values: {
      "1": "fact.M80031.1",
    },
    negated: {},
  },
  E10001: {
    values: {
      "1": "fact.E10001.1",
    },
    negated: {},
  },
  E10003: {
    values: {
      "1": "fact.E10003.1",
    },
    negated: {},
  },
  E10004: {
    values: {
      "1": "fact.E10004.1",
    },
    negated: {},
  },
  M10001: {
    values: {
      "1": "fact.M10001.1",
    },
    negated: {},
  },
  M40034: {
    values: {
      "1": "fact.M40034.1",
    },
    negated: {},
  },
  N00001: {
    values: {
      "1": "fact.N00001.1",
    },
    negated: {},
  },
  M70070: {
    values: {
      "1": "fact.M70070.1",
    },
    negated: {},
  },
  E00003: {
    values: {
      "1": "fact.E00003.1",
    },
    negated: {},
  },
  M80029: {
    values: {
      "1": "fact.M80029.1",
    },
    negated: {},
  },
  G30005: {
    values: {
      "1": "fact.G30005.1",
    },
    negated: {},
  },
  M70039: {
    values: {
      "1": "fact.M70039.1",
    },
    negated: {},
  },
  飞石帮: {
    values: {
      "1": "fact.飞石帮.1",
    },
    negated: {},
  },
  G30007: {
    values: {
      "1": "fact.G30007.1",
    },
    negated: {},
  },
  M60073: {
    values: {
      "1": "fact.M60073.1",
    },
    negated: {},
  },
  M40046: {
    values: {
      "1": "fact.M40046.1",
    },
    negated: {},
  },
  M80030: {
    values: {
      "1": "fact.M80030.1",
    },
    negated: {},
  },
  M80032: {
    values: {
      "1": "fact.M80032.1",
    },
    negated: {},
  },
  E00005: {
    values: {
      "1": "fact.E00005.1",
    },
    negated: {},
  },
  E00009: {
    values: {
      "1": "fact.E00009.1",
    },
    negated: {},
  },
  E00011: {
    values: {
      "1": "fact.E00011.1",
    },
    negated: {},
  },
  E00014: {
    values: {
      "1": "fact.E00014.1",
    },
    negated: {},
  },
  Facility_001: {
    values: {
      "1": "fact.Facility_001.1",
    },
    negated: {},
  },
  Facility_002: {
    values: {
      "1": "fact.Facility_002.1",
    },
    negated: {},
  },
  Facility_003: {
    values: {
      "1": "fact.Facility_003.1",
    },
    negated: {},
  },
  Facility_004: {
    values: {
      "1": "fact.Facility_004.1",
    },
    negated: {},
  },
  Facility_005: {
    values: {
      "1": "fact.Facility_005.1",
    },
    negated: {},
  },
  G30009: {
    values: {
      "1": "fact.G30009.1",
    },
    negated: {},
  },
  S2600_01: {
    values: {
      "1": "fact.S2600_01.1",
    },
    negated: {},
  },
  M30027: {
    values: {
      "1": "fact.M30027.1",
    },
    negated: {},
  },
  M80075: {
    values: {
      "1": "fact.M80075.1",
    },
    negated: {},
  },
  M60094: {
    values: {
      "1": "fact.M60094.1",
    },
    negated: {},
  },
  M80025: {
    values: {
      "1": "fact.M80025.1",
    },
    negated: {},
  },
  M80019: {
    values: {
      "1": "fact.M80019.1",
    },
    negated: {},
  },
  M80047: {
    values: {
      "1": "fact.M80047.1",
    },
    negated: {},
  },
  M60039: {
    values: {
      "1": "fact.M60039.1",
    },
    negated: {},
  },
  M40041: {
    values: {
      "1": "fact.M40041.1",
    },
    negated: {},
  },
  M40051: {
    values: {
      "1": "fact.M40051.1",
    },
    negated: {},
  },
  M60025: {
    values: {
      "1": "fact.M60025.1",
    },
    negated: {},
  },
  M50005: {
    values: {
      "1": "fact.M50005.1",
    },
    negated: {},
  },
  E13006: {
    values: {
      "1": "fact.E13006.1",
    },
    negated: {},
  },
  M30059: {
    values: {
      "1": "fact.M30059.1",
    },
    negated: {},
  },
  M30011: {
    values: {
      "1": "fact.M30011.1",
    },
    negated: {},
  },
  叶云裳学琴: {
    values: {
      "1": "fact.叶云裳学琴.1",
    },
    negated: {},
  },
  M00037: {
    values: {
      "1": "fact.M00037.1",
    },
    negated: {},
  },
  S2002_01: {
    values: {
      "1": "fact.S2002_01.1",
    },
    negated: {},
  },
  M80042: {
    values: {
      "1": "fact.M80042.1",
    },
    negated: {},
  },
  M20047: {
    values: {
      "1": "fact.M20047.1",
    },
    negated: {},
  },
  M40045: {
    values: {
      "1": "fact.M40045.1",
    },
    negated: {},
  },
  M80073: {
    values: {
      "1": "fact.M80073.1",
    },
    negated: {},
  },
  M80084: {
    values: {
      "1": "fact.M80084.1",
    },
    negated: {},
  },
  S2918_01: {
    values: {
      "1": "fact.S2918_01.1",
    },
    negated: {},
  },
  M30067: {
    values: {
      "1": "fact.M30067.1",
    },
    negated: {},
  },
  M40040: {
    values: {
      "1": "fact.M40040.1",
    },
    negated: {},
  },
  M40037: {
    values: {
      "1": "fact.M40037.1",
    },
    negated: {},
  },
  M50033: {
    values: {
      "1": "fact.M50033.1",
    },
    negated: {},
  },
  M50035: {
    values: {
      "1": "fact.M50035.1",
    },
    negated: {},
  },
  M60061: {
    values: {
      "1": "fact.M60061.1",
    },
    negated: {},
  },
  M60077: {
    values: {
      "1": "fact.M60077.1",
    },
    negated: {},
  },
  M70058: {
    values: {
      "1": "fact.M70058.1",
    },
    negated: {},
  },
  M70068: {
    values: {
      "1": "fact.M70068.1",
    },
    negated: {},
  },
  M80054: {
    values: {
      "1": "fact.M80054.1",
    },
    negated: {},
  },
  M00057: {
    values: {
      "1": "fact.M00057.1",
    },
    negated: {},
  },
  M20002: {
    values: {
      "1": "fact.M20002.1",
    },
    negated: {},
  },
  M20038: {
    values: {
      "1": "fact.M20038.1",
    },
    negated: {},
  },
  G30003: {
    values: {
      "1": "fact.G30003.1",
    },
    negated: {},
  },
  M30070: {
    values: {
      "1": "fact.M30070.1",
    },
    negated: {},
  },
  S2700_01: {
    values: {
      "1": "fact.S2700_01.1",
    },
    negated: {},
  },
  S2700_02: {
    values: {
      "1": "fact.S2700_02.1",
    },
    negated: {},
  },
  S2700_03: {
    values: {
      "1": "fact.S2700_03.1",
    },
    negated: {},
  },
  S2800_01: {
    values: {
      "1": "fact.S2800_01.1",
    },
    negated: {},
  },
  S2800_02: {
    values: {
      "1": "fact.S2800_02.1",
    },
    negated: {},
  },
  S2900_01: {
    values: {
      "1": "fact.S2900_01.1",
    },
    negated: {},
  },
  S2900_02: {
    values: {
      "1": "fact.S2900_02.1",
      "2": "fact.S2900_02.2",
    },
    negated: {
      "1": "fact.S2900_02.2",
      "2": "fact.S2900_02.1",
    },
  },
  S2900_03: {
    values: {
      "1": "fact.S2900_03.1",
    },
    negated: {},
  },
  S2900_04: {
    values: {
      "1": "fact.S2900_04.1",
    },
    negated: {},
  },
  S2900_05: {
    values: {
      "1": "fact.S2900_05.1",
    },
    negated: {},
  },
  S2901_01: {
    values: {
      "1": "fact.S2901_01.1",
    },
    negated: {},
  },
  S2901_02: {
    values: {
      "1": "fact.S2901_02.1",
    },
    negated: {},
  },
  S2901_03: {
    values: {
      "1": "fact.S2901_03.1",
      "2": "fact.S2901_03.2",
    },
    negated: {
      "1": "fact.S2901_03.2",
      "2": "fact.S2901_03.1",
    },
  },
  S2902_01: {
    values: {
      "1": "fact.S2902_01.1",
    },
    negated: {},
  },
  M00041: {
    values: {
      "1": "fact.M00041.1",
    },
    negated: {},
  },
  M20065: {
    values: {
      "1": "fact.M20065.1",
    },
    negated: {},
  },
  E21005: {
    values: {
      "1": "fact.E21005.1",
    },
    negated: {},
  },
  E21011: {
    values: {
      "1": "fact.E21011.1",
    },
    negated: {},
  },
  M00048: {
    values: {
      "1": "fact.M00048.1",
    },
    negated: {},
  },
  S2915_01: {
    values: {
      "1": "fact.S2915_01.1",
    },
    negated: {},
  },
  S2916_01: {
    values: {
      "1": "fact.S2916_01.1",
    },
    negated: {},
  },
  M00047: {
    values: {
      "1": "fact.M00047.1",
    },
    negated: {},
  },
  S2919_01: {
    values: {
      "1": "fact.S2919_01.1",
    },
    negated: {},
  },
  M00056: {
    values: {
      "1": "fact.M00056.1",
    },
    negated: {},
  },
  S2920_01: {
    values: {
      "1": "fact.S2920_01.1",
    },
    negated: {},
  },
  M30072: {
    values: {
      "1": "fact.M30072.1",
    },
    negated: {},
  },
  M60087: {
    values: {
      "1": "fact.M60087.1",
    },
    negated: {},
  },
  M80080: {
    values: {
      "1": "fact.M80080.1",
    },
    negated: {},
  },
  G00005: {
    values: {
      "1": "fact.G00005.1",
    },
    negated: {},
  },
  G30008: {
    values: {
      "1": "fact.G30008.1",
    },
    negated: {},
  },
  M00031: {
    values: {
      "1": "fact.M00031.1",
    },
    negated: {},
  },
  M00051: {
    values: {
      "1": "fact.M00051.1",
    },
    negated: {},
  },
  M00052: {
    values: {
      "1": "fact.M00052.1",
    },
    negated: {},
  },
  M20054: {
    values: {
      "1": "fact.M20054.1",
    },
    negated: {},
  },
  M20058: {
    values: {
      "1": "fact.M20058.1",
    },
    negated: {},
  },
  M20066: {
    values: {
      "1": "fact.M20066.1",
    },
    negated: {},
  },
  M30074: {
    values: {
      "1": "fact.M30074.1",
    },
    negated: {},
  },
  M30075: {
    values: {
      "1": "fact.M30075.1",
    },
    negated: {},
  },
  M30082: {
    values: {
      "1": "fact.M30082.1",
    },
    negated: {},
  },
  M40019: {
    values: {
      "1": "fact.M40019.1",
    },
    negated: {},
  },
  M40042: {
    values: {
      "1": "fact.M40042.1",
    },
    negated: {},
  },
  M40063: {
    values: {
      "1": "fact.M40063.1",
    },
    negated: {},
  },
  M40064: {
    values: {
      "1": "fact.M40064.1",
      "2": "fact.M40064.2",
    },
    negated: {
      "1": "fact.M40064.2",
      "2": "fact.M40064.1",
    },
  },
  M50023: {
    values: {
      "1": "fact.M50023.1",
    },
    negated: {},
  },
  M60023: {
    values: {
      "1": "fact.M60023.1",
    },
    negated: {},
  },
  M60024: {
    values: {
      "1": "fact.M60024.1",
    },
    negated: {},
  },
  M60078: {
    values: {
      "1": "fact.M60078.1",
    },
    negated: {},
  },
  M60084: {
    values: {
      "1": "fact.M60084.1",
    },
    negated: {},
  },
  M60092: {
    values: {
      "1": "fact.M60092.1",
    },
    negated: {},
  },
  M70003: {
    values: {
      "1": "fact.M70003.1",
    },
    negated: {},
  },
  M70020: {
    values: {
      "1": "fact.M70020.1",
    },
    negated: {},
  },
  M80005: {
    values: {
      "1": "fact.M80005.1",
    },
    negated: {},
  },
  Back_Free_M_01: {
    values: {
      "1": "fact.Back_Free_M_01.1",
    },
    negated: {},
  },
  FacilityAdd_002_02: {
    values: {
      "1": "fact.FacilityAdd_002_02.1",
    },
    negated: {},
  },
  Kitchen_Work_M_02: {
    values: {
      "1": "fact.Kitchen_Work_M_02.1",
    },
    negated: {},
  },
  S2321_02_03_Option_01: {
    values: {
      "1": "fact.S2321_02_03_Option_01.1",
    },
    negated: {},
  },
  Facility_006: {
    values: {
      "1": "fact.Facility_006.1",
    },
    negated: {},
  },
  S9904_02: {
    values: {
      "1": "fact.S9904_02.1",
    },
    negated: {},
  },
  S9907_01: {
    values: {
      "1": "fact.S9907_01.1",
    },
    negated: {},
  },
  Back_Work_E_01: {
    values: {
      "1": "fact.Back_Work_E_01.1",
    },
    negated: {},
  },
  Back_Work_M_02: {
    values: {
      "1": "fact.Back_Work_M_02.1",
    },
    negated: {},
  },
  Guard_Work_001: {
    values: {
      "1": "fact.Guard_Work_001.1",
    },
    negated: {},
  },
  Meeting_Option_101_01: {
    values: {
      "1": "fact.Meeting_Option_101_01.1",
    },
    negated: {},
  },
  Meeting_Option_102_01: {
    values: {
      "1": "fact.Meeting_Option_102_01.1",
    },
    negated: {},
  },
  Meeting_Option_103_01: {
    values: {
      "1": "fact.Meeting_Option_103_01.1",
    },
    negated: {},
  },
  Meeting_Option_104_01: {
    values: {
      "1": "fact.Meeting_Option_104_01.1",
    },
    negated: {},
  },
  Meeting_Option_105_01: {
    values: {
      "1": "fact.Meeting_Option_105_01.1",
    },
    negated: {},
  },
  Meeting_Option_106_01: {
    values: {
      "1": "fact.Meeting_Option_106_01.1",
    },
    negated: {},
  },
  Alchemy_Work_M_01: {
    values: {
      "1": "fact.Alchemy_Work_M_01.1",
    },
    negated: {},
  },
  Craft_Work_302_001: {
    values: {
      "1": "fact.Craft_Work_302_001.1",
    },
    negated: {},
  },
  Kitchen_Work_M_03: {
    values: {
      "1": "fact.Kitchen_Work_M_03.1",
    },
    negated: {},
  },
  S9906_01_Option_01: {
    values: {
      "1": "fact.S9906_01_Option_01.1",
    },
    negated: {},
  },
  S9906_01_Option_02: {
    values: {
      "1": "fact.S9906_01_Option_02.1",
    },
    negated: {},
  },
  S9906_01_Option_03: {
    values: {
      "1": "fact.S9906_01_Option_03.1",
    },
    negated: {},
  },
  S9906_01_Option_04: {
    values: {
      "1": "fact.S9906_01_Option_04.1",
    },
    negated: {},
  },
  K00001: {
    values: {
      "1": "fact.K00001.1",
    },
    negated: {},
  },
  D00001: {
    values: {
      "1": "fact.D00001.1",
    },
    negated: {},
  },
  M81008: {
    values: {
      "1": "fact.M81008.1",
    },
    negated: {},
  },
  S2003_02: {
    values: {
      "1": "fact.S2003_02.1",
    },
    negated: {},
  },
  Ch_5_6_2_05: {
    values: {
      "1": "fact.Ch_5_6_2_05.1",
    },
    negated: {},
  },
  S2510_01: {
    values: {
      "1": "fact.S2510_01.1",
    },
    negated: {},
  },
  S0014_01: {
    values: {
      "1": "fact.S0014_01.1",
    },
    negated: {},
  },
  S0019_01: {
    values: {
      "1": "fact.S0019_01.1",
    },
    negated: {},
  },
  S0021_01: {
    values: {
      "1": "fact.S0021_01.1",
    },
    negated: {},
  },
  S0022_01: {
    values: {
      "1": "fact.S0022_01.1",
    },
    negated: {},
  },
  S0023_01: {
    values: {
      "1": "fact.S0023_01.1",
    },
    negated: {},
  },
  S0025_01: {
    values: {
      "1": "fact.S0025_01.1",
    },
    negated: {},
  },
  S0100_01: {
    values: {
      "1": "fact.S0100_01.1",
    },
    negated: {},
  },
  S0101_01: {
    values: {
      "1": "fact.S0101_01.1",
    },
    negated: {},
  },
  S0105_01: {
    values: {
      "1": "fact.S0105_01.1",
    },
    negated: {},
  },
  S0203_01: {
    values: {
      "1": "fact.S0203_01.1",
    },
    negated: {},
  },
  S0301_01: {
    values: {
      "1": "fact.S0301_01.1",
    },
    negated: {},
  },
  S0305_01: {
    values: {
      "1": "fact.S0305_01.1",
    },
    negated: {},
  },
  S0501_01: {
    values: {
      "1": "fact.S0501_01.1",
    },
    negated: {},
  },
  S2001_01: {
    values: {
      "1": "fact.S2001_01.1",
    },
    negated: {},
  },
  S2600_00: {
    values: {
      "1": "fact.S2600_00.1",
    },
    negated: {},
  },
  M20007: {
    values: {
      "1": "fact.M20007.1",
    },
    negated: {},
  },
  M20040: {
    values: {
      "1": "fact.M20040.1",
    },
    negated: {},
  },
  M20027: {
    values: {
      "1": "fact.M20027.1",
    },
    negated: {},
  },
  M20036: {
    values: {
      "1": "fact.M20036.1",
    },
    negated: {},
  },
  M20033: {
    values: {
      "1": "fact.M20033.1",
    },
    negated: {},
  },
  M20042: {
    values: {
      "1": "fact.M20042.1",
    },
    negated: {},
  },
  E30001: {
    values: {
      "1": "fact.E30001.1",
    },
    negated: {},
  },
  M10015: {
    values: {
      "1": "fact.M10015.1",
    },
    negated: {},
  },
  E00015: {
    values: {
      "1": "fact.E00015.1",
    },
    negated: {},
  },
  M00020: {
    values: {
      "1": "fact.M00020.1",
    },
    negated: {},
  },
  M10011: {
    values: {
      "1": "fact.M10011.1",
    },
    negated: {},
  },
  E00012: {
    values: {
      "1": "fact.E00012.1",
    },
    negated: {},
  },
  E20004: {
    values: {
      "1": "fact.E20004.1",
    },
    negated: {},
  },
  G30013: {
    values: {
      "1": "fact.G30013.1",
    },
    negated: {},
  },
  G30012: {
    values: {
      "1": "fact.G30012.1",
    },
    negated: {},
  },
  M00021: {
    values: {
      "1": "fact.M00021.1",
    },
    negated: {},
  },
  M30012: {
    values: {
      "1": "fact.M30012.1",
    },
    negated: {},
  },
  M10014: {
    values: {
      "1": "fact.M10014.1",
    },
    negated: {},
  },
  M00011: {
    values: {
      "1": "fact.M00011.1",
    },
    negated: {},
  },
  M10021: {
    values: {
      "1": "fact.M10021.1",
    },
    negated: {},
  },
  M00038: {
    values: {
      "1": "fact.M00038.1",
    },
    negated: {},
  },
  E21007: {
    values: {
      "1": "fact.E21007.1",
    },
    negated: {},
  },
  M00044: {
    values: {
      "1": "fact.M00044.1",
    },
    negated: {},
  },
  M00049: {
    values: {
      "1": "fact.M00049.1",
    },
    negated: {},
  },
  M00010: {
    values: {
      "1": "fact.M00010.1",
    },
    negated: {},
  },
  M20045: {
    values: {
      "1": "fact.M20045.1",
    },
    negated: {},
  },
  M10007: {
    values: {
      "1": "fact.M10007.1",
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
  Facility_001_01: "measure.Facility_001_01",
  Facility_002_01: "measure.Facility_002_01",
  Facility_003_01: "measure.Facility_003_01",
  Facility_004_01: "measure.Facility_004_01",
  Facility_005_01: "measure.Facility_005_01",
};

export const flagMeasureKey = (flag: string): string => flagMeasures[flag] || "";
