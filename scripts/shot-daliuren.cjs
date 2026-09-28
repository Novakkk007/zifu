// scripts/shot-daliuren.cjs — 大六壬页双端审计（首屏带/表单/起课结果 + 零报错断言）
// 用法：node scripts/shot-daliuren.cjs            （默认后缀 before）
//       DALIUREN_SUFFIX=after node scripts/shot-daliuren.cjs
//       DALIUREN_BASE=<url> 可直探生产站
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = (process.env.DALIUREN_BASE || 'http://localhost:3000').replace(/\/$/, '');
const SUFFIX = process.env.DALIUREN_SUFFIX || 'before';
const OUT = 'C:/Users/asus/layout-audit';

async function discoverRoute(page) {
  try {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    const href = await page.evaluate(() => {
      const as = [...document.querySelectorAll('a[href]')];
      const hit = as.find(a => /大六壬|六壬/.test(a.textContent || ''));
      return hit ? hit.getAttribute('href') : null;
    });
    if (href) return new URL(href, BASE).pathname;
  } catch (e) {}
  return '/daliuren';
}

async function runView(browser, view, vp) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.addInitScript(() => { window.__errs = []; window.addEventListener('error', e => window.__errs.push(String(e.message))); });

  const route = await discoverRoute(page);
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1600);
  let titleOk = await page.evaluate(() => document.body.innerText.includes('大六壬'));
  if (!titleOk) {
    await page.goto(BASE + '/daliuren', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1600);
    titleOk = await page.evaluate(() => document.body.innerText.includes('大六壬'));
  }

  const mk = name => path.join(OUT, `daliuren-${view}-${name}-${SUFFIX}.png`);
  await page.screenshot({ path: mk('top') });

  const m1 = await page.evaluate(() => {
    const band = document.querySelector('.zf-fade-to-silk');
    const bandH = band ? Math.round(band.getBoundingClientRect().height) : -1;
    const bandDeep = document.querySelector('.zf-fade-to-deep');
    const deepH = bandDeep ? Math.round(bandDeep.getBoundingClientRect().height) : -1;
    const form = document.querySelector('form');
    const formTop = form ? Math.round(form.getBoundingClientRect().top + window.scrollY) : -1;
    return { bandH, deepH, formTop, scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight, vw: window.innerWidth };
  });

  let formShot = false;
  try {
    const form = page.locator('form').first();
    if (await form.count()) {
      await form.scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
      const sec = form.locator('xpath=ancestor::section[1]');
      if (await sec.count()) { await sec.first().screenshot({ path: mk('form') }); }
      else { await page.screenshot({ path: mk('form') }); }
      formShot = true;
    }
  } catch (e) { errs.push('form-shot: ' + e.message); }

  const qk = { clicked: false, result: '' };
  try {
    const btn = page.locator('button', { hasText: '起课' }).first();
    if (await btn.count()) {
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      qk.clicked = true;
      await page.waitForTimeout(2800);
      const txt = await page.evaluate(() => document.body.innerText);
      qk.result = ['三传', '四课', '课体', '贵人', '天将'].filter(k => txt.includes(k)).join(',');
      await page.screenshot({ path: mk('result') });
    }
  } catch (e) { errs.push('qike: ' + e.message); }

  const domErrs = await page.evaluate(() => window.__errs || []);
  await ctx.close();
  return { view, route, titleOk, ...m1, formShot, qk, errs: [...errs, ...domErrs] };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const out = [];
  out.push(await runView(browser, '375', { width: 375, height: 812 }));
  out.push(await runView(browser, '1440', { width: 1440, height: 900 }));
  await browser.close();
  let bad = 0;
  for (const r of out) {
    const overflowX = r.scrollW > r.vw + 1;
    const e = (r.errs || []).filter(x => !/favicon|auth\.refresh|net::ERR_|401/i.test(x));
    if (overflowX || e.length || !r.titleOk) bad++;
    console.log(JSON.stringify({ ...r, errs: r.errs, overflowX }, null, 1));
  }
  console.log(bad ? 'SMOKE-FAIL' : 'SMOKE-OK');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
