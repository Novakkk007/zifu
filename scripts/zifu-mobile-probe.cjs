// Mobile overflow + white-screen probe via Playwright (uses project's playwright-core)
// Targets the local dev server (assumed running on :3000)
const { chromium } = require('playwright');

const routes = [
  ['home', '/'],
  ['daily', '/daily'],
  ['bazi', '/bazi'],
  ['hepan', '/bazi/hepan'],
];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();

  for (const [name, route] of routes) {
    try {
      await page.goto('http://localhost:3000' + route, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(800); // allow animations
      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const vh = document.documentElement.clientHeight;
        const sW = document.documentElement.scrollWidth;
        const sH = document.documentElement.scrollHeight;
        let over = [];
        document.querySelectorAll('body *').forEach(el => {
          const r = el.getBoundingClientRect();
          const cls = typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal !== undefined ? el.className.baseVal : '');
          if (r.right > vw + 8 && r.width > 0) {
            over.push({ tag: el.tagName, cls: String(cls).slice(0, 40), pxOver: Math.round(r.right - vw), w: Math.round(r.width) });
          }
        });
        over.sort((a, b) => b.pxOver - a.pxOver);
        return {
          vw, vh, scrollW: sW, scrollH: sH,
          hOverflow: sW > vw + 4, vOverflow: sH > vh + 200,
          textLen: (document.body.innerText || '').length,
          topOverflow: over.slice(0, 6)
        };
      });
      const status = (m.scrollW > m.vw + 4) ? '!! H-OVERFLOW' : (m.textLen < 30 ? '!! EMPTY' : 'OK');
      console.log(`[${name}] ${route} => ${status}`);
      console.log(`   vw=${m.vw} scrollW=${m.scrollW} scrollH=${m.scrollH} hOver=${m.hOverflow} textLen=${m.textLen}`);
      if (m.topOverflow.length) console.log('   overflow:', JSON.stringify(m.topOverflow));
      await page.screenshot({ path: `C:/Users/asus/layout-audit/pw-${name}-375.png` });
    } catch (e) {
      console.log(`[${name}] ${route} => ERROR ${e.message.slice(0, 120)}`);
    }
  }
  await browser.close();
})();
