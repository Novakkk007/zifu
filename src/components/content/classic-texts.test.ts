import { describe, expect, it } from "vitest";
import { CLASSIC_TEXTS, getClassicText } from "./classic-texts";

describe("classic texts", () => {
  it("loads the complete 47-chapter Zi Ping Zhen Quan text", () => {
    const text = getClassicText("ziping");

    expect(CLASSIC_TEXTS).toHaveLength(1);
    expect(text?.chapters).toHaveLength(47);
    expect(text?.chapters[0]?.title).toBe("一、论十干十二支");
    expect(text?.chapters.at(-1)?.title).toBe("四十七、论杂格");
    expect(
      text?.chapters.reduce(
        (count, chapter) => count + chapter.paragraphs.length,
        0
      )
    ).toBe(295);
    expect(text?.chapters.every(chapter => chapter.paragraphs.length > 0)).toBe(
      true
    );
  });

  it("resolves the duplicate legacy book id to the canonical text", () => {
    expect(getClassicText("zipingzhenquan")).toBe(getClassicText("ziping"));
  });

  it("does not include source-site promotions or commentary links", () => {
    const fullText = getClassicText("ziping")
      ?.chapters.flatMap(chapter => chapter.paragraphs)
      .join("\n");

    expect(fullText).toContain("天地之间,一气而己");
    expect(fullText).not.toMatch(/https?:\/\//);
    expect(fullText).not.toContain("qq群");
  });
});
