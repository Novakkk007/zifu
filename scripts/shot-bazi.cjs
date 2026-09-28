// scripts/shot-bazi.cjs — 八字页首屏审计（375x812 移动 + 1440x900 桌面）
// 产出：首屏截图/表单区截图/全页截图 + DOM 度量 JSON（hero/过渡带/表单卡/首屏文字）
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = 'C:/Users/asus/layout-audit/';
fs.mkdirSync(OUT, { recursive: true });
const routes = [['m', 375, 812], ['d', 1440, 900]];
(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  for (const [tag, w, h] of routes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
    try {
      await page.goto((process.env.BAZI_BASE || 'http://localhost:3000') + '/bazi', { waitUntil: 'domcontentloaded', timeout: 40000 });
      await page.waitForTimeout(2000);
      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
        const rect = el => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width) }; };
        const bands = [...document.querySelectorAll('div')].filter(d => (d.getAttribute('style') || '').includes('linear-gradient')).map(rect);
        const first = document.querySelector('input');
        let card = null;
        if (first) { let n = first; for (let i = 0; i < 7 && n; i++, n = n.parentElement) { const c = n.className && String(n.className); if (c && /rounded|card|border/.test(c) && n.tagName !== 'INPUT') { card = n; break; } } if (!card) card = first.parentElement; }
        const sections = [...document.querySelectorAll('section')].slice(0, 6).map((s, i) => ({ i, ...rect(s), cls: String(s.className).slice(0, 60) }));
        const h1 = document.querySelector('h1');
        return {
          vw, vh, scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight,
          textLen: (document.body.innerText || '').length,
          h1: h1 ? { text: h1.textContent.trim().slice(0, 30), ...rect(h1), fs: getComputedStyle(h1).fontSize } : null,
          bands, card: card ? rect(card) : null, sections,
          topTexts: [...document.querySelectorAll('body *')].filter(e => e.children.length === 0 && (e.textContent || '').trim().length > 1).map(e => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim().slice(0, 16), top: Math.round(r.top), fs: getComputedStyle(e).fontSize }; }).filter(x => x.top > -60 && x.top < vh).slice(0, 30)
        };
      });
      console.log('==VIEW ' + tag + ' ' + w + 'x' + h + '==');
      console.log(JSON.stringify(m, null, 1));
      console.log('errs=' + JSON.stringify(errs));
      await page.screenshot({ path: OUT + 'bazi-first-' + tag + '.png' });
      if (m.card && m.card.top < m.vh + 200) {
        const clip = { x: 0, y: Math.max(0, Math.min(m.card.top - 20, m.vh - 120)), width: w, height: Math.min(m.vh, Math.max(200, m.card.h + 80)) };
        await page.screenshot({ path: OUT + 'bazi-form-' + tag + '.png', clip });
      }
      await page.screenshot({ path: OUT + 'bazi-full-' + tag + '.png', fullPage: true });
      console.log('shots saved: ' + OUT + 'bazi-*-' + tag + '.png');
    } catch (e) { console.log('==VIEW ' + tag + ' ERROR ' + e.message); }
    await ctx.close();
  }
  await browser.close();
})();
