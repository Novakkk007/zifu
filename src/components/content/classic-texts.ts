/** 藏经阁全文数据加载与书目别名解析。 */
import raw from "@/data/classic-texts.json?raw";

export type ClassicChapter = {
  title: string;
  paragraphs: string[];
};

export type ClassicText = {
  bookId: string;
  chapters: ClassicChapter[];
};

export const CLASSIC_TEXTS: ClassicText[] = JSON.parse(raw) as ClassicText[];

const CLASSIC_TEXT_ALIASES: Readonly<Record<string, string>> = {
  zipingzhenquan: "ziping",
};

export function getClassicText(bookId: string): ClassicText | undefined {
  const canonicalId = CLASSIC_TEXT_ALIASES[bookId] ?? bookId;
  return CLASSIC_TEXTS.find(text => text.bookId === canonicalId);
}
