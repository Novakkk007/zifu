/**
 * 紫府八字核心库 · 公共类型定义
 * 纯函数库：无 React / 无 DB / 无网络。前后端共用。
 */

export type Wuxing = '金' | '木' | '水' | '火' | '土'
export type YinYang = '阳' | '阴'
export type Gender = 'male' | 'female'
export type CalendarKind = 'solar' | 'lunar'
export type DayRollover = 'zichu' | 'midnight'

/** 出生输入（升级模型） */
export interface BirthInput {
  /** 公历 / 农历 */
  calendar: CalendarKind
  year: number
  month: number // 公历 1-12 / 农历 1-12
  day: number // 公历 1-31 / 农历 1-30
  /** 0-23；null = 时辰未知（时柱不排，称骨返回 null） */
  hour: number | null
  /** 0-59 */
  minute: number
  gender: Gender
  /** 农历闰月标记（calendar='lunar' 时有效） */
  isLeapMonth?: boolean
  /** 出生城市（预设城市表键名，可解析出经度；仅作展示与经度缺省来源） */
  city?: string
  /** 东经度数，缺省 120（东八区中央经线） */
  longitude?: number
  /** UTC 偏移小时，缺省 8 */
  timezone?: number
  /** 是否启用真太阳时修正 */
  useTrueSolarTime: boolean
  /** 子时换日规则：zichu=子初(23:00)换日；midnight=0 点换日 */
  dayRollover: DayRollover
}

/** 历法换算与时间修正审计信息（供 UI 展示，保证可解释） */
export interface TimeAudit {
  /** 输入历法 */
  inputCalendar: CalendarKind
  /** 是否闰月（农历输入时） */
  isLeapMonth: boolean
  /** 标准时间（换算到东八区墙钟后的公历时刻，YYYY-MM-DD HH:mm） */
  standardTime: string
  /** 出生标准时区 UTC 偏移（小时） */
  timezone: number
  /** 使用经度（东经度数） */
  longitude: number
  /** 经度修正量（分钟）：(经度-120°)×4 */
  longitudeCorrectionMin: number
  /** 均时差修正量（分钟），近似公式版本见 eotFormulaVersion */
  equationOfTimeMin: number
  /** 是否启用真太阳时 */
  useTrueSolarTime: boolean
  /** 排盘所用时刻（真太阳时或标准时，YYYY-MM-DD HH:mm） */
  effectiveTime: string
  /** 均时差近似公式版本标识 */
  eotFormulaVersion: string
  /** 换日规则 */
  dayRollover: DayRollover
  /** 对应的农历日期 */
  lunarYear: number
  lunarMonth: number // 负数表示闰月
  lunarDay: number
  /** 排盘规则版本 */
  rulesetVersion: string
}

/** 藏干条目 */
export interface HiddenStem {
  stem: string
  stemIdx: number
  /** 本气 / 中气 / 余气 */
  role: '本气' | '中气' | '余气'
  wuxing: Wuxing
  /** 相对日主的十神 */
  tenGod: string
}

/** 单柱信息 */
export interface PillarInfo {
  /** 柱位：年柱 / 月柱 / 日柱 / 时柱 */
  label: string
  ganzhi: string
  stem: string
  branch: string
  stemIdx: number
  branchIdx: number
  jiaziIdx: number
  stemWuxing: Wuxing
  branchWuxing: Wuxing
  stemYinYang: YinYang
  branchYinYang: YinYang
  nayin: string
  hiddenStems: HiddenStem[]
  /** 日主在该柱地支的十二长生（阳顺阴逆） */
  stage: string
  /** 天干十神；日主自身为「日主」 */
  stemTenGod: string
}

export interface FourPillars {
  year: PillarInfo
  month: PillarInfo
  day: PillarInfo
  /** 时辰未知时为 null */
  hour: PillarInfo | null
}

/** 柱间关系（合冲刑害破） */
export interface PillarRelation {
  /** 天干五合 / 六合 / 六冲 / 三合局 / 三合半合 / 三会 / 相刑 / 自刑 / 六害 / 相破 */
  type: string
  /** 参与的柱位标签 */
  pillars: string[]
  /** 参与的天干或地支原文（如「甲己」「子午」「申子辰」） */
  chars: string
  /** 合化五行（可化者） */
  resultWuxing?: Wuxing
  /** 规则出处 */
  source: string
}

/** 大运一步 */
export interface DayunStep {
  index: number
  ganzhi: string
  jiaziIdx: number
  stemTenGod: string
  nayin: string
  /** 起止虚岁（起运岁数含 1 位小数） */
  startAge: number
  endAge: number
  /** 大约起止公历年 */
  startYear: number
  endYear: number
  isCurrent: boolean
}

export interface DayunInfo {
  /** 顺排 / 逆排 */
  forward: boolean
  /** 阳男阴女顺排、阴男阳女逆排 的判定说明 */
  directionReason: string
  /** 起运岁数（出生到前/后节气天数 ÷ 3，保留 1 位小数） */
  startAge: number
  /** 起运所数的节气名与精确时刻（东八区） */
  refJieName: string
  refJieTime: string
  /** 出生到节气的天数（保留 3 位小数） */
  daysToJie: number
  steps: DayunStep[]
}

export interface LiunianInfo {
  year: number
  ganzhi: string
  jiaziIdx: number
  stemTenGod: string
  /** 周岁（公历年差） */
  age: number
  isCurrent: boolean
}

/** 十神条目（含来源柱位/干支，全量：天干 + 藏干） */
export interface TenGodEntry {
  tenGod: string
  /** 来源柱位：年柱/月柱/日柱/时柱 */
  pillar: string
  /** 来源干支原文（天干如「甲」，藏干如「丑中己土」） */
  char: string
  /** 天干 / 藏干 */
  layer: 'stem' | 'hidden'
}

export interface ShenshaHit {
  name: string
  /** 命中柱位（如 ['日支','时支']） */
  hitPositions: string[]
  /** 命中字（如「丑」「酉」） */
  hitChars: string[]
  /** 原始规则口诀 */
  rule: string
  /** 起例依据（如「以日干甲起例」） */
  basis: string
  /** 传统出处 */
  source: string
  /** 解释文案 */
  explanation: string
}

export interface BoneWeight {
  /** 年/月/日/时各自重量（单位：钱，1 两 = 10 钱） */
  yearQian: number
  monthQian: number
  dayQian: number
  hourQian: number
  /** 总重（钱） */
  totalQian: number
  /** 展示文本，如「三两九钱」 */
  totalText: string
  /** 年干支（按农历年，正月初一换年） */
  yearGanzhi: string
  lunarMonth: number
  lunarDay: number
  hourBranch: string
  /** 称骨歌批语 */
  verse: string
  source: string
}

export interface WuxingAnalysis {
  /** 五行计数（天干 1.0；藏干 本气 0.6 / 中气 0.25 / 余气 0.15，权重见 rules 元数据） */
  count: Record<Wuxing, number>
  missing: Wuxing[]
  strongest: Wuxing
  weakest: Wuxing
  /** 日主旺衰量化：得令/得地/得势 */
  strength: {
    deling: number // 0-40
    dedi: number // 0-30
    deshi: number // 0-30
    total: number // 0-100
    grade: string
    /** 权重公开说明 */
    model: string
    /** 置信度说明文字（时辰未知等会降低置信度） */
    confidence: string
    /** 明确标注：传统规则量化模型，非客观预测 */
    disclaimer: string
  }
}

export interface YongShenAnalysis {
  /** 扶抑法判定：身强→抑，身弱→扶 */
  method: '扶抑'
  strengthGrade: string
  /** 用神五行 */
  yongshen: Wuxing
  /** 喜神五行 */
  xishen: Wuxing[]
  /** 忌神五行 */
  jishen: Wuxing[]
  /** 推理依据文字 */
  reasoning: string[]
  disclaimer: string
}

/** 命宫/身宫（单独标注，不混称「六柱」） */
export interface GongInfo {
  ganzhi: string
  stem: string
  branch: string
  /** 起法说明 */
  method: string
}

export interface BaziChartV2 {
  rulesetVersion: string
  input: BirthInput
  timeAudit: TimeAudit
  pillars: FourPillars
  dayMaster: string
  dayMasterIdx: number
  dayMasterWuxing: Wuxing
  /** 十神全量（天干 + 藏干，注明来源） */
  tenGods: TenGodEntry[]
  relations: PillarRelation[]
  wuxing: WuxingAnalysis
  yongshen: YongShenAnalysis
  shensha: ShenshaHit[]
  /** 查表失败或时辰未知时为 null */
  chenggu: BoneWeight | null
  dayun: DayunInfo
  liunian: LiunianInfo[]
  /** 时辰未知时为 null */
  mingGong: GongInfo | null
  /** 时辰未知时为 null */
  shenGong: GongInfo | null
}

/** 结构评分的可解释因子 */
export interface ScoreFactor {
  key: 'wuxingBalance' | 'tenGodAction' | 'relationDensity'
  name: string
  /** 0-100 子分数 */
  score: number
  /** 权重（全局公开常量） */
  weight: number
  explanation: string
}

export interface DayunScore {
  startAge: number
  ganzhi: string
  score: number
  factors: ScoreFactor[]
}

export interface LiunianScore {
  year: number
  age: number
  ganzhi: string
  score: number
  factors: ScoreFactor[]
}

export interface LifeScores {
  dayunScores: DayunScore[]
  liunianScores: LiunianScore[]
  disclaimer: string
}
