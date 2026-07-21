/* 紫微斗数 mock 安星逻辑：以生辰确定性哈希入宫，同一生辰结果稳定 */

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/** 盘上环形宫序（寅起，逆时钟绕行） */
export const RING = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']

/** 地支 → 4×4 宫格坐标 [row, col] */
export const GRID_POS: Record<string, [number, number]> = {
  巳: [0, 0], 午: [0, 1], 未: [0, 2], 申: [0, 3],
  辰: [1, 0], 酉: [1, 3],
  卯: [2, 0], 戌: [2, 3],
  寅: [3, 0], 丑: [3, 1], 子: [3, 2], 亥: [3, 3],
}

export const PALACE_NAMES = [
  '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '交友', '官禄', '田宅', '福德', '父母',
]

export const PALACE_DUTY: Record<string, string> = {
  命宫: '先天禀赋与一生总纲',
  兄弟: '手足情谊与同辈助力',
  夫妻: '姻缘际遇与伴侣相处',
  子女: '子女缘分与创造表达',
  财帛: '求财方式与财库厚薄',
  疾厄: '体质禀赋与健康隐患',
  迁移: '外出际遇与环境变迁',
  交友: '人脉网络与朋友部属',
  官禄: '事业格局与职场进退',
  田宅: '不动产运与家庭根基',
  福德: '精神世界与享福能力',
  父母: '长辈缘分与原生家庭',
}

export const MAJOR_STARS = [
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府',
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军',
]

export const STAR_LINE: Record<string, string> = {
  紫微: '帝曜居中，主贵气与统御',
  天机: '善谋多思，主机变与智慧',
  太阳: '光明磊落，主贵不主富',
  武曲: '刚毅果决，主财帛与行动',
  天同: '温和有福，主安享与人和',
  廉贞: '精明热烈，主秩序与担当',
  天府: '稳重包容，主库藏与衣食',
  太阴: '细腻内敛，主积蓄与柔光',
  贪狼: '多才多艺，主人缘与进取',
  巨门: '能言善辩，主思辨与钻研',
  天相: '忠厚辅佐，主衣食与服务',
  天梁: '清高荫庇，主逢凶化吉',
  七杀: '刚烈开创，主变动与权威',
  破军: '破旧立新，主先锋与重塑',
  左辅: '贵人暗助，主得扶持',
  右弼: '贵人相佐，主得成全',
  文昌: '文思清发，主科名与才学',
  文曲: '才艺灵动，主口才与技艺',
}

const MINOR_POOL = [
  '左辅', '右弼', '文昌', '文曲', '天魁', '天钺', '天马', '禄存',
  '火星', '铃星', '擎羊', '陀罗', '地空', '地劫', '红鸾', '天喜',
]

/** 生年干四化（古法表）：[化禄, 化权, 化科, 化忌] */
const SIHUA: Record<string, [string, string, string, string]> = {
  甲: ['廉贞', '破军', '武曲', '太阳'],
  乙: ['天机', '天梁', '紫微', '太阴'],
  丙: ['天同', '天机', '文昌', '廉贞'],
  丁: ['太阴', '天同', '天机', '巨门'],
  戊: ['贪狼', '太阴', '右弼', '天机'],
  己: ['武曲', '贪狼', '天梁', '文曲'],
  庚: ['太阳', '武曲', '太阴', '天同'],
  辛: ['巨门', '太阳', '文曲', '文昌'],
  壬: ['天梁', '紫微', '左辅', '武曲'],
  癸: ['破军', '巨门', '太阴', '贪狼'],
}

export const HUA_COLOR: Record<string, string> = {
  禄: '#C7A23A',
  权: '#8E5FBF',
  科: '#2E7D6B',
  忌: '#B03A2E',
}

/** 命主 / 身主（古法简表） */
const MING_ZHU: Record<string, string> = {
  子: '贪狼', 丑: '巨门', 寅: '禄存', 卯: '文曲', 辰: '廉贞', 巳: '武曲',
  午: '破军', 未: '武曲', 申: '廉贞', 酉: '文曲', 戌: '禄存', 亥: '巨门',
}
const SHEN_ZHU: Record<string, string> = {
  子: '铃星', 丑: '天相', 寅: '天梁', 卯: '天同', 辰: '文昌', 巳: '天机',
  午: '火星', 未: '天相', 申: '天梁', 酉: '天同', 戌: '文昌', 亥: '天机',
}

const JU_NAMES = ['水二局', '木三局', '金四局', '土五局', '火六局']
const JU_START = [2, 3, 4, 5, 6]

export type BirthInput = {
  name: string
  gender: 'male' | 'female'
  year: number
  month: number
  day: number
  hour: number // 0-11 时辰索引（子=0）
}

export type StarEntry = { name: string; hua?: '禄' | '权' | '科' | '忌' }

export type PalaceCell = {
  ringIdx: number
  branch: string
  stem: string
  name: string
  isMing: boolean
  isShen: boolean
  majors: StarEntry[]
  minors: string[]
  daxian: [number, number]
}

export type ZiweiChart = {
  palaces: PalaceCell[]
  mingIdx: number
  shenIdx: number
  ju: string
  juStart: number
  yearStem: string
  yearBranch: string
  mingZhu: string
  shenZhu: string
  currentDaxianIdx: number
  huaMap: Record<string, '禄' | '权' | '科' | '忌'>
}

/** 确定性字符串哈希 */
function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 PRNG */
function prng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildChart(input: BirthInput): ZiweiChart {
  const seedStr = `${input.year}-${input.month}-${input.day}-${input.hour}-${input.gender}-${input.name}`
  const rnd = prng(hashSeed(seedStr))

  const yearStem = STEMS[(input.year - 4 + 1000) % 10]
  const yearBranch = BRANCHES[(input.year - 4 + 1200) % 12]

  // 命宫：寅起正月，顺数至生月，再逆数生时（简化古法）
  const yinIdx = 0 // RING 中寅的索引
  const monthIdx = (yinIdx + (input.month - 1)) % 12
  const mingIdx = (((monthIdx - input.hour) % 12) + 12) % 12
  // 身宫：寅起正月，顺数至生月，再顺数生时
  const shenIdx = (monthIdx + input.hour) % 12

  // 宫干：五虎遁
  const yinStemIdx = ((STEMS.indexOf(yearStem) % 5) * 2 + 2) % 10

  // 五行局 mock
  const juIdx = Math.floor(rnd() * 5)
  const ju = JU_NAMES[juIdx]
  const juStart = JU_START[juIdx]

  // 十四主星入宫：洗牌后顺布，余下两颗并入哈希指定宫
  const stars = [...MAJOR_STARS]
  for (let i = stars.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[stars[i], stars[j]] = [stars[j], stars[i]]
  }
  const majorAt: string[][] = RING.map(() => [])
  stars.slice(0, 12).forEach((s, i) => majorAt[(mingIdx + i) % 12].push(s))
  majorAt[Math.floor(rnd() * 12)].push(stars[12])
  majorAt[Math.floor(rnd() * 12)].push(stars[13])

  // 辅星：每宫 2-3 颗
  const minorAt: string[][] = RING.map((_, i) => {
    const n = 2 + Math.floor(rnd() * 2)
    const picks: string[] = []
    while (picks.length < n) {
      const s = MINOR_POOL[Math.floor(rnd() * MINOR_POOL.length)]
      if (!picks.includes(s) && !majorAt[i].includes(s)) picks.push(s)
    }
    return picks
  })

  // 生年四化
  const [lu, quan, ke, ji] = SIHUA[yearStem]
  const huaMap: Record<string, '禄' | '权' | '科' | '忌'> = { [lu]: '禄', [quan]: '权', [ke]: '科', [ji]: '忌' }
  const withHua = (name: string): StarEntry =>
    huaMap[name] ? { name, hua: huaMap[name] } : { name }

  // 大限：命宫起局数，顺布十二宫（mock 一律顺行）
  const palaces: PalaceCell[] = RING.map((branch, ringIdx) => {
    const k = (((mingIdx - ringIdx) % 12) + 12) % 12
    const name = PALACE_NAMES[k]
    const dxStart = juStart + k * 10
    return {
      ringIdx,
      branch,
      stem: STEMS[(yinStemIdx + ringIdx) % 10],
      name,
      isMing: ringIdx === mingIdx,
      isShen: ringIdx === shenIdx,
      majors: majorAt[ringIdx].map(withHua),
      minors: minorAt[ringIdx],
      daxian: [dxStart, dxStart + 9],
    }
  })

  const age = Math.max(1, new Date().getFullYear() - input.year)
  const currentDaxianIdx = palaces.findIndex((p) => age >= p.daxian[0] && age <= p.daxian[1])

  return {
    palaces,
    mingIdx,
    shenIdx,
    ju,
    juStart,
    yearStem,
    yearBranch,
    mingZhu: MING_ZHU[yearBranch],
    shenZhu: SHEN_ZHU[yearBranch],
    currentDaxianIdx: currentDaxianIdx === -1 ? 0 : currentDaxianIdx,
    huaMap,
  }
}

/** 宫位 mock 释义句 */
export function palaceSentences(cell: PalaceCell): string[] {
  const short = cell.name === '命宫' ? '命' : cell.name
  const out = cell.majors.map((s) => `${s.name}居${short}：${STAR_LINE[s.name] ?? '主一方气数'}`)
  for (const m of cell.minors) {
    if (STAR_LINE[m]) out.push(`${m}同宫：${STAR_LINE[m]}`)
  }
  const huaStars = cell.majors.filter((s) => s.hua)
  for (const s of huaStars) {
    out.push(`生年化${s.hua}落此宫：${s.name}化${s.hua}，此宫${s.hua === '忌' ? '宜守不宜进，多一分谨慎' : '得其加持，可作着力之处'}。`)
  }
  if (out.length === 0) out.push('此宫主星不坐，静守待时，借势而行。')
  return out
}
