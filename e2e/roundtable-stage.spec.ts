import { expect, test } from '@playwright/test'

test.use({ channel: process.env.E2E_CHANNEL })

declare global {
  interface Window {
    roundTableTest: {
      render: (options?: { speed?: number; version?: number; count?: number }) => void
      unmount: () => void
      finishes: number[]
      skips: number
    }
    stageIntervals: Set<number>
  }
}

// 直接挂载真实组件，隔离排盘与外部 AI 请求，仅验收演出行为。
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => console.error(error.message))
  await page.clock.install()
  await page.addInitScript(() => {
    window.stageIntervals = new Set()
    const start = window.setInterval.bind(window)
    const stop = window.clearInterval.bind(window)
    window.setInterval = ((callback: TimerHandler, ms?: number, ...args: unknown[]) => {
      const id = start(callback, ms, ...args)
      if (ms === 50) window.stageIntervals.add(id)
      return id
    }) as typeof window.setInterval
    window.clearInterval = (id) => {
      window.stageIntervals.delete(id!)
      stop(id)
    }
  })
  await page.route('**/__roundtable_stage_test__', (route) => route.fulfill({
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html data-theme="gold-indigo"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#100a24;margin:0;padding:16px"><div id="root"></div><script type="module">
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
const { default: React } = await import('/node_modules/.vite/deps/react.js');
const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js');
const { default: Stage } = await import('/src/components/RoundTableStage.tsx');
await import('/src/index.css');
const result = {
  opening: '欢迎同观一盘。',
  seats: ['子平格局派','三命通会派','神峰通考派','渊海子平派','盲派','千里命稿派','金口诀'].map(school => ({school, content:'本席发言：' + '温和而有希望。'.repeat(50) + 'https://example.com/' + 'a'.repeat(150)})),
  consensus:'各家所见，可以互参。', closing:'愿君从容前行。'
};
let currentResult = result, speed = 34, version = 1;
const root = ReactDOM.createRoot(document.getElementById('root'));
window.roundTableTest = {
  finishes: [], skips: 0,
  unmount: () => root.unmount(),
  render(options = {}) {
    speed = options.speed ?? speed;
    version = options.version ?? version;
    if (options.count !== undefined) currentResult = {...result, seats:Array.from({length:options.count}, (_, i) => result.seats[i % 7])};
    const callbackVersion = version;
    root.render(React.createElement(React.StrictMode, null, React.createElement(Stage, {
      result:currentResult, typewriterSpeed:speed,
      onFinish:() => window.roundTableTest.finishes.push(callbackVersion),
      onSkip:() => window.roundTableTest.skips++
    })));
  }
};
window.roundTableTest.render();
</script></body></html>`,
  }))
  await page.goto('/__roundtable_stage_test__')
  await expect(page.locator('[data-roundtable-stage]')).toBeVisible()
})

test('375px 长文纵向展开且无重叠，桌面发言不遮挡环坐席位', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.evaluate(() => window.roundTableTest.render({ speed: 0 }))
  await page.clock.runFor(4500)
  const rows = page.getByRole('list', { name: '圆桌席位' }).getByRole('listitem')
  await expect(rows).toHaveCount(7)
  await expect(rows.first()).toHaveAttribute('aria-current', 'step')
  await page.clock.runFor(500)
  await expect(rows.first().getByRole('status')).toHaveText('第1席 · 子平格局派')
  await expect(rows.first().getByRole('status').locator('..')).toHaveCSS('opacity', '1')
  const boxes = await rows.evaluateAll((elements) => elements.map((el) => {
    const rect = el.getBoundingClientRect()
    return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }
  }))
  for (let i = 0; i < boxes.length; i++) {
    expect(boxes[i].left).toBeGreaterThanOrEqual(0)
    expect(boxes[i].right).toBeLessThanOrEqual(375)
    if (i > 0) expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  await page.screenshot({ path: 'test-results/roundtable-stage-375.png', fullPage: true })
  for (const width of [768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.clock.runFor(500)
    await expect(page.getByRole('list', { name: '圆桌席位' })).toBeHidden()
    await expect(page.getByRole('status')).toHaveText('第1席 · 子平格局派')
    await page.clock.runFor(500)
    await expect(page.getByRole('status').locator('..')).toHaveCSS('opacity', '1')
    const seats = page.locator('[aria-hidden="true"] > div[class~="w-[104px]"]')
    await expect(seats).toHaveCount(7)
    // 通过实际坐标验收环坐区与发言区分离。
    const speechTop = (await page.getByRole('status').boundingBox())!.y
    for (const seat of await seats.all()) {
      const box = (await seat.boundingBox())!
      expect(box.y + box.height).toBeLessThan(speechTop)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  }
  await page.screenshot({ path: 'test-results/roundtable-stage-desktop.png', fullPage: true })
})

test('StrictMode 只有一个计时器，调速不重演且只调用最新完成回调一次', async ({ page }) => {
  expect(await page.evaluate(() => window.stageIntervals.size)).toBe(1)
  await page.clock.runFor(2200)
  await expect(page.getByRole('status')).toHaveText('先生开场')
  await page.evaluate(() => window.roundTableTest.render({ speed: 0, version: 2 }))
  await page.clock.runFor(600)
  await expect(page.getByRole('status')).toHaveText('先生开场')
  expect(await page.evaluate(() => window.stageIntervals.size)).toBe(1)
  await page.clock.runFor(62000)
  expect(await page.evaluate(() => window.roundTableTest.finishes)).toEqual([2])
  expect(await page.evaluate(() => window.stageIntervals.size)).toBe(0)
  await page.clock.runFor(10000)
  expect(await page.evaluate(() => window.roundTableTest.finishes)).toEqual([2])
})

test('跳过立即停止，新结果重置，卸载不再触发回调', async ({ page }) => {
  await page.clock.runFor(4000)
  await page.getByRole('button', { name: '跳过演出 · 看全文' }).click()
  expect(await page.evaluate(() => window.stageIntervals.size)).toBe(0)
  await page.clock.runFor(100000)
  expect(await page.evaluate(() => window.roundTableTest.skips)).toBe(1)
  expect(await page.evaluate(() => window.roundTableTest.finishes)).toEqual([])
  await page.evaluate(() => window.roundTableTest.render({ count: 0 }))
  await expect(page.getByRole('status')).toHaveText('结果已到 · 即将开演')
  expect(await page.evaluate(() => window.stageIntervals.size)).toBe(1)
  await page.evaluate(() => window.roundTableTest.unmount())
  expect(await page.evaluate(() => window.stageIntervals.size)).toBe(0)
  await page.clock.runFor(100000)
  expect(await page.evaluate(() => window.roundTableTest.finishes)).toEqual([])
})
