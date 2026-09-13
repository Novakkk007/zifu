// 六爻摇卦动效·冒烟截图（Playwright + 系统 Edge/Chrome，免下载浏览器）
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const dir = 'scripts/_shots'
fs.mkdirSync(dir, { recursive: true })

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      const b = await chromium.launch({ channel, headless: true })
      console.log('launched via', channel)
      return b
    } catch (e) {
      console.log('channel', channel, 'failed:', String(e).split('\n')[0])
    }
  }
  throw new Error('no browser channel available')
}

const browser = await launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push('PAGEERR:' + e.message))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('CONSOLE:' + m.text())
})

await page.goto('http://localhost:4173/liuyao', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(1600)

await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent && b.textContent.includes('摇 卦'))
  el?.scrollIntoView({ block: 'center' })
})
await page.waitForTimeout(600)
const btn = page.getByRole('button', { name: /摇 卦|摇卦/ }).first()

const ringBox = await page
  .locator('.animate-ring-slow')
  .first()
  .boundingBox()
  .catch(() => null)
let clip = undefined
if (ringBox) {
  const cx = ringBox.x + ringBox.width / 2
  const cy = ringBox.y + ringBox.height / 2
  clip = {
    x: Math.max(0, Math.min(cx - 480, 1440 - 1120)),
    y: Math.max(72, Math.min(cy - 300, 900 - 650)),
    width: 1120,
    height: 650,
  }
  console.log('clip:', JSON.stringify(clip))
}

console.log('rings:', await page.locator('.animate-ring-slow').count())
console.log('3d layers:', await page.locator('[style*="preserve-3d"]').count())
await page.screenshot({ path: dir + '/s1-idle.png', clip })
console.log('S1 ok (idle)')

await btn.click()
await page.waitForTimeout(330)
await page.screenshot({ path: dir + '/s2-air.png', clip })
console.log('S2 ok (mid-air)')

await page.waitForTimeout(720)
await page.screenshot({ path: dir + '/s3-impact.png', clip })
console.log('S3 ok (impact)')

await page.waitForTimeout(200)
await page.screenshot({ path: dir + '/s3b-sparks.png', clip })
console.log('S3b ok (sparks)')

await page.waitForTimeout(700)
await page.screenshot({ path: dir + '/s4-landed.png', clip })
console.log('S4 ok (landed)')

await btn.click()
await page.waitForTimeout(420)
await page.screenshot({ path: dir + '/s5-second.png', clip })
console.log('S5 ok (2nd toss mid-air)')

await page.waitForTimeout(1300)
await page.screenshot({ path: dir + '/s6-two-rows.png', clip })
console.log('S6 ok (2 rows)')

console.log('counter:', await page.locator('p', { hasText: '/ 6 摇' }).first().textContent().catch(() => 'n/a'))
console.log(
  'dots:',
  await page.evaluate(() =>
    [...document.querySelectorAll('span')]
      .filter((e) => /(^|\s)h-2(\.5)?(\s|$)/.test(String(e.className)))
      .map((e) => (String(e.className).includes('bg-goldbright') ? 1 : 0))
      .join('') + ' n=' + [...document.querySelectorAll('span')].filter((e) => /(^|\s)h-2(\.5)?(\s|$)/.test(String(e.className))).length,
  ),
)
// ── 移动端视口快检（390×844）──
await page.setViewportSize({ width: 390, height: 844 })
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)
await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent && b.textContent.includes('摇 卦'))
  el?.scrollIntoView({ block: 'center' })
})
await page.waitForTimeout(500)
await page.screenshot({ path: dir + '/m1-idle.png' })
await page.getByRole('button', { name: /摇 卦|摇卦/ }).first().click()
await page.waitForTimeout(1050)
await page.screenshot({ path: dir + '/m2-impact.png' })
await page.waitForTimeout(600)
await page.screenshot({ path: dir + '/m3-landed.png' })
console.log('M1/M2/M3 ok (mobile 390x844)')

console.log('errors:', JSON.stringify(errors))
await browser.close()
console.log('DONE')
