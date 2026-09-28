// scripts/shot-qimen.cjs — 奇门页审计：首屏节奏度量 + 起局→九宫盘度量（375x812 / 1440x900）
// 用法: node scripts/shot-qimen.cjs   （可选 QIMEN_BASE=<url> 直探生产；QIMEN_SUFFIX=-before 区分图名）
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = 'C:/Users/asus/layout-audit/';
const SFX = process.env.QIMEN_SUFFIX || '';
fs.mkdirSync(OUT, { recursive: true });
const routes = [['m', 375, 812], ['d', 1440, 900]];
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  let bad = 0;
  for (const [tag, w, h] of routes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    try {
      await page.goto((process.env.QIMEN_BASE || 'http://localhost:3000') + '/qimen', { waitUntil: 'domcontentloaded', timeout: 40000 });
      await page.waitForTimeout(2200);
      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
        const rect = el => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width) }; };
        const bands = [...document.querySelectorAll('.zf-fade-to-silk, .zf-fade-to-deep')].map(rect);
        const first = document.querySelector('input');
        let card = null;
        if (first) { let n = first; for (let i = 0; i < 7 && n; i++, n = n.parentElement) { const c = n.className && String(n.className); if (c && /rounded|card|border/.test(c) && n.tagName !== 'INPUT') { card = n; break; } } if (!card) card = first.parentElement; }
        const h1 = document.querySelector('h1');
        return {
          vw, vh, scrollW: document.documentElement.scrollWidth,
          textLen: (document.body.innerText || '').length,
          h1: h1 ? { text: h1.textContent.trim().slice(0, 30), ...rect(h1) } : null,
          bands, card: card ? rect(card) : null,
        };
      });
      console.log('==VIEW ' + tag + ' ' + w + 'x' + h + '== BAND=' + JSON.stringify(m.bands) + ' CARD=' + JSON.stringify(m.card) + ' scrollW=' + m.scrollW + ' textLen=' + m.textLen);
      await page.screenshot({ path: OUT + 'qimen-first-' + tag + SFX + '.png' });
      if (m.card && m.card.top < m.vh + 300) {
        const clip = { x: 0, y: Math.max(0, Math.min(m.card.top - 24, m.vh - 140)), width: w, height: Math.min(m.vh, Math.max(220, m.card.h + 90)) };
        await page.screenshot({ path: OUT + 'qimen-form-' + tag + SFX + '.png', clip });
      }
      const btn = page.getByRole('button', { name: '起局', exact: true }).first();
      await btn.scrollIntoViewIfNeeded();
      await btn.click({ timeout: 10000 });
      await page.waitForFunction(() => document.body.innerText.replace(/\s/g, '').includes('九宫局盘'), null, { timeout: 20000 });
      await page.waitForTimeout(1500);
      const p = await page.evaluate(() => {
        const rect = el => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width) }; };
        const sec = [...document.querySelectorAll('section')].find(s => s.textContent.replace(/\s/g, '').includes('九宫局盘'));
        const cells = sec ? [...sec.querySelectorAll('button')].filter(b => String(b.className).includes('min-h-')) : [];
        const hs = cells.map(c => rect(c).h);
        return {
          cells: cells.length,
          minH: hs.length ? Math.min(...hs) : 0,
          maxH: hs.length ? Math.max(...hs) : 0,
          overflowCells: cells.filter(c => c.scrollWidth > c.clientWidth + 1).length,
          breathe: sec ? sec.querySelectorAll('.animate-gold-breathe').length : 0,
          scrollW: document.documentElement.scrollWidth,
        };
      });
      console.log('PLATE ' + tag + ' ' + JSON.stringify(p));
      await page.evaluate(() => { const s = [...document.querySelectorAll('section')].find(x => x.textContent.replace(/\s/g, '').includes('九宫局盘')); if (s) s.scrollIntoView({ block: 'start' }); });
      await page.waitForTimeout(400);
      await page.screenshot({ path: OUT + 'qimen-plate-' + tag + SFX + '.png' });
      console.log('errs=' + JSON.stringify(errs));
      if (errs.length) bad++;
    } catch (e) { console.log('==VIEW ' + tag + ' ERROR ' + e.message); console.log('errs=' + JSON.stringify(errs)); bad++; }
    await ctx.close();
  }
  await browser.close();
  console.log('DONE bad=' + bad);
})();
