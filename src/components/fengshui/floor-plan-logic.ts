/**
 * 户型图参详逻辑——标记+朝向 → 文化参详与环境提示。
 * 全部为环境检查型建议，无吉凶断言。
 */
import type { FloorPlanMark } from '@/components/fengshui/FloorPlanEditor'

/** 九宫格传统方位名（上南下北户型图惯例：上=南） */
const CELL_NAMES = ['东南', '南', '西南', '东', '中宫', '西', '东北', '北', '西北']

/** 门位 → 环境参详（采光通风为主，文化说明为辅） */
const DOOR_POSITION_NOTES: Record<string, string> = {
  南: '南向开门，传统上以向阳为安居通识；实际宜核验采光与通风条件。',
  北: '北向开门，冬季日照较少；宜关注室内采光补充与保暖措施。',
  东: '东向开门，晨光先入；传统以「紫气东来」为吉象之说，宜核验西晒与噪声。',
  西: '西向开门，午后西晒较强；宜关注遮阳与隔热。',
  东南: '东南向开门，传统上以巽位应风，重空气流通；宜核验潮湿与通风。',
  西南: '西南向开门，午后日照长；宜关注遮阳与室内温度。',
  东北: '东北向开门，冬季受寒；宜关注保温与入户防风。',
  西北: '西北向开门，冬季风硬；宜关注入户玄关挡风与保暖。',
  中宫: '门位居户型中部（较少见），宜核验动线是否穿越主要活动区。',
}

/** 门主灶关系 → 参详 */
function relationNotes(marks: FloorPlanMark[]): string[] {
  const notes: string[] = []
  const door = marks.find((m) => m.type === 'door')
  const master = marks.find((m) => m.type === 'master')
  const kitchen = marks.find((m) => m.type === 'kitchen')

  if (door && master) {
    const same = door.cell === master.cell
    const adj = !same && Math.abs((door.cell % 3) - (master.cell % 3)) <= 1 && Math.abs(Math.floor(door.cell / 3) - Math.floor(master.cell / 3)) <= 1
    if (same) {
      notes.push('大门与主卧同宫——入户视线与声音直达卧区，宜以玄关或隔断缓冲私密与声光干扰。')
    } else if (adj) {
      notes.push('大门与主卧相邻——夜间出入声响易扰睡眠，宜加装隔音门或调整床头远离门侧。')
    }
  }
  if (door && kitchen) {
    const adj = Math.abs((door.cell % 3) - (kitchen.cell % 3)) <= 1 && Math.abs(Math.floor(door.cell / 3) - Math.floor(kitchen.cell / 3)) <= 1
    if (adj) {
      notes.push('大门与厨房相邻——入户动线易穿过烹饪区，宜复核油烟扩散、碰撞与消防安全。')
    }
  }
  if (master && kitchen) {
    const adj = Math.abs((master.cell % 3) - (kitchen.cell % 3)) <= 1 && Math.abs(Math.floor(master.cell / 3) - Math.floor(kitchen.cell / 3)) <= 1
    if (adj) {
      notes.push('厨房与主卧相邻——油烟与设备噪声影响睡眠，宜加强排烟与隔音。')
    }
  }
  return notes
}

export interface PlanAdvice {
  title: string
  text: string
}

/** 主入口：户型图参详 */
export function analyzeFloorPlan(marks: FloorPlanMark[], degrees: number | null): PlanAdvice[] {
  const advice: PlanAdvice[] = []
  const door = marks.find((m) => m.type === 'door')

  if (door) {
    const cellName = CELL_NAMES[door.cell]
    advice.push({
      title: `门位 · ${cellName}`,
      text: DOOR_POSITION_NOTES[cellName] ?? '门位已标注，宜结合朝向核验采光与通风。',
    })
  } else {
    advice.push({
      title: '门位 · 未标注',
      text: '传统宅法以「门为气口」——建议先标注大门位置，再作门主灶参详。',
    })
  }

  for (const n of relationNotes(marks)) {
    advice.push({ title: '门主灶关系', text: n })
  }

  if (degrees != null) {
    const north = ((degrees % 360) + 360) % 360
    let facing: string
    if (north >= 337.5 || north < 22.5) facing = '正北'
    else if (north < 67.5) facing = '东北'
    else if (north < 112.5) facing = '正东'
    else if (north < 157.5) facing = '东南'
    else if (north < 202.5) facing = '正南'
    else if (north < 247.5) facing = '西南'
    else if (north < 292.5) facing = '正西'
    else facing = '西北'
    advice.push({
      title: `宅向 · ${facing}（${Math.round(north)}°）`,
      text:
        facing === '正南'
          ? '正南向宅，采光条件传统上最优；宜核验夏季遮阳与隔热。'
          : facing === '正北'
            ? '正北向宅，冬季日照少；宜关注采光补充与保温。'
            : `${facing}向宅——朝向已记录。实际采光通风还需结合楼层、周边建筑遮挡与窗洞布局核验；罗盘度数若有误差，请以现场复核为准。`,
    })
  }

  if (advice.length <= 1) {
    advice.push({
      title: '更多参详',
      text: '标注齐全（门/主卧/厨房）后，可获得门主灶关系与方位参详；结合上方八问自查，环境检查提示更完整。',
    })
  }

  return advice
}
