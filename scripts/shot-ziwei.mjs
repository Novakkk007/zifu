// ziwei 页真实浏览器冒烟（晋级轮 #2）：表单卡片可见性 + 提交排盘 + 十二宫盘 DOM 度量与元素级截图
// 用法: node scripts/shot-ziwei.mjs   （需 dev/preview 服务在 http://localhost:3000）
import { mkdirSync } from 'fs'

let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  ;({ chromium } = await import('@playwright/test'))
}

const BASE = process.env.BASE || 'http://localhost:3000'
const OUT = 'scripts/_shots'
mkdirSync(OUT, { recursive: true })
const results = []

const browser = await chromium.launch({ channel: 'msedge', headless: true })
for (const vp of [
  { name: 'm', w: 375, h: 812 },
  { name: 'd', w: 1440, h: 900 },
]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push('console: ' + m.text())
  })

  await page.goto(BASE + '/ziwei', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  // ① 首屏节奏度量（未滚动，绝对页内坐标）
  const m1 = await page.evaluate(() => {
    const all = [...document.querySelectorAll('h1,h2,h3,p,div,span')]
    const h = all.find(
      (el) => el.textContent && el.textContent.trim() === '录入生辰' && el.children.length === 0,
    )
    const card = document.querySelector('#zw-name')?.closest('div.rounded-xl')
    const abs = (el) => (el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null)
    return {
      headingAbsTop: abs(h),
      formCardAbsTop: abs(card),
      firstInputId: !!document.querySelector('#zw-name'),
      overflowX0: document.scrollingElement.scrollWidth > window.innerWidth + 1,
      scrollW: document.scrollingElement.scrollWidth,
      innerW: window.innerWidth,
    }
  })

  // ② 滚动到表单卡片（触发 whileInView 动画）→ 截图
  await page
    .locator('#zw-name')
    .evaluate((el) => el.scrollIntoView({ block: 'center' }))
    .catch(() => {})
  await page.waitForTimeout(1600)
  await page.screenshot({ path: OUT + '/ziwei-' + vp.name + '-form.png' })

  // ③ 提交排盘（默认生辰 1995-6-15）
  const btn = page.getByRole('button', { name: /安星排盘/ }).first()
  await btn.scrollIntoViewIfNeeded().catch(() => {})
  await btn.click({ timeout: 8000 }).catch((e) => errs.push('click: ' + e.message))
  await page.waitForTimeout(2600)

  const m2 = await page.evaluate(() => {
    const grid = document.querySelector('.grid.grid-cols-4')
    const g = grid?.getBoundingClientRect()
    return {
      chartFound: !!grid,
      gridW: g ? Math.round(g.width) : null,
      gridH: g ? Math.round(g.height) : null,
      cellW: g ? Math.round(g.width / 4) : null,
      overflowX: document.scrollingElement.scrollWidth > window.innerWidth + 1,
      scrollW: document.scrollingElement.scrollWidth,
      innerW: window.innerWidth,
    }
  })

  // ④ 滚到十二宫盘 → 视口截图 + 网格元素截图（不含壳层浮钮）+ 每格度量
  await page
    .getByText('十二宫盘', { exact: false })
    .first()
    .scrollIntoViewIfNeeded()
    .catch(() => {})
  await page.waitForTimeout(1800)
  await page.screenshot({ path: OUT + '/ziwei-' + vp.name + '-chart.png' })

  let m3 = {}
  try {
    m3 = await page.evaluate(() => {
      const cells = [...document.querySelectorAll('.grid.grid-cols-4 > button')]
      return {
        cellCount: cells.length,
        cellHeights: cells.map((b) => Math.round(b.getBoundingClientRect().height)),
        cellLastLine: cells.map(
          (b) =>
            (b.innerText || '')
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
              .pop() || '',
        ),
      }
    })
    await page
      .locator('.grid.grid-cols-4')
      .screenshot({ path: OUT + '/ziwei-' + vp.name + '-grid.png' })
  } catch (e) {
    errs.push('grid-audit: ' + e.message)
  }

  results.push({
    vp: vp.name,
    ...m1,
    ...m2,
    ...m3,
    errors: errs.filter((e) => !/auth|refresh|favicon/i.test(e)),
  })
  await ctx.close()
}
await browser.close()
console.log(JSON.stringify(results, null, 2))
