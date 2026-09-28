
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 120)));
  await p.goto((process.env.BASE || 'http://localhost:3000') + '/', { waitUntil: 'networkidle', timeout: 40000 });
  await p.waitForTimeout(1600);
  const r = await p.evaluate(() => {
    const vh = window.innerHeight, vw = window.innerWidth;
    const h1 = document.querySelector('h1');
    const cs = h1 ? getComputedStyle(h1) : null;
    const inVp = el => { const r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0 && r.width > 0; };
    const cands = [...document.querySelectorAll('h1,h2,h3,p,a,span,button')].filter(e => (e.textContent || '').trim().length > 0 && inVp(e));
    const hidden = cands.filter(e => { const s = getComputedStyle(e); return s.opacity === '0' || s.visibility === 'hidden' || s.display === 'none'; });
    return { h1: h1 ? h1.textContent.trim().slice(0, 30) : null, h1op: cs ? cs.opacity : null,
             vpTextCount: cands.length, vpHiddenCount: hidden.length,
             textLen: (document.body.innerText || '').length,
             scrollW: document.documentElement.scrollWidth, vw: vw };
  });
  console.log('HOME_CHECK ' + JSON.stringify(r));
  console.log('errs=' + JSON.stringify(errs));
  await b.close();
})();
