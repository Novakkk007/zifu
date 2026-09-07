/**
 * 流年简批规则（2026-09-07 新增 · 师门口径对齐）
 * 输入命盘+大运+流年干支+岁数 → 输出一句人话简批（零术语+给岁数+比喻+落点）
 * 判定：流年对四柱/大运的 冲合刑害、十神攻身、驿马禄桃花、伏吟反吟
 */
import type { BaziChartV2 } from '../../bazi-core/types'

const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
// 十神名（以日干论——但简批输出必须人话，十神只在内部用）
// 六冲
const CLASH: Record<string, string> = {
  子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳',
}
// 六合
const HE: Record<string, string> = {
  子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午',
}
// 三刑简表（寅巳申 无恩之刑 / 丑戌未 恃势之刑 / 子卯 无礼之刑 / 辰午酉亥自刑）
const XING: Record<string, string[]> = {
  寅: ['巳', '申'], 巳: ['寅', '申'], 申: ['寅', '巳'],
  丑: ['戌', '未'], 戌: ['丑', '未'], 未: ['丑', '戌'],
  子: ['卯'], 卯: ['子'],
  辰: ['辰'], 午: ['午'], 酉: ['酉'], 亥: ['亥'],
}
// 驿马（年/日支查）
const HORSE: Record<string, string> = {
  申: '寅', 子: '寅', 辰: '寅', 寅: '申', 午: '申', 戌: '申', 巳: '亥', 酉: '亥', 丑: '亥', 亥: '巳', 卯: '巳', 未: '巳',
}
// 禄位（天干→地支）
const LU: Record<string, string> = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' }
// 桃花（三合局）
const TAOHUA: Record<string, string> = { 申: '酉', 子: '酉', 辰: '酉', 寅: '卯', 午: '卯', 戌: '卯', 巳: '午', 酉: '午', 丑: '午', 亥: '子', 卯: '子', 未: '子' }
// 五行（支）
const BRANCH_WX: Record<string, string> = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' }
const STEM_WX: Record<string, string> = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' }

export interface LiuNianBrief {
  /** 流年干支 */
  ganzhi: string
  /** 岁数（虚岁按大运起算的实岁口径——与 UI 一致） */
  age: number
  /** 一句话人话简批 */
  brief: string
  /** 吉凶倾向 */
  tone: '吉' | '平' | '慎'
}

/** 五行→人话比喻词 */
function wxWord(wx: string): string {
  return { 木: '抽枝发芽', 火: '热热闹闹', 土: '稳稳当当', 金: '结实硬朗', 水: '流动灵活' }[wx] ?? '平平常常'
}

/** 流年简批主函数 */
export function liuNianBrief(chart: BaziChartV2, daYun: { ganzhi: string }, liuNian: { ganzhi: string; year: number }, age: number): LiuNianBrief {
  const gz = liuNian.ganzhi
  if (gz.length !== 2) return { ganzhi: gz, age, brief: '', tone: '平' }
  const stem = gz[0]
  const branch = gz[1]
  const dayStem = chart.pillars.day.stem
  const dayBranch = chart.pillars.day.branch
  const dyBranch = daYun.ganzhi[1]
  const pillars = [chart.pillars.year, chart.pillars.month, chart.pillars.day, chart.pillars.hour]
  const briefs: string[] = []
  let tone: '吉' | '平' | '慎' = '平'

  // 1. 流年支冲日支（夫妻宫/根基动）
  if (CLASH[branch] === dayBranch) {
    briefs.push('自己这一亩三分地有动静——家宅、感情、岗位宜稳着点，别急着掀桌子')
    tone = '慎'
  }
  // 2. 流年支冲/合大运支（运途起落）
  if (branch !== dyBranch) {
    if (CLASH[branch] === dyBranch) {
      briefs.push('十年运程走到转弯处，手上正忙的事或有变数，多备一手')
    } else if (HE[branch] === dyBranch) {
      briefs.push('运与年一拍即合，想办的事容易找到帮手，适合把想法落地')
      if (tone !== '慎') tone = '吉'
    }
  }
  // 3. 流年支刑四柱（无恩/恃势/无礼/自刑）
  const xingHits = pillars.filter((p) => p && (XING[branch] ?? []).includes(p.branch)).length
  if (xingHits > 0) {
    briefs.push('这年口舌与较劲偏多，心里堵的时候先放一放，不争一时长短')
    tone = tone === '吉' ? '慎' : tone
  }
  // 4. 伏吟/反吟日柱
  if (gz === chart.pillars.day.ganzhi) {
    briefs.push('旧事重提的一年，故人旧账容易找回来，了结干净反倒轻松')
    tone = '慎'
  }
  if (CLASH[stem] && gz === stem + CLASH[branch]) {
    // 反吟（与日柱天克地冲）
  }
  if (stem === CLASH[dayStem] && CLASH[branch] === dayBranch) {
    briefs.push('内外都较着劲的一年，身体和心情都要留几分余量，别硬扛')
    tone = '慎'
  }
  // 5. 驿马/禄/桃花
  const horseBranches = new Set<string>()
  ;[chart.pillars.year.branch, chart.pillars.day.branch].forEach((b) => {
    if (b && HORSE[b]) horseBranches.add(HORSE[b])
  })
  if (horseBranches.has(branch)) {
    briefs.push('出门走动多的一年——出差、搬迁、往外跑，路在脚下')
    tone = tone === '慎' ? '慎' : '吉'
  }
  if (LU[dayStem] === branch) {
    briefs.push('回到自己的根上，精力见长，适合干点实实在在的事')
    tone = tone === '慎' ? '慎' : '吉'
  }
  if (TAOHUA[branch] === dayBranch) {
    briefs.push('人缘见好的年份，饭局聚会多，单身的多出门，有伴的多顾家')
    tone = tone === '慎' ? '慎' : '吉'
  }
  // 6. 十神攻身简断（日干论）
  const stemWx = STEM_WX[stem]
  const dayWx = STEM_WX[dayStem]
  const KE: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }
  if (KE[stemWx] === dayWx && STEMS.indexOf(stem) % 2 === 1) {
    briefs.push('压力顶着走的一年，领导、规矩、琐事都重——扛过去就长本事')
    tone = '慎'
  }
  if (KE[dayWx] === stemWx) {
    briefs.push('有进账、有成绩的一年，忙是忙，忙得有甜头')
    tone = tone === '慎' ? '慎' : '吉'
  }
  // 7. 生我/我生（帮手/操心）
  const SHENG: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
  if (SHENG[stemWx] === dayWx) {
    briefs.push('身边有人搭手的一年，长辈、平台、靠山使得上劲')
    tone = tone === '慎' ? '慎' : '吉'
  }
  if (SHENG[dayWx] === stemWx) {
    briefs.push('为事操心、为人付出的年份，累归累，情分攒下了')
    tone = tone === '慎' ? '慎' : '平'
  }

  // 组装一句（取最重要 1-2 条 + 岁数 + 五行底色）
  const main = briefs.slice(0, 2).join('；')
  const wxTail = `这年底色是「${wxWord(BRANCH_WX[branch] ?? STEM_WX[stem] ?? '土')}」`
  const brief = main
    ? `${age} 岁：${main}。${wxTail}。`
    : `${age} 岁：${wxTail}，按部就班即是福。`
  return { ganzhi: gz, age, brief, tone }
}

/** 大运内 10 个流年简批（从某流年起顺排） */
export function daYunLiuNianBriefs(
  chart: BaziChartV2,
  daYun: { ganzhi: string; startYear: number; endYear: number },
  birthYear: number
): LiuNianBrief[] {
  const out: LiuNianBrief[] = []
  for (let y = daYun.startYear; y <= daYun.endYear; y++) {
    // 流年干支按年序推算（简化：以 1984 甲子为锚，顺推）
    const stem = STEMS[(y - 1984) % 10]
    const branch = BRANCHES[(y - 1984) % 12]
    const idx = (y - 1984) % 10
    if (idx < 0) continue
    out.push(liuNianBrief(chart, daYun, { ganzhi: stem + branch, year: y }, y - birthYear + 1))
  }
  return out
}
