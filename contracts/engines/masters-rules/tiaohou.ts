/**
 * 《穷通宝鉴》调候表（蒸馏版）。
 *
 * 来源：docs/classics/qiong_tong_bao_jian.md
 * - 冬、夏按十天干各自的首要调候用神折算为五行；
 * - 春依「正月木旺，宜火调候」取火；
 * - 秋依「秋金得水方精」取水。
 *
 * 该表只用于传统文化参详，不构成现实事件判断。
 */
import type { Wuxing } from '../../bazi-core'

export const TIAOHOU_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const TIAOHOU_MONTH_BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'] as const

type DayStem = (typeof TIAOHOU_STEMS)[number]
type MonthBranch = (typeof TIAOHOU_MONTH_BRANCHES)[number]

export interface TiaohouEntry {
  need: Wuxing
  reason: string
}

type TiaohouTable = Readonly<Record<DayStem, Readonly<Record<MonthBranch, Readonly<TiaohouEntry>>>>>

const spring = (stem: DayStem, branch: MonthBranch): TiaohouEntry => ({
  need: '火',
  reason: `${stem}日主生于${branch}月，春木渐旺，依蒸馏原则取火温养调候`,
})

/**
 * 正月（寅月）精确调候 —— 依《穷通宝鉴》原文直引（课题14，T-20261015）。
 *
 * 现表 `need` 为单一五行，而原文正月甲木为「丙癸」双用；故此处**只精化 reason 依据**，
 * 不改 need 取值与表结构（扩为多值属接口变更，须独立课题评审）。
 * 引文依据等级：缓存索引（次级）——维基文库 10/12-10/15 延续 404。
 */
const zhengYue = (reason: string, need: Wuxing): TiaohouEntry => ({ need, reason })

const autumn = (stem: DayStem, branch: MonthBranch): TiaohouEntry => ({
  need: '水',
  reason: `${stem}日主生于${branch}月，秋气偏燥，依“秋金得水方精”取水润燥`,
})

/** 十天干 × 十二月令调候五行映射。 */
export const TIAOHOU_TABLE: TiaohouTable = {
  甲: {
    寅: zhengYue(
      '正月甲木初春尚有余寒，得丙癸逢富贵双全；癸藏丙透名寒木向阳（《穷通宝鉴·论木·正月甲木》）',
      '火',
    ),
    卯: spring('甲', '卯'),
    辰: spring('甲', '辰'),
    巳: { need: '水', reason: '甲木生于巳月，夏木易燥，首取壬水润局' },
    午: { need: '水', reason: '甲木生于午月，夏木易燥，首取壬水润局' },
    未: { need: '水', reason: '甲木生于未月，夏木易燥，首取壬水润局' },
    申: autumn('甲', '申'),
    酉: autumn('甲', '酉'),
    戌: autumn('甲', '戌'),
    亥: { need: '火', reason: '甲木生于亥月，冬寒木冷，首取丙火暖局' },
    子: { need: '火', reason: '甲木生于子月，冬寒木冷，首取丙火暖局' },
    丑: { need: '火', reason: '甲木生于丑月，冬寒木冷，首取丁火为用，庚金劈甲引丁（《穷通宝鉴》先丁后庚口径）' },
  },
  乙: {
    寅: zhengYue(
      '正月乙木寒气未除，专用丙火解冻，乙木藉丙火而生；忌见癸水冻木（《穷通宝鉴·论木·正月乙木》）',
      '火',
    ),
    卯: spring('乙', '卯'),
    辰: spring('乙', '辰'),
    巳: { need: '水', reason: '乙木生于巳月，夏木易枯，首取癸水滋润' },
    午: { need: '水', reason: '乙木生于午月，夏木易枯，首取癸水滋润' },
    未: { need: '水', reason: '乙木生于未月，夏木易枯，首取癸水滋润' },
    申: autumn('乙', '申'),
    酉: autumn('乙', '酉'),
    戌: autumn('乙', '戌'),
    亥: { need: '火', reason: '乙木生于亥月，冬寒木冷，首取丙火温暖' },
    子: { need: '火', reason: '乙木生于子月，冬寒木冷，首取丙火温暖' },
    丑: { need: '火', reason: '乙木生于丑月，冬寒木冷，首取丙火温暖' },
  },
  丙: {
    寅: zhengYue(
      '正月丙火三阳开泰，火气渐炎，专用壬水；壬透多则取庚金发水之源，壬庚两透科甲显荣（《穷通宝鉴·论火·正月丙火》）',
      '水',
    ),
    卯: spring('丙', '卯'),
    辰: spring('丙', '辰'),
    巳: { need: '水', reason: '丙火生于巳月，夏火炎烈，首取壬水调候' },
    午: { need: '水', reason: '丙火生于午月，夏火炎烈，首取壬水调候' },
    未: { need: '水', reason: '丙火生于未月，夏火炎烈，首取壬水调候' },
    申: autumn('丙', '申'),
    酉: autumn('丙', '酉'),
    戌: autumn('丙', '戌'),
    亥: { need: '木', reason: '丙火生于亥月，冬寒湿重，首取甲木生扶' },
    子: { need: '木', reason: '丙火生于子月，冬寒湿重，首取甲木生扶' },
    丑: { need: '木', reason: '丙火生于丑月，冬寒湿重，首取甲木生扶' },
  },
  丁: {
    寅: zhengYue(
      '正月丁火甲木当权非庚不能劈，甲木引丁须庚金劈甲；庚甲两透富贵双全，不宜见癸水湿木（《穷通宝鉴·论火·正月丁火》）',
      '金',
    ),
    卯: spring('丁', '卯'),
    辰: spring('丁', '辰'),
    巳: { need: '金', reason: '丁火生于巳月，夏火偏燥，首取庚金发水源' },
    午: { need: '金', reason: '丁火生于午月，夏火偏燥，首取庚金发水源' },
    未: { need: '金', reason: '丁火生于未月，夏火偏燥，首取庚金发水源' },
    申: autumn('丁', '申'),
    酉: autumn('丁', '酉'),
    戌: autumn('丁', '戌'),
    亥: { need: '木', reason: '丁火生于亥月，冬火势弱，首取甲木生扶' },
    子: { need: '木', reason: '丁火生于子月，冬火势弱，首取甲木生扶' },
    丑: { need: '木', reason: '丁火生于丑月，冬火势弱，首取甲木生扶' },
  },
  戊: {
    寅: zhengYue(
      '正月戊土阳气舒而寒气未除，非丙不生，无甲不灵，无癸不长；先丙后甲，癸又次之。丙甲两透，科甲定然（《穷通宝鉴·论土·正月戊土》）',
      '火',
    ),
    卯: spring('戊', '卯'),
    辰: spring('戊', '辰'),
    巳: { need: '水', reason: '戊土生于巳月，火炎土燥，首取壬水润局' },
    午: { need: '水', reason: '戊土生于午月，火炎土燥，首取壬水润局' },
    未: { need: '水', reason: '戊土生于未月，火炎土燥，首取壬水润局' },
    申: autumn('戊', '申'),
    酉: autumn('戊', '酉'),
    戌: autumn('戊', '戌'),
    亥: { need: '火', reason: '戊土生于亥月，冬土寒湿，首取丙火暖局' },
    子: { need: '火', reason: '戊土生于子月，冬土寒湿，首取丙火暖局' },
    丑: { need: '火', reason: '戊土生于丑月，冬土寒湿，首取丙火暖局' },
  },
  己: {
    寅: zhengYue(
      '正月己土田园犹冻，盖因腊气未除，余寒未退，故丙为尊。得丙照暖，万物自生，忌见壬水，反为己病；须戊作堤，以保园圃。丙出干者，定主玉堂金马（《穷通宝鉴·论土·正月己土》）',
      '火',
    ),
    卯: spring('己', '卯'),
    辰: spring('己', '辰'),
    巳: { need: '水', reason: '己土生于巳月，火炎土燥，首取壬水润局' },
    午: { need: '水', reason: '己土生于午月，火炎土燥，首取壬水润局' },
    未: { need: '水', reason: '己土生于未月，火炎土燥，首取壬水润局' },
    申: autumn('己', '申'),
    酉: autumn('己', '酉'),
    戌: autumn('己', '戌'),
    亥: { need: '火', reason: '己土生于亥月，冬土寒湿，首取丙火暖局' },
    子: { need: '火', reason: '己土生于子月，冬土寒湿，首取丙火暖局' },
    丑: { need: '火', reason: '己土生于丑月，冬土寒湿，首取丙火暖局' },
  },
  庚: {
    寅: zhengYue(
      '正月庚金木旺土死不能生金，且金寒未除，先用丙暖庚性，又虑土厚埋金须甲疏泄；丙甲两透科甲显荣（《穷通宝鉴·论金·正月庚金》）',
      '火',
    ),
    卯: spring('庚', '卯'),
    辰: spring('庚', '辰'),
    巳: { need: '水', reason: '庚金生于巳月，火炼真金，首取壬水润局' },
    午: { need: '水', reason: '庚金生于午月，火炼真金，首取壬水润局' },
    未: { need: '水', reason: '庚金生于未月，火炼真金，首取壬水润局' },
    申: autumn('庚', '申'),
    酉: autumn('庚', '酉'),
    戌: autumn('庚', '戌'),
    亥: { need: '火', reason: '庚金生于亥月，冬金偏寒，首取丁火温炼' },
    子: { need: '火', reason: '庚金生于子月，冬金偏寒，首取丁火温炼' },
    丑: { need: '火', reason: '庚金生于丑月，冬金偏寒，首取丁火温炼' },
  },
  辛: {
    寅: zhengYue(
      '正月辛金阳气舒而寒气未除，忌甲木司权致辛金失令，取己土为生身之本，欲得辛金发现全赖壬水之功；己壬两透科甲定然（《穷通宝鉴·论金·正月辛金》）',
      '水',
    ),
    卯: spring('辛', '卯'),
    辰: spring('辛', '辰'),
    巳: { need: '水', reason: '辛金生于巳月，夏金受火，首取壬水润局' },
    午: { need: '水', reason: '辛金生于午月，夏金受火，首取壬水润局' },
    未: { need: '水', reason: '辛金生于未月，夏金受火，首取壬水润局' },
    申: autumn('辛', '申'),
    酉: autumn('辛', '酉'),
    戌: autumn('辛', '戌'),
    亥: { need: '火', reason: '辛金生于亥月，冬金偏寒，首取丁火温炼' },
    子: { need: '火', reason: '辛金生于子月，冬金偏寒，首取丁火温炼' },
    丑: { need: '火', reason: '辛金生于丑月，冬金偏寒，首取丁火温炼' },
  },
  壬: {
    寅: zhengYue(
      '正月壬水洪洋之象，能纳百川之流，然水性柔弱，宜用庚金之源，庶不致洪洋无度。有庚丙戊三者齐透，科甲功名（《穷通宝鉴·论水·正月壬水》）',
      '金',
    ),
    卯: spring('壬', '卯'),
    辰: spring('壬', '辰'),
    巳: { need: '金', reason: '壬水生于巳月，夏水易涸，首取庚金发水源' },
    午: { need: '金', reason: '壬水生于午月，夏水易涸，首取庚金发水源' },
    未: { need: '金', reason: '壬水生于未月，夏水易涸，首取庚金发水源' },
    申: autumn('壬', '申'),
    酉: autumn('壬', '酉'),
    戌: autumn('壬', '戌'),
    亥: { need: '土', reason: '壬水生于亥月，冬水势盛，首取戊土制水' },
    子: { need: '土', reason: '壬水生于子月，冬水势盛，首取戊土制水' },
    丑: { need: '土', reason: '壬水生于丑月，冬水势盛，首取戊土制水' },
  },
  癸: {
    寅: zhengYue(
      '正月癸水值三阳之候，雨露之精，其性至柔，先用辛金生癸水之源，次用丙火照暖，名阴阳和合，万物发生。辛丙两透，金榜有名（《穷通宝鉴·论水·正月癸水》）',
      '金',
    ),
    卯: spring('癸', '卯'),
    辰: spring('癸', '辰'),
    巳: { need: '金', reason: '癸水生于巳月，夏水易涸，首取庚金发水源' },
    午: { need: '金', reason: '癸水生于午月，夏水易涸，首取庚金发水源' },
    未: { need: '金', reason: '癸水生于未月，夏水易涸，首取庚金发水源' },
    申: autumn('癸', '申'),
    酉: autumn('癸', '酉'),
    戌: autumn('癸', '戌'),
    亥: { need: '土', reason: '癸水生于亥月，冬水势盛，首取戊土制水' },
    子: { need: '土', reason: '癸水生于子月，冬水势盛，首取戊土制水' },
    丑: { need: '土', reason: '癸水生于丑月，冬水势盛，首取戊土制水' },
  },
}

/** 查询日干与月令对应的传统调候方向；无效输入返回 null。 */
export function tiaohouOf(dayStem: string, monthBranch: string): TiaohouEntry | null {
  if (!TIAOHOU_STEMS.includes(dayStem as DayStem)) return null
  if (!TIAOHOU_MONTH_BRANCHES.includes(monthBranch as MonthBranch)) return null
  return TIAOHOU_TABLE[dayStem as DayStem][monthBranch as MonthBranch]
}
