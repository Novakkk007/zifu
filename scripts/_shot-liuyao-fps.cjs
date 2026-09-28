/* 六爻页帧率分级冒烟（T-20260927）：
 * 375 lite/full 双通道 + 1280 默认通道；断言 dataset.mtier、零 JS 报错、摇卦流程走通。
 * 运行：cd 仓库 && node scripts/_shot-liuyao-fps.cjs（或 NODE_PATH=仓库/node_modules node <本文件>）
 */
let chromium
try {
  chromium = require('playwright').chromium
} catch (e) {
  chromium = require('F:/紫府文件/zifu-v9/zifu/node_modules/playwright').chromium
}

const BASE = process.env.LIUYAO_FPS_BASE || 'http://localhost:3000'
const OUT = 'C:/Users/asus/layout-audit/'
const IGNORE = ['auth.refresh', 'favicon', 'status of 401']
const HARD = []

async function run(browser, name, url, viewport, shot, expectTier) {
  const page = await browser.newPage({ viewport })
  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const t = m.text()
    if (IGNORE.some((s) => t.includes(s))) return
    errs.push('console: ' + t)
  })
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1600)
  const tier0 = await page.evaluate(() => document.documentElement.dataset.mtier || 'unset')
  for (let i = 0; i < 2; i += 1) {
    const btn = page.getByRole('button', { name: /摇\s*卦/ })
    await btn.scrollIntoViewIfNeeded()
    await btn.click()
    await page.waitForTimeout(1700)
  }
  const tier1 = await page.evaluate(() => document.documentElement.dataset.mtier || 'unset')
  const prog = await page.evaluate(() => (document.body.innerText.match(/第\s*\d\s*\/\s*6\s*摇/) || ['n/a'])[0])
  if (shot) await page.screenshot({ path: OUT + shot })
  await page.close()
  if (tier0 !== expectTier) HARD.push(name + ': tier0=' + tier0 + ' expect=' + expectTier)
  if (errs.length) HARD.push(name + ': errs=' + errs.join(' | '))
  const pm = prog.match(/第\s*(\d)\s/)
  if (!pm || Number(pm[1]) < 2) HARD.push(name + ': progress=' + prog)
  console.log(JSON.stringify({ name, tier0, tier1, prog, errs }))
}

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  await run(browser, 'mobile-lite', BASE + '/liuyao?mtier=lite', { width: 375, height: 812 }, 'liuyao-fps-lite.png', 'lite')
  await run(browser, 'mobile-full', BASE + '/liuyao?mtier=full', { width: 375, height: 812 }, 'liuyao-fps-full.png', 'full')
  await run(browser, 'desktop-default', BASE + '/liuyao', { width: 1280, height: 900 }, null, 'full')
  await browser.close()
  if (HARD.length) {
    console.log('PROBE_FAIL ' + JSON.stringify(HARD))
    process.exit(1)
  }
  console.log('PROBE_PASS')
}

main().catch((e) => {
  console.error('PROBE_ERROR', e)
  process.exit(2)
})
