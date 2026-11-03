export type OpenccConfig = {
  from: string;
  to: string;
  variants?: string;
};

export type LanguageMeta = {
  native: string;
  html: string;
  label: string;
  opencc?: OpenccConfig | null;
};
