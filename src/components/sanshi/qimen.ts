/**
 * 奇门遁甲 mock 起局：时家奇门，以时间哈希确定性生成。
 * 地盘三奇六仪按「阳遁顺布 / 阴遁逆布」真实规则排布，
 * 九星八门八神以值符值使为轴确定性旋转。同一时刻 → 同一局。
 */
import {
  BRANCHES,
  STEMS,
  dayOfYear,
  dayPillar,
  hashSeed,
  hourStemOf,
  rng,
} from '@/components/sanshi/astro'

/** 九宫数 → 卦名小注 */
export const GUA_LABEL: Record<number, string> = {
  1: '坎一', 2: '坤二', 3: '震三', 4: '巽四', 5: '中五',
  6: '乾六', 7: '兑七', 8: '艮八', 9: '离九',
}

/** 洛书外环（顺时针） */
const RING = [1, 8, 3, 4, 9, 2, 7, 6]

/** 3×3 盘格展示顺序（巽四 离九 坤二 / 震三 中五 兑七 / 艮八 坎一 乾六） */
export const GRID_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6]

/** 三奇六仪（布地盘顺序） */
const YI = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙']

/** 九星本宫（1–9） */
const BASE_STAR: Record<number, string> = {
  1: '天蓬', 2: '天芮', 3: '天冲', 4: '天辅', 5: '天禽',
  6: '天心', 7: '天柱', 8: '天任', 9: '天英',
}

/** 八门本宫（1–9，中五无门） */
const BASE_DOOR: Record<number, string> = {
  1: '休', 2: '死', 3: '伤', 4: '杜', 5: '',
  6: '开', 7: '惊', 8: '生', 9: '景',
}

const GODS = ['值符', '螣蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天']
const DOORS_SEQ = ['休', '生', '伤', '杜', '景', '死', '惊', '开']
export const JU_CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九']

/** 门之吉凶 */
export const DOOR_KIND: Record<string, '吉' | '凶' | '平'> = {
  休: '吉', 生: '吉', 开: '吉',
  死: '凶', 惊: '凶', 伤: '凶',
  杜: '平', 景: '平',
}

export type Palace = {
  num: number
  gua: string
  diGan: string
  tianGan: string
  star: string
  door: string
  god: string
  isZhifu: boolean
  isZhishi: boolean
  duanyu: string
}

export type QimenPlate = {
  dun: '阳遁' | '阴遁'
  ju: number
  xunshou: string
  zhifuStar: string
  zhishiDoor: string
  dayGZ: string
  hourGZ: string
  palaces: Palace[]
}

export type QimenInput = {
  year: number
  month: number
  day: number
  hourBranch: number
  question: string
}

const DUAN_POOL: Record<'吉' | '凶' | '平', string[]> = {
  吉: [
    '所求宜徐图，财禄有根，行止有靠',
    '气象舒展，谋事多成，贵人相随',
    '门途通达，宜进不宜守，动则有获',
  ],
  凶: [
    '事多牵绊，宜守不宜攻，静待时转',
    '门户闭塞，行事宜缓，防口舌之扰',
    '气机上逆，先难后易，退一步反得全',
  ],
  平: [
    '半开半阖之间，得失相半，量力而行',
    '局势平稳，无大风浪，亦忌冒进',
    '中平之象，守成为上，伺机而动',
  ],
}

export function genQimen(input: QimenInput): QimenPlate {
  const { year, month, day, hourBranch, question } = input
  const seed = hashSeed(`qimen|${year}|${month}|${day}|${hourBranch}|${question}`)
  const rand = rng(seed)

  const dp = dayPillar(year, month, day)
  const hourStem = hourStemOf(dp.stem, hourBranch)
  const hourGZ = `${STEMS[hourStem]}${BRANCHES[hourBranch]}`

  // 阴阳遁：冬至（约年内 356 日）→夏至（约 172 日）为阳遁
  const doy = dayOfYear(year, month, day)
  const dun: '阳遁' | '阴遁' = doy >= 356 || doy < 172 ? '阳遁' : '阴遁'
  const ju = 1 + Math.floor(rand() * 9)

  // 地盘三奇六仪：阳顺阴逆
  const diGan: Record<number, string> = {}
  for (let i = 0; i < 9; i++) {
    const p =
      dun === '阳遁'
        ? ((ju - 1 + i) % 9) + 1
        : ((((ju - 1 - i) % 9) + 9) % 9) + 1
    diGan[p] = YI[i]
  }

  // 时柱干支序 & 旬首
  let gzIdx = 0
  for (let n = 0; n < 60; n++) {
    if (n % 10 === hourStem && n % 12 === hourBranch) {
      gzIdx = n
      break
    }
  }
  const xunHead = gzIdx - (gzIdx % 10)
  const xunYi = ['戊', '己', '庚', '辛', '壬', '癸'][xunHead / 10]
  const xunshou = `${STEMS[xunHead % 10]}${BRANCHES[xunHead % 12]}${xunYi}`

  // 值符本宫 = 旬首仪所落地盘宫；值符星加时干
  const zfOrigin = Number(Object.keys(diGan).find((k) => diGan[Number(k)] === xunYi))
  const zhifuStar = BASE_STAR[zfOrigin]
  const zhishiDoor = BASE_DOOR[zfOrigin] || '开'
  const targetPalace =
    hourStem === 0
      ? zfOrigin
      : Number(Object.keys(diGan).find((k) => diGan[Number(k)] === STEMS[hourStem]))

  // 天盘：九星携本宫地盘干旋转
  const starShift = (((targetPalace - zfOrigin) % 9) + 9) % 9
  const star: Record<number, string> = {}
  const tianGan: Record<number, string> = {}
  for (let p = 1; p <= 9; p++) {
    const orig = ((((p - 1 - starShift) % 9) + 9) % 9) + 1
    star[p] = BASE_STAR[orig]
    tianGan[p] = diGan[orig]
  }

  // 八神：值符起值符星所临宫，阳顺阴逆沿外环
  const god: Record<number, string> = {}
  const godStart = targetPalace === 5 ? 2 : targetPalace
  const startIdx = RING.indexOf(godStart)
  for (let k = 0; k < 8; k++) {
    const idx = (((dun === '阳遁' ? startIdx + k : startIdx - k) % 8) + 8) % 8
    god[RING[idx]] = GODS[k]
  }

  // 八门：值使门定锚，余门顺排外环
  const door: Record<number, string> = {}
  const k0 = DOORS_SEQ.indexOf(zhishiDoor)
  const r0 = Math.floor(rand() * 8)
  for (let k = 0; k < 8; k++) {
    door[RING[(((r0 + k - k0) % 8) + 8) % 8]] = DOORS_SEQ[k]
  }

  const palaces: Palace[] = []
  for (let p = 1; p <= 9; p++) {
    const d = door[p] ?? ''
    const g = god[p] ?? ''
    const kind = DOOR_KIND[d] ?? '平'
    const phrase = DUAN_POOL[kind][Math.floor(rand() * DUAN_POOL[kind].length)]
    const godPart = g ? `得${g}相佑` : '寄居中宫'
    const duanyu = d
      ? `${d}门临${star[p]}，${godPart}——${phrase}`
      : `${star[p]}寄宫，${godPart}——${phrase}`
    palaces.push({
      num: p,
      gua: GUA_LABEL[p],
      diGan: diGan[p],
      tianGan: tianGan[p],
      star: star[p],
      door: d,
      god: g,
      isZhifu: g === '值符',
      isZhishi: d === zhishiDoor,
      duanyu,
    })
  }

  return {
    dun,
    ju,
    xunshou,
    zhifuStar,
    zhishiDoor,
    dayGZ: dp.label,
    hourGZ,
    palaces,
  }
}

/** 用神锚定映射 */
export type Yongshen = {
  key: string
  hint: string
  type: 'door' | 'star' | 'god' | 'gan'
  value: string
}

export const YONGSHEN_LIST: Yongshen[] = [
  { key: '求财', hint: '生门为财源', type: 'door', value: '生' },
  { key: '出行', hint: '开门主远行', type: 'door', value: '开' },
  { key: '合作', hint: '六合主缔约', type: 'god', value: '六合' },
  { key: '疾病', hint: '天芮为病星', type: 'star', value: '天芮' },
  { key: '考试', hint: '景门主文书', type: 'door', value: '景' },
  { key: '姻缘', hint: '乙奇为日奇', type: 'gan', value: '乙' },
  { key: '官非', hint: '惊门主口舌', type: 'door', value: '惊' },
  { key: '谋职', hint: '值符为贵极', type: 'god', value: '值符' },
  { key: '失物', hint: '玄武主遗失', type: 'god', value: '玄武' },
  { key: '置业', hint: '九地主田土', type: 'god', value: '九地' },
]

/** 求用神所落宫 */
export function yongshenPalace(plate: QimenPlate, y: Yongshen): number {
  const found = plate.palaces.find((p) => {
    if (y.type === 'door') return p.door === y.value
    if (y.type === 'star') return p.star === y.value
    if (y.type === 'god') return p.god === y.value
    return p.tianGan === y.value || p.diGan === y.value
  })
  return found?.num ?? 5
}

export { STEMS, BRANCHES }
