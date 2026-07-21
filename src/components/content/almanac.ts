/**
 * 每日时令 mock 数据池（确定性：以日柱干支索引为种子轮换选取）
 * 宜忌类目为传统择日通用术语；时辰批语、合本命短批均为原创文案。
 */
import type { WuXing } from '@/components/content/ganzhi'
import {
  BRANCHES,
  WUXING_COLOR,
  controls,
  generatedBy,
  generates,
} from '@/components/content/ganzhi'

/* ---------------- 宜忌池（两池互不相交，避免同日自相矛盾） ---------------- */

const YI_POOL = [
  '祭祀', '祈福', '会友', '出行', '纳财', '修造', '栽种',
  '读书', '习字', '品茗', '静养', '安床', '裁衣', '纳采',
]
const JI_POOL = [
  '动土', '诉讼', '争吵', '借贷', '开仓', '嫁娶', '搬迁',
  '熬夜', '急行', '大举', '伐木', '探病', '破土', '宴饮',
]

function pick(pool: string[], seed: number, n: number) {
  const out: string[] = []
  for (let i = 0; i < n; i++) out.push(pool[(seed + i * 5) % pool.length])
  return out
}

/** 按日柱确定性选取宜忌各 6 项 */
export function yijiOf(dayGzIndex: number): { yi: string[]; ji: string[] } {
  return {
    yi: pick(YI_POOL, (dayGzIndex * 7) % YI_POOL.length, 6),
    ji: pick(JI_POOL, (dayGzIndex * 11 + 3) % JI_POOL.length, 6),
  }
}

/* ---------------- 时辰批语（原创 mock，一句） ---------------- */

export const HOUR_TIPS: string[] = [
  '子正一阳生，万籁俱寂，宜静养安神。',
  '丑时土气沉厚，宜深眠，不宜思虑。',
  '寅时平旦，朝气初动，宜起行早课。',
  '卯时日升，清气满襟，宜读书习字。',
  '辰时得天罡，宜动不宜静，利开局。',
  '巳时日丽，宜会客议事，忌独断。',
  '午时日中正，宜进午餐小憩，养心神。',
  '未时日和，宜徐行消食，缓办庶务。',
  '申时晡时，气力再振，宜攻坚难事。',
  '酉时日入，宜收束一日，盘点得失。',
  '戌时黄昏，宜围炉夜话，忌远行。',
  '亥时人定，宜漱洗安枕，早卧早起。',
]

/* ---------------- 农历近似（mock，仅供体验） ---------------- */

const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']

function lunarDayName(d: number) {
  const ONES = '一二三四五六七八九十'
  if (d <= 10) return `初${ONES[d - 1]}`
  if (d <= 20) return d === 20 ? '二十' : `十${ONES[d - 11]}`
  return d === 30 ? '三十' : `廿${ONES[d - 21]}`
}

/** 农历近似：公历月退一月为月，日加约半月差（mock，界面注明「近似」） */
export function lunarApprox(_y: number, m: number, d: number) {
  const month = ((m + 10) % 12) + 1
  const day = ((d + 13) % 30) + 1
  return `${LUNAR_MONTHS[month - 1]}月${lunarDayName(day)}`
}

/* ---------------- 合本命（今日日干 vs 本命日干） ---------------- */

export type StemRelation = '比和' | '生我' | '我生' | '克我' | '我克'

export function stemRelation(today: WuXing, mine: WuXing): StemRelation {
  if (today === mine) return '比和'
  if (generates(today) === mine) return '生我'
  if (generates(mine) === today) return '我生'
  if (controls(today) === mine) return '克我'
  return '我克'
}

const RELATION_TEXT: Record<StemRelation, { headline: string; para: string; tone: string }> = {
  比和: {
    headline: '同气相求之日',
    para: '今日之气与君同频，行事多得心手相应。宜会友、议事、推进旧案——同声相应，事半功倍；唯忌因顺而惰，留白处亦当自持。',
    tone: '顺',
  },
  生我: {
    headline: '得天相生日',
    para: '今日天时尚君，如草木逢雨。宜开启新篇、拜会贵人、纳言听劝——外来之助最盛之日，敞开心怀即可；所受之恩，记在心里，来日再还。',
    tone: '吉',
  },
  我生: {
    headline: '泄秀向外之日',
    para: '今日君生天时，才气外发，利表达与付出。宜写作、讲授、馈赠、了结人情；唯付出有度，留三分气力给自己，夜来早些安歇。',
    tone: '平',
  },
  克我: {
    headline: '金木相制之日',
    para: '今日天时制君，如舟行逆水。宜守成、缓决断，大事不妨再候一日；行止收敛三分，言语留人一步——退一步处，正是转身之地。',
    tone: '守',
  },
  我克: {
    headline: '财星临身之日',
    para: '今日君能制天时，主动权在手。宜谈合作、理财务、整理账目——进取可得，惟取予之间守个「正」字，见好即收，不贪满盈。',
    tone: '进',
  },
}

/** 合本命结果文案（确定性模板 mock，原创） */
export function hebenReading(todayStem: string, todayEl: WuXing, myStem: string, myEl: WuXing) {
  const rel = stemRelation(todayEl, myEl)
  const t = RELATION_TEXT[rel]
  // 调和之色：相克取通关（克我→我生者泄化），其余取生扶或同气之色
  const harmonyEl: WuXing =
    rel === '克我'
      ? generates(todayEl) // 今日所生，可通关
      : rel === '比和'
        ? myEl
        : rel === '生我'
          ? todayEl
          : rel === '我生'
            ? controls(myEl)
            : generatedBy(myEl)
  return {
    relation: rel,
    headline: `今日${todayStem}${todayEl}当令，君乃${myStem}${myEl}日主——${t.headline}`,
    para: t.para,
    colorAdvice: `着${WUXING_COLOR[harmonyEl]}之色以和之。`,
  }
}

/** 仅供 select 使用的干支标签 */
export function branchLabel(i: number) {
  return BRANCHES[i]
}
