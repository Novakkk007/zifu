// Diagnostic for /daily horizontal overflow: identify the overhanging card(s)
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/daily', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const boxes = [];
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      const cls = typeof el.className === 'string' ? el.className : '';
      // only report elements that overflow right margin meaningfully (skip decorative glyph-drift & marquee)
      if (r.right > vw + 4 && r.width > 40 && !cls.includes('animate-glyph-drift') && !cls.includes('marquee')) {
        const txt = (el.innerText || el.textContent || '').trim().slice(0, 40).replace(/\s+/g, ' ');
        boxes.push({
          tag: el.tagName, cls: cls.slice(0, 70),
          left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
          overBy: Math.round(r.right - vw), top: Math.round(r.top), text: txt
        });
      }
    });
    boxes.sort((a, b) => b.overBy - a.overBy);
    return { vw, scrollW: document.documentElement.scrollWidth, offenders: boxes.slice(0, 12) };
  });
  console.log('vw=', m.vw, 'scrollW=', m.scrollW);
  m.offenders.forEach(o => console.log(`  >${o.overBy}px ${o.tag} L${o.left} R${o.right} W${o.width} top${o.top} | ${o.cls} | ${o.text}`));
  await page.screenshot({ path: 'C:/Users/asus/layout-audit/daily-overflow-diag.png', fullPage: false });
  await browser.close();
})();
