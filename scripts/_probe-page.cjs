// scripts/_probe-page.cjs — 首屏结构侦察（真实浏览器·动效感知）
// 用法: PAGE=/daily SUFFIX=before node scripts/_probe-page.cjs
const { chromium } = require('playwright');

(async () => {
  const pagePath = process.env.PAGE || '/daily';
  const base = process.env.BASE || 'http://localhost:3000';
  const suffix = process.env.SUFFIX || 'before';
  const errors = [];
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  await page.goto(base + pagePath, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(e => errors.push('GOTO ' + e.message));
  await page.waitForTimeout(2500);

  const info = await page.evaluate(() => {
    const out = { vw: innerWidth, vh: innerHeight, scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight };
    const main = document.querySelector('main') || document.body;
    out.children = [...main.children].map(el => {
      const r = el.getBoundingClientRect();
      return { tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 80),
               top: Math.round(r.top), h: Math.round(r.height),
               txt: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60) };
    });
    // 首屏带内可见文本元素（含透明度）
    const vis = [];
    document.querySelectorAll('main h1,main h2,main h3,main p,main button,main a,main input,main [class*="rounded"]').forEach(el => {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      if (r.top < 1000 && r.height > 4 && st.display !== 'none') {
        vis.push({ t: el.tagName.toLowerCase(), top: Math.round(r.top), op: st.opacity,
                   txt: (el.innerText || el.placeholder || '').replace(/\s+/g, ' ').trim().slice(0, 36) });
      }
    });
    out.vis = vis.slice(0, 30);
    return out;
  });
  console.log(JSON.stringify(info, null, 1));

  const realErr = errors.filter(e => !/401|auth\/refresh|Failed to load resource/.test(e));
  console.log('ERRORS:', JSON.stringify(realErr.slice(0, 8)), 'total=' + errors.length);

  await page.screenshot({ path: `C:/Users/asus/layout-audit/daily-probe-375-${suffix}-top.png` });
  await page.evaluate(() => window.scrollTo(0, Math.round(window.innerHeight * 0.9)));
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => ({ y: Math.round(window.scrollY), sh: document.documentElement.scrollHeight }));
  console.log('SCROLL:', JSON.stringify(after));
  await page.screenshot({ path: `C:/Users/asus/layout-audit/daily-probe-375-${suffix}-s1.png` });
  await browser.close();
  process.exit(0);
})();
