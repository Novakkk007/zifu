import { describe, expect, it } from 'vitest'
import { parseRoundTable, ROUNDTABLE_SCHOOLS } from './roundtable'

describe('圆桌响应净化与分段', () => {
  it('在标题、席名及所有正文中过滤异常控制字符和替换字符', () => {
    const noise = Array.from({ length: 160 }, (_, code) => code)
      .filter((code) => (code < 32 && ![9, 10, 13].includes(code)) || code >= 127)
      .map((code) => String.fromCodePoint(code)).join('') + '\ufffd'
    const result = parseRoundTable(`【先生${noise}开场】开${noise}场
【第${noise}一席 · 子平${noise}格局派】发${noise}言
【共识与${noise}分歧】共${noise}识
【先生${noise}收束】收${noise}束`)
    expect(result.opening).toBe('开场')
    expect(result.seats[0]).toEqual({ school: '子平格局派', content: '发言' })
    expect(result.consensus).toBe('共识')
    expect(result.closing).toBe('收束')
    expect(result.seats).toHaveLength(7)
  })

  it('保留正常换行、制表符、扩展汉字和 emoji', () => {
    const content = '首行\r\n\t次行：𠮷、👩‍👩‍👧‍👦、🕯️、e\u0301。'
    expect(parseRoundTable(`【先生开场】${content}`).opening).toBe(content)
  })

  it('末席不吞入共识与收束，兼容席位标题变体', () => {
    const input = ROUNDTABLE_SCHOOLS.map((school, i) => `【第 ${i + 1} 席：${school.name}】发言${i}`).join('\n')
    const result = parseRoundTable(`【先生开场】开场\n${input}\n【共识与分歧】共识\n【先生收束】收束`)
    expect(result.seats).toEqual(ROUNDTABLE_SCHOOLS.map((school, i) => ({ school: school.name, content: `发言${i}` })))
    expect(result.consensus).toBe('共识')
    expect(result.closing).toBe('收束')
  })

  it('没有席位和共识时，开场仍在收束标题前结束', () => {
    const result = parseRoundTable('【先生开场】开场【先生收束】收束')
    expect(result.opening).toBe('开场')
    expect(result.closing).toBe('收束')
    expect(result.seats).toHaveLength(7)
  })

  it('净化后为空的响应仍补齐缺席说明', () => {
    const result = parseRoundTable('\u0000\ufffd\u0085')
    expect(result.opening).toBe('')
    expect(result.seats).toHaveLength(7)
    expect(result.seats.every((seat) => seat.content === '（此席本次缺席，可追问唤醒）')).toBe(true)
  })
})
