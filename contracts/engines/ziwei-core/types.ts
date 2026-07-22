/**
 * 紫微斗数核心库 · 类型定义
 * 纯函数库：无 React / 无 DB / 无网络。前后端共用。
 */
import type { CalendarKind, Gender } from '../../bazi-core/types'

/** 生年四化类型 */
export type HuaKind = '禄' | '权' | '科' | '忌'

/** 排盘输入（简化版 BirthInput：时辰以时支表示） */
export interface ZiweiInput {
  /** 公历 / 农历 */
  calendar: CalendarKind
  year: number
  month: number
  day: number
  /** 时辰支序：0=子 1=丑 … 11=亥 */
  hourBranch: number
  gender: Gender
  /** 农历闰月标记（calendar='lunar' 时有效；闰月按当月计） */
  isLeapMonth?: boolean
  /** 计算当前大限所用的参照公历年（缺省取运行年；测试注入以保证确定性） */
  currentYear?: number
}

export type StarKind = 'major' | 'aux' | 'sha' | 'misc'

export interface ZiweiStar {
  name: string
  kind: StarKind
  /** 生年四化标注（仅当该星被化时存在） */
  hua?: HuaKind
}

export interface DaxianRange {
  /** 虚岁起止（含端点） */
  startAge: number
  endAge: number
}

export interface ZiweiPalace {
  /** 地支（子…亥）与序号（子=0） */
  branch: string
  branchIdx: number
  /** 宫干（五虎遁）与干支 */
  stem: string
  ganzhi: string
  /** 宫名：命宫/兄弟/夫妻/子女/财帛/疾厄/迁移/交友/官禄/田宅/福德/父母 */
  name: string
  isMing: boolean
  isShen: boolean
  majors: ZiweiStar[]
  minors: ZiweiStar[]
  /** 该宫所行大限（虚岁区间） */
  daxian: DaxianRange
}

export interface SihuaEntry {
  star: string
  hua: HuaKind
  branch: string
  palaceName: string
}

export interface DaxianStep {
  index: number
  branch: string
  branchIdx: number
  ganzhi: string
  palaceName: string
  startAge: number
  endAge: number
  isCurrent: boolean
}

export interface ZiweiChartData {
  rulesetVersion: string
  /** 归一化后的输入 */
  input: ZiweiInput
  /** 排盘所用农历日期（month 为负数表示闰月） */
  lunar: { year: number; month: number; day: number; isLeapMonth: boolean }
  /** 对应公历日期 */
  solar: { year: number; month: number; day: number }
  yearGanzhi: string
  yearStem: string
  yearBranch: string
  yearStemIdx: number
  yearBranchIdx: number
  /** 阳男 / 阴男 / 阳女 / 阴女（大限方向依据） */
  genderKind: string
  mingBranch: string
  mingBranchIdx: number
  shenBranch: string
  shenBranchIdx: number
  mingGongGanzhi: string
  /** 五行局：name 如「火六局」，num 为局数（起限虚岁） */
  ju: { name: string; num: number; nayin: string }
  /** 紫微所在宫支 */
  ziweiBranch: string
  tianfuBranch: string
  mingZhu: string
  shenZhu: string
  /** 生年四化（含落宫） */
  sihua: SihuaEntry[]
  /** 十二宫（盘上环形序：寅→卯→…→丑） */
  palaces: ZiweiPalace[]
  daxian: {
    direction: '顺行' | '逆行'
    directionReason: string
    startAge: number
    steps: DaxianStep[]
  }
  currentDaxianIndex: number
}
