// Test /daily card: scroll to the 忌 card, wait for whileInView to settle, re-measure scrollWidth
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/daily', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);

  async function measure(label) {
    const m = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      vw: document.documentElement.clientWidth,
      y: window.scrollY,
      cards: [...document.querySelectorAll('.bg-silk2.p-7')].map(c => {
        const r = c.getBoundingClientRect();
        return { right: Math.round(r.right), width: Math.round(r.width), x: c._x };
      })
    }));
    console.log(`${label}: scrollW=${m.sw} (vw=${m.vw}) scrollY=${m.y}`);
  }

  await measure('initial');

  // scroll the 忌 card into view
  const topOfCard = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.bg-silk2.p-7')];
    if (cards.length >= 2) { cards[1].scrollIntoView({ block: 'center' }); return cards[1].getBoundingClientRect().top; }
    return 0;
  });
  await page.waitForTimeout(2000); // let 0.8s animation settle
  await measure('after-scroll-2s');
  await page.waitForTimeout(1000);
  await measure('after-scroll-3s');

  // also check during active scroll animation (mid-animation) for flash
  const midY = await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); return window.scrollY; });
  await page.waitForTimeout(150);
  await measure('at-bottom-mid');
  await page.waitForTimeout(2500);
  await measure('at-bottom-settled');

  await browser.close();
})();
