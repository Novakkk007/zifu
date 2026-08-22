import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(
  root,
  "docs/classics/absorbed-bazi-repo/zipingzhenquan.md"
);
const outputPath = resolve(root, "src/data/classic-texts.json");
const lines = readFileSync(sourcePath, "utf8").split(/\r?\n/);

const chapters = [];
let currentChapter;
let paragraphLines = [];

function flushParagraph() {
  if (!currentChapter || paragraphLines.length === 0) return;

  const paragraph = paragraphLines.join("\n").replaceAll("**", "").trim();

  if (paragraph) currentChapter.paragraphs.push(paragraph);
  paragraphLines = [];
}

for (const line of lines) {
  const heading = line.match(/^###\s+(.+?)\s*$/);
  if (heading) {
    flushParagraph();
    currentChapter = { title: heading[1], paragraphs: [] };
    chapters.push(currentChapter);
    continue;
  }

  if (!currentChapter) continue;

  if (/^\[子平真诠评注.+\]\(https?:\/\//.test(line.trim())) {
    flushParagraph();
    continue;
  }

  if (!line.trim()) {
    flushParagraph();
    continue;
  }

  paragraphLines.push(line.trim());
}

flushParagraph();

if (
  chapters.length !== 47 ||
  chapters.some(chapter => !chapter.paragraphs.length)
) {
  throw new Error(
    `Unexpected classic structure: ${chapters.length} chapters, ` +
      `${chapters.filter(chapter => !chapter.paragraphs.length).length} empty`
  );
}

writeFileSync(
  outputPath,
  `${JSON.stringify([{ bookId: "ziping", chapters }], null, 2)}\n`,
  "utf8"
);

console.log(`Generated ${chapters.length} chapters at ${outputPath}`);
