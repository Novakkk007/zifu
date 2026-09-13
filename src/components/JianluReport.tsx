/**
 * 问剑战报图 —— 纯客户端 Canvas 1080×1620 分享图
 *
 * 零隐私铁律：战报只绘战绩/段位/关卡/生成日期，
 * 绝不涉及生辰命盘——分享即荣耀，不露半点私。
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { ARENA_GATES } from '@contracts/engines/jianlu/arena-questions'
import { nextRank, rankOf, RANKS, type JianluRecord } from '@/lib/jianlu'

/** 战报场景：首胜 / 过关 / 晋位 / 胜场里程碑 */
export type ReportScene = 'first-win' | 'gate' | 'rankup' | 'wins'

export const REPORT_W = 1080
export const REPORT_H = 1620

const W = REPORT_W
const H = REPORT_H

/** 紫金夜穹（与全站一金同源） */
const GOLD = '#c9a45c'
const GOLD_BRIGHT = '#d6b77a'
const GOLD_DIM = '#a88444'
const SILK = '#f7f0e4'
const SILK_MUTED = '#a69db8'

const SERIF = '"Noto Serif SC", "Songti SC", serif'

/* ---------- 纯函数：场景文案 ---------- */

/** 按当前战绩自动挑选最有纪念意义的场景（段位卡入口用） */
export function sceneFor(r: JianluRecord): ReportScene {
  if (r.wins <= 1) return 'first-win'
  const rank = rankOf(r)
  if (rank.index > 0 && r.wins === rank.minWins) return 'rankup'
  return 'wins'
}

function sceneText(
  r: JianluRecord,
  scene: ReportScene,
  rate: number,
  gates: number
): { title: string; sub: string; copy: string } {
  switch (scene) {
    case 'first-win':
      return {
        title: '初试剑锋',
        sub: '剑已出鞘 · 江湖始见',
        copy: '华山问剑，首战告捷。此剑无名——此后江湖，人人将闻。',
      }
    case 'gate': {
      const gi = Math.max(0, Math.min(gates - 1, ARENA_GATES.length - 1))
      const gateName = ARENA_GATES[gi]?.name ?? '华山'
      return {
        title: gateName,
        sub: `第 ${gates} 峰 · 已破`,
        copy: `三题两断，照章判分——${gateName}一破，剑路更上一层。`,
      }
    }
    case 'rankup': {
      const rank = rankOf(r)
      const nx = nextRank(r)
      const copy =
        rank.index >= RANKS.length - 1
          ? '华山之巅，绝顶宗师——七峰尽破，百战功成。'
          : nx
            ? `再胜 ${Math.max(0, nx.minWins - r.wins)} 场，问鼎「${nx.name}」。`
            : rank.desc
      return { title: rank.name, sub: '段位已晋 · 江湖留名', copy }
    }
    default:
      return {
        title: `${r.wins} 胜`,
        sub: '剑道之路 · 一步一痕',
        copy: `共战 ${r.total} 场，胜率 ${rate}%，连胜 ${r.streak}——每一胜，皆一剑。`,
      }
  }
}

/* ---------- CSPRNG（宪章红线：禁 Math.random） ---------- */

function rand01(): number {
  const b = new Uint32Array(1)
  crypto.getRandomValues(b)
  return b[0] / 4294967296
}

/* ---------- Canvas 绘制 ---------- */

function rrPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rad: number): void {
  const r = Math.min(rad, w / 2, h / 2)
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function fillRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rad: number, color: string): void {
  ctx.beginPath()
  rrPath(ctx, x, y, w, h, rad)
  ctx.fillStyle = color
  ctx.fill()
}

function strokeRR(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rad: number,
  color: string,
  lw: number
): void {
  ctx.beginPath()
  rrPath(ctx, x, y, w, h, rad)
  ctx.strokeStyle = color
  ctx.lineWidth = lw
  ctx.stroke()
}

/** 逐字绘制（带字距）——不依赖 ctx.letterSpacing 兼容性 */
function trackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
  align: 'center' | 'left' = 'left'
): void {
  const chars = Array.from(text)
  const widths = chars.map((ch) => ctx.measureText(ch).width)
  const total = widths.reduce((a, b) => a + b, 0) + tracking * Math.max(0, chars.length - 1)
  let cx = align === 'center' ? x - total / 2 : x
  chars.forEach((ch, i) => {
    ctx.fillText(ch, cx, y)
    cx += widths[i] + tracking
  })
}

function trackedWidth(ctx: CanvasRenderingContext2D, text: string, tracking: number): number {
  const chars = Array.from(text)
  const sum = chars.reduce((a, ch) => a + ctx.measureText(ch).width, 0)
  return sum + tracking * Math.max(0, chars.length - 1)
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = []
  let line = ''
  for (const ch of text) {
    const t = line + ch
    if (ctx.measureText(t).width > maxWidth && line) {
      out.push(line)
      line = ch
    } else {
      line = t
    }
  }
  if (line) out.push(line)
  return out
}

function drawStars(ctx: CanvasRenderingContext2D): void {
  const n = 96
  for (let i = 0; i < n; i += 1) {
    const x = 30 + rand01() * (W - 60)
    const y = 60 + rand01() * (H * 0.52)
    const size = 0.6 + rand01() * 1.7
    const alpha = 0.08 + rand01() * 0.42
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fillStyle = rand01() < 0.35 ? `rgba(201,164,92,${alpha})` : `rgba(247,240,228,${alpha})`
    ctx.fill()
  }
}

/** 华山剪影（远/近两层，随机山脊） */
function ridge(ctx: CanvasRenderingContext2D, baseY: number, amp: number, color: string): void {
  ctx.beginPath()
  ctx.moveTo(0, H)
  ctx.lineTo(0, baseY + rand01() * amp)
  let x = 0
  while (x < W) {
    x += 70 + rand01() * 160
    ctx.lineTo(Math.min(x, W), baseY - rand01() * amp)
  }
  ctx.lineTo(W, H)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function dateLabel(): string {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function drawReport(ctx: CanvasRenderingContext2D, r: JianluRecord, scene: ReportScene): void {
  const rate = r.total > 0 ? Math.round((r.wins / r.total) * 100) : 0
  const gates = Math.max(0, Math.min(r.gatesCleared, 7))
  const rank = rankOf(r)
  const t = sceneText(r, scene, rate, gates)

  // —— 紫金夜穹 ——
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#150d2b')
  bg.addColorStop(0.55, '#0e0818')
  bg.addColorStop(1, '#07040f')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const glowTop = ctx.createRadialGradient(W / 2, 130, 0, W / 2, 130, 660)
  glowTop.addColorStop(0, 'rgba(201,164,92,0.13)')
  glowTop.addColorStop(1, 'rgba(201,164,92,0)')
  ctx.fillStyle = glowTop
  ctx.fillRect(0, 0, W, 800)

  const glowBot = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, 760)
  glowBot.addColorStop(0, 'rgba(122,88,180,0.15)')
  glowBot.addColorStop(1, 'rgba(122,88,180,0)')
  ctx.fillStyle = glowBot
  ctx.fillRect(0, H - 760, W, 760)

  drawStars(ctx)

  // —— 华山剪影 ——
  ridge(ctx, H - 400, 90, 'rgba(23,16,49,0.92)')
  ridge(ctx, H - 280, 110, 'rgba(10,5,22,0.97)')

  // —— 金框 ——
  strokeRR(ctx, 42, 42, W - 84, H - 84, 20, 'rgba(201,164,92,0.32)', 2)
  strokeRR(ctx, 56, 56, W - 112, H - 112, 14, 'rgba(201,164,92,0.13)', 1)

  // —— 顶部品牌 ——
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = GOLD_DIM
  ctx.font = `700 30px ${SERIF}`
  trackedText(ctx, '紫府 · 华山问剑', W / 2, 136, 16, 'center')
  ctx.fillStyle = 'rgba(166,157,184,0.85)'
  ctx.font = `400 18px ${SERIF}`
  trackedText(ctx, 'MOUNT HUA · ASK THE SWORD', W / 2, 176, 7, 'center')

  // 菱形饰
  ctx.save()
  ctx.translate(W / 2, 212)
  ctx.rotate(Math.PI / 4)
  ctx.strokeStyle = 'rgba(201,164,92,0.55)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(-5, -5, 10, 10)
  ctx.restore()

  // —— 场景徽 ——
  const badge = ({ 'first-win': '首胜', gate: '破峰', rankup: '晋位', wins: '战绩' } as const)[scene]
  ctx.font = `600 25px ${SERIF}`
  const bw = trackedWidth(ctx, badge, 14) + 104
  fillRR(ctx, (W - bw) / 2, 244, bw, 64, 32, 'rgba(201,164,92,0.09)')
  strokeRR(ctx, (W - bw) / 2, 244, bw, 64, 32, 'rgba(201,164,92,0.5)', 1.5)
  ctx.fillStyle = GOLD
  trackedText(ctx, badge, W / 2, 288, 14, 'center')

  // —— 标题 / 副题 ——
  ctx.fillStyle = GOLD_BRIGHT
  ctx.font = `700 104px ${SERIF}`
  trackedText(ctx, t.title, W / 2, 470, 22, 'center')

  ctx.fillStyle = 'rgba(247,240,228,0.92)'
  ctx.font = `400 36px ${SERIF}`
  trackedText(ctx, t.sub, W / 2, 556, 10, 'center')

  ctx.strokeStyle = 'rgba(201,164,92,0.28)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(W / 2 - 220, 604)
  ctx.lineTo(W / 2 + 220, 604)
  ctx.stroke()

  // —— 场景文案 ——
  ctx.fillStyle = 'rgba(166,157,184,0.95)'
  ctx.font = `400 30px ${SERIF}`
  const lines = wrapText(ctx, t.copy, 820)
  lines.forEach((ln, i) => {
    ctx.fillText(ln, W / 2, 672 + i * 56)
  })

  // —— 战绩卡 ——
  const cardY = 762
  const cardH = 430
  fillRR(ctx, 110, cardY, W - 220, cardH, 26, 'rgba(201,164,92,0.05)')
  strokeRR(ctx, 110, cardY, W - 220, cardH, 26, 'rgba(201,164,92,0.4)', 2)

  const stats: Array<[string, string]> = [
    ['段位', rank.name],
    ['胜场', String(r.wins)],
    ['胜率', `${rate}%`],
    ['连胜', String(r.streak)],
    ['已破峰', `${gates}/7`],
    ['总场', String(r.total)],
  ]
  const colX = [W / 2 - 290, W / 2, W / 2 + 290]
  const rowLabelY = [cardY + 100, cardY + 268]
  const rowValY = [cardY + 178, cardY + 346]
  stats.forEach(([label, val], i) => {
    const cx = colX[i % 3]
    const row = Math.floor(i / 3)
    ctx.textAlign = 'center'
    ctx.fillStyle = GOLD_DIM
    ctx.font = `400 24px ${SERIF}`
    trackedText(ctx, label, cx, rowLabelY[row], 10, 'center')
    ctx.fillStyle = SILK
    ctx.font = `700 54px ${SERIF}`
    trackedText(ctx, val, cx, rowValY[row], 6, 'center')
  })

  // —— 朱印 ——
  const seal = 84
  const sx = W - 96 - seal
  const sy = H - 356
  fillRR(ctx, sx, sy, seal, seal, 12, 'rgba(164,75,77,0.12)')
  strokeRR(ctx, sx, sy, seal, seal, 12, 'rgba(164,75,77,0.95)', 3)
  ctx.fillStyle = 'rgba(164,75,77,0.95)'
  ctx.font = `700 34px ${SERIF}`
  ctx.textAlign = 'center'
  ctx.fillText('问', sx + seal / 2, sy + 42)
  ctx.fillText('剑', sx + seal / 2, sy + 76)

  // —— 落款 ——
  ctx.fillStyle = GOLD_BRIGHT
  ctx.font = `700 64px ${SERIF}`
  trackedText(ctx, '紫府', W / 2, H - 336, 34, 'center')

  ctx.fillStyle = SILK_MUTED
  ctx.font = `400 26px ${SERIF}`
  ctx.fillText('zifu.pages.dev', W / 2, H - 272)

  ctx.fillStyle = 'rgba(247,240,228,0.8)'
  trackedText(ctx, '以古人之智 · 照今日之心', W / 2, H - 216, 8, 'center')

  ctx.fillStyle = 'rgba(166,157,184,0.75)'
  ctx.font = `400 21px ${SERIF}`
  ctx.fillText(`战报生成 · ${dateLabel()}`, W / 2, H - 96)
}

/* ---------- 导出：绘制并下载 PNG ---------- */

async function ensureFonts(): Promise<void> {
  await Promise.all([
    document.fonts.load(`700 32px ${SERIF}`),
    document.fonts.load(`600 32px ${SERIF}`),
    document.fonts.load(`400 32px ${SERIF}`),
  ])
}

/**
 * 生成 1080×1620 问剑战报 PNG 并触发下载。
 * 纯客户端绘制，零上传、零隐私。
 */
export async function downloadReport(record: JianluRecord, scene: ReportScene = 'wins'): Promise<boolean> {
  try {
    await ensureFonts()
  } catch {
    /* 字体未就绪时回退系统衬线 */
  }
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  drawReport(ctx, record, scene)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return false
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '紫府问剑战报.png'
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  return true
}

/* ---------- 入口按钮（三处入口共用） ---------- */

export function JianluReportButton({
  record,
  scene,
  className,
  disabled = false,
  children = '生成战报',
}: {
  record: JianluRecord
  scene?: ReportScene
  className?: string
  disabled?: boolean
  children?: ReactNode
}) {
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={className}
      onClick={() => {
        setBusy(true)
        void downloadReport(record, scene ?? sceneFor(record)).finally(() => setBusy(false))
      }}
    >
      {busy ? '绘卷中…' : children}
    </button>
  )
}
