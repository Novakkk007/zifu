// home layout detail measure — 2026-09-19 night round (bottom nav / light band / h-overflow)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  await p.goto((process.env.BASE || 'http://localhost:3000') + '/', { waitUntil: 'networkidle', timeout: 40000 });
  await p.waitForTimeout(1800);
  const r = await p.evaluate(() => {
    const vh = window.innerHeight, vw = window.innerWidth;
    const de = document.documentElement;
    const fixedBottom = [];
    document.querySelectorAll('*').forEach(el => {
      const s = getComputedStyle(el);
      if ((s.position === 'fixed' || s.position === 'sticky') && el.getBoundingClientRect().height > 20) {
        const rr = el.getBoundingClientRect();
        if (rr.top < vh && rr.bottom > vh - 220) {
          fixedBottom.push({ tag: el.tagName, cls: String(el.className || '').slice(0, 70), pos: s.position, top: Math.round(rr.top), bottom: Math.round(rr.bottom), h: Math.round(rr.height), z: s.zIndex });
        }
      }
    });
    const cand = [];
    document.querySelectorAll('nav, [class*=Nav], [class*=nav], [class*=Bottom], [class*=bottom], [class*=Tab], [class*=tab], [class*=Footer], [class*=footer]').forEach(el => {
      const rr = el.getBoundingClientRect();
      if (rr.height > 8 && rr.width > 80 && rr.bottom > vh - 320) {
        cand.push({ tag: el.tagName, cls: String(el.className || '').slice(0, 70), top: Math.round(rr.top), bottom: Math.round(rr.bottom), h: Math.round(rr.height), pos: getComputedStyle(el).position });
      }
    });
    const seen = {}; const candU = [];
    cand.forEach(c => { const k = c.tag + '|' + c.cls; if (!seen[k]) { seen[k] = 1; candU.push(c); } });
    const samples = [];
    [810, 795, 770, 745, 730, 700, 400].forEach(y => {
      const el = document.elementFromPoint(187, y);
      const s = el ? getComputedStyle(el) : null;
      let chain = [], cur = el;
      while (cur && chain.length < 4) { chain.push(cur.tagName + '.' + String(cur.className || '').split(' ')[0].slice(0, 40)); cur = cur.parentElement; }
      samples.push({ y: y, el: el ? el.tagName : null, cls: el ? String(el.className || '').slice(0, 70) : null, bg: s ? s.backgroundColor : null, chain: chain.join(' > ') });
    });
    const htmlCS = getComputedStyle(de), bodyCS = getComputedStyle(document.body);
    return {
      vh: vh, vw: vw, scrollH: de.scrollHeight, scrollW: de.scrollWidth,
      hasHOverflow: de.scrollWidth > vw + 1,
      htmlBg: htmlCS.backgroundColor, bodyBg: bodyCS.backgroundColor,
      fixedBottom: fixedBottom.slice(0, 12), cand: candU.slice(0, 20),
      samples: samples, bodyTextLen: (document.body.innerText || '').length
    };
  });
  console.log('MEASURE ' + JSON.stringify(r));
  console.log('errs=' + JSON.stringify(errs));
  await b.close();
})().catch(e => { console.log('FATAL ' + String(e)); process.exit(1); });
