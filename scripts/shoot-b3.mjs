/** B3 视觉验收截图：静态页 + 八字排盘交互态（系统 Chrome，无下载） */
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const OUT = "/Users/huangjunmian/zifu-shots/";
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "shell",
  args: ["--hide-scrollbars", "--force-device-scale-factor=1"],
});

async function shoot(url, name, { width = 1440, height = 1000, fullPage = true } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(BASE + url, { waitUntil: "networkidle0", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 2200)); // GSAP 入场
  await page.screenshot({ path: `${OUT}${name}.png`, fullPage });
  const kb = Math.round(fs.statSync(`${OUT}${name}.png`).size / 1024);
  console.log(`${name}.png ${kb}KB`);
  await page.close();
  return page;
}

/* ---- 静态页（桌面 1440） ---- */
for (const [url, name] of [
  ["/", "home"],
  ["/bazi", "bazi-form"],
  ["/wiki", "wiki"],
  ["/liuyao", "liuyao"],
  ["/ziwei", "ziwei-form"],
  ["/hecan", "hecan-form"],
  ["/qimen", "qimen"],
  ["/daliuren", "daliuren"],
  ["/qizheng", "qizheng"],
  ["/daily", "daily"],
  ["/toolkit", "toolkit"],
]) {
  await shoot(url, name);
}

/* ---- 八字排盘交互态 ---- */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(BASE + "/bazi", { waitUntil: "networkidle0", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 1500));
  // 填生辰：1990-05-15 未时(7) 30分 男
  const typeInto = async (id, v) => {
    await page.click(`#${id}`, { clickCount: 3 });
    await page.type(`#${id}`, v, { delay: 20 });
  };
  await typeInto("bazi-year", "1990");
  await typeInto("bazi-month", "5");
  await typeInto("bazi-day", "15");
  await page.select("#bazi-hour", "7");
  await typeInto("bazi-minute", "30");
  // gender SegmentedControl：点含「乾」的按钮
  await page.evaluate(() => {
    const seg = document.getElementById("bazi-gender");
    const btn = [...(seg?.querySelectorAll("button") ?? [])].find((b) =>
      b.textContent?.includes("乾"),
    );
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  // 提交：找含「排盘」的按钮
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const submit = btns.find((b) => b.textContent?.match(/开始排盘|排盘|起盘/) && !b.disabled);
    submit?.click();
  });
  // 等结果（四柱区块或 canvas 出现）
  try {
    await page.waitForFunction(
      () => document.body.innerText.match(/年柱|四柱|日主/),
      { timeout: 20000 },
    );
  } catch { console.log("bazi result wait timeout"); }
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: `${OUT}bazi-result.png`, fullPage: true });
  console.log(`bazi-result.png ${Math.round(fs.statSync(`${OUT}bazi-result.png`).size / 1024)}KB`);
  await page.close();
}

/* ---- 移动端 390 ---- */
for (const [url, name] of [
  ["/", "m-home"],
  ["/bazi", "m-bazi"],
  ["/wiki", "m-wiki"],
]) {
  await shoot(url, name, { width: 390, height: 844 });
}

await browser.close();
console.log("DONE");
