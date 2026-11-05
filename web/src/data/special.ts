export type SpecialScript = {
  id: string;
  names: Record<string, string>;
};

export const specialScripts: SpecialScript[] = [
  {
    id: "food_menu_001",
    names: {
      "zh-tw": "歇息進食選單",
      "zh-cn": "歇息进食菜单",
      en: "Rest & Dine Menu",
    },
  },
  {
    id: "meeting_option_01",
    names: {
      "zh-tw": "唐門議事選單",
      "zh-cn": "唐门议事菜单",
      en: "Tang Sect Council Menu",
    },
  },
  {
    id: "talk_brother4_option_04",
    names: {
      "zh-tw": "彈珠遊戲",
      "zh-cn": "弹珠游戏",
      en: "Pinball Game",
    },
  },
  {
    id: "S8500_01_02",
    names: {
      "zh-tw": "夢中媳婦",
      "zh-cn": "梦中媳妇",
      en: "Dream Wife",
    },
  },
];

const FALLBACK_LANGS = ["zh-tw", "zh-cn", "en"];

export const specialScriptName = (entry: SpecialScript, lang: string): string => {
  const names = entry.names || {};
  if (lang && names[lang]) return names[lang];
  for (const id of FALLBACK_LANGS) {
    if (names[id]) return names[id];
  }
  return entry.id;
};
