/**
 * 五运六气（运气学说·通识参考）
 * 古人以「五运」（年干定运）与「六气」（年支定气）推年度气候节律与养生方向。
 * 数据为传统通识框架；健康参详仅文化参考，不构成医疗建议。
 */

/** 五运：年干化运（甲己化土、乙庚化金、丙辛化水、丁壬化木、戊癸化火） */
export const WUYUN_MAP: Record<string, { yun: string; note: string }> = {
  甲: { yun: '土运', note: '阳干——土运太过' },
  己: { yun: '土运', note: '阴干——土运不及' },
  乙: { yun: '金运', note: '阴干——金运不及' },
  庚: { yun: '金运', note: '阳干——金运太过' },
  丙: { yun: '水运', note: '阳干——水运太过' },
  辛: { yun: '水运', note: '阴干——水运不及' },
  丁: { yun: '木运', note: '阴干——木运不及' },
  壬: { yun: '木运', note: '阳干——木运太过' },
  戊: { yun: '火运', note: '阳干——火运太过' },
  癸: { yun: '火运', note: '阴干——火运不及' },
}

/** 六气：年支化气（司天之气） */
export const LIUQI_MAP: Record<string, { qi: string; sizai: string }> = {
  子: { qi: '少阴君火', sizai: '司天' },
  午: { qi: '少阴君火', sizai: '司天' },
  丑: { qi: '太阴湿土', sizai: '司天' },
  未: { qi: '太阴湿土', sizai: '司天' },
  寅: { qi: '少阳相火', sizai: '司天' },
  申: { qi: '少阳相火', sizai: '司天' },
  卯: { qi: '阳明燥金', sizai: '司天' },
  酉: { qi: '阳明燥金', sizai: '司天' },
  辰: { qi: '太阳寒水', sizai: '司天' },
  戌: { qi: '太阳寒水', sizai: '司天' },
  巳: { qi: '厥阴风木', sizai: '司天' },
  亥: { qi: '厥阴风木', sizai: '司天' },
}

/** 司天-在泉对应（司天与在泉互为对偶：上半年司天主事、下半年在泉主事） */
export const SIZAI_PAIR: Record<string, string> = {
  少阴君火: '阳明燥金',
  太阴湿土: '太阳寒水',
  少阳相火: '厥阴风木',
  阳明燥金: '少阴君火',
  太阳寒水: '太阴湿土',
  厥阴风木: '少阳相火',
}

export interface YunQiResult {
  /** 中运（如「水运太过」） */
  zhongYun: string
  /** 司天之气 */
  siTian: string
  /** 在泉之气 */
  zaiQuan: string
  /** 年度气候与人话（文化参考） */
  plain: string
}

/** 推算某年的五运六气（输入干支年） */
export function yunQiOf(ganzhiYear: string): YunQiResult {
  const stem = ganzhiYear[0]
  const branch = ganzhiYear[1]
  const wuyun = WUYUN_MAP[stem] ?? { yun: '未知', note: '' }
  const liuqi = LIUQI_MAP[branch] ?? { qi: '未知', sizai: '' }
  const zaiQuan = SIZAI_PAIR[liuqi.qi] ?? '未知'
  const plain = `${wuyun.yun}（${wuyun.note}）为岁运；上半年${liuqi.qi}司天主事，下半年${zaiQuan}在泉主事——传统养生参详据此调寒温燥湿（文化参考，非医疗建议）。`
  return {
    zhongYun: `${wuyun.yun}·${wuyun.note}`,
    siTian: liuqi.qi,
    zaiQuan,
    plain,
  }
}

/** 五运六气通识框架（藏经阁展示用） */
export const YUNQI_FRAMEWORK = [
  { title: '五运（年干定运）', text: '甲己化土、乙庚化金、丙辛化水、丁壬化木、戊癸化火。阳干为「太过」，阴干为「不及」——如丙年为水运太过，辛年为水运不及。' },
  { title: '六气（年支定气）', text: '子午少阴君火、丑未太阴湿土、寅申少阳相火、卯酉阳明燥金、辰戌太阳寒水、巳亥厥阴风木——此为「司天之气」，主上半年。' },
  { title: '司天与在泉', text: '司天主上半年气候，在泉主下半年；两者互为对偶（如君火司天则燥金在泉）。一年之气候，由中运与司天在泉共同交织而成。' },
  { title: '推算三步', text: '①看年干定中运（太过/不及）→ ②看年支定司天 → ③由司天对偶定在泉。三者相参，即得年度「运气」大貌。' },
  { title: '传统养生参详', text: '运气学说原为「司岁备物、调寒温」——如燥金司天之年宜润，寒水司天之年宜温。仅作时令养生文化参考，不替代医疗。' },
]
