/**
 * 时家奇门（拆补法·转盘）引擎类型定义
 */

export interface QimenInput {
  /**
   * 起局时刻 ISO 字符串：
   * - 带时区偏移（Z 或 ±hh:mm）→ 按绝对时刻解析，再换算东八区排盘；
   * - 无时区偏移（如 2024-12-21T18:00）→ 按 ianaTimezone（缺省 Asia/Shanghai）墙钟解析。
   */
  datetime: string
  /** IANA 时区（仅 datetime 无时区偏移时生效，缺省 Asia/Shanghai） */
  ianaTimezone?: string
  /** 所问之事（可选，不入排盘算法，仅落库与展示） */
  question?: string
}

export type Yuan = '上元' | '中元' | '下元'

export interface QimenPalace {
  /** 宫数 1–9 */
  num: number
  /** 卦名小注，如「坎一」 */
  gua: string
  /** 地盘干（三奇六仪之一；中五宫亦有地盘干） */
  diGan: string
  /** 天盘干（该宫天盘星所携本宫地盘干；中五宫无天盘星则为空串） */
  tianGan: string
  /** 寄宫天盘干：天禽寄坤二，天芮所临宫兼带中五地盘干（无则空串） */
  tianGanJi: string
  /** 天盘星（中五宫无星值守，空串） */
  star: string
  /** 寄星：天禽随天芮所临之宫标注（无则空串） */
  starJi: string
  /** 人盘门（中五无门，空串） */
  door: string
  /** 神盘八神（中五无神，空串） */
  god: string
  /** 阴遁异名（白虎→勾陈、玄武→朱雀；无则空串） */
  godAlias: string
  /** 值符星所临宫 */
  isZhifu: boolean
  /** 值使门所临宫 */
  isZhishi: boolean
  /** 时柱旬空所及之宫 */
  isKongWang: boolean
  /** 马星所临宫 */
  hasMaXing: boolean
}

export interface QimenChart {
  /** 起局时刻（东八区墙钟文本） */
  standardTime: string
  /** 输入时刻的 UTC ISO 表示 */
  utcTime: string
  dun: '阳遁' | '阴遁'
  /** 局数 1–9 */
  ju: number
  /** 当前节气名（精确时刻判定） */
  jie: string
  /** 当前节气交节时刻（东八区墙钟文本） */
  jieTime: string
  /** 拆补法三元 */
  yuan: Yuan
  /** 符头日干支（甲己之日） */
  futou: string
  dayGZ: string
  hourGZ: string
  /** 旬首，如「甲子戊」 */
  xunshou: string
  /** 旬首遁仪（戊己庚辛壬癸之一） */
  xunYi: string
  zhifuStar: string
  zhishiDoor: string
  /** 值符星本宫（寄宫处理后，1–9 不含 5） */
  zhifuOrigin: number
  /** 值符星所临宫（即时干宫，寄宫处理后） */
  zhifuPalace: number
  /** 值使门所临宫 */
  zhishiPalace: number
  /** 时柱旬空两支（如「戌亥」） */
  kongWang: string[]
  /** 马星地支 */
  maXingBranch: string
  /** 马星所临宫 */
  maXingPalace: number
  /** 所问之事（透传） */
  question: string
  /** 九宫，按下标 num-1 存放 */
  palaces: QimenPalace[]
}
