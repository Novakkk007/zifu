import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router'
import { Star, History, Settings } from 'lucide-react'
import { RESTORE_ROUTES, SafeStorage, STORAGE_KEYS, saveRestoreItem, useSafeStorage } from '@/lib/storage'
import type { FavoriteItem, HistoryItem, Preferences, RestoreType } from '@/lib/storage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card'
import { ZifuButton } from '@/components/Buttons'
import { EmptyState } from '@/components/EmptyState'
// import { LoadingState } from '@/components/LoadingState'
// import { cn } from '@/lib/utils'

// 本地存储数据类型定义
const DEFAULT_FAVORITES: FavoriteItem[] = []
const DEFAULT_HISTORY: HistoryItem[] = []
const DEFAULT_PREFS: Preferences = {
  defaultGender: 'male',
  useTrueSolarTime: false,
}

function RestoreLink({ item, children }: { item: FavoriteItem | HistoryItem; children: string }) {
  if (!Object.prototype.hasOwnProperty.call(RESTORE_ROUTES, item.type)) {
    return (
      <span
        className="cursor-not-allowed text-[13px] text-inkmuted/60"
        aria-disabled="true"
        title="暂不支持回看此类型"
      >
        暂不可看
      </span>
    )
  }

  const type = item.type as RestoreType
  return (
    <Link
      to={RESTORE_ROUTES[type]}
      onClick={(event) => {
        const saved = saveRestoreItem({
          type,
          title: item.title,
          payload: item.payload,
        })
        if (!saved) event.preventDefault()
      }}
      className="text-[13px] text-golddim hover:text-goldbright"
    >
      {children}
    </Link>
  )
}

export default function Profile() {
  // const navigate = useNavigate()
  
  // 收藏功能
  const [favorites, setFavorites] = useSafeStorage<FavoriteItem[]>(STORAGE_KEYS.FAVORITES, DEFAULT_FAVORITES)
  
  // 历史记录（最近10次）
  const [history, setHistory] = useSafeStorage<HistoryItem[]>(STORAGE_KEYS.HISTORY, DEFAULT_HISTORY)
  
  // 偏好设置
  const [prefs, setPrefs] = useSafeStorage<Preferences>(STORAGE_KEYS.PREFS, DEFAULT_PREFS)
  
  // 本地状态
  const [isEditingPrefs, setIsEditingPrefs] = useState(false)
  const [tempPrefs, setTempPrefs] = useState<Preferences>(prefs)
  
  // 格式化时间
  const fmtTime = (d: Date | string) => {
    const date = d instanceof Date ? d : new Date(d)
    return date.toLocaleString('zh-CN', { hour12: false })
  }
  
  // 清空收藏
  const clearFavorites = () => {
    if (window.confirm('确定要清空所有收藏吗？此操作不可撤销。')) {
      SafeStorage.set(STORAGE_KEYS.FAVORITES, [])
      setFavorites([])
    }
  }
  
  // 清空历史
  const clearHistory = () => {
    if (window.confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
      SafeStorage.set(STORAGE_KEYS.HISTORY, [])
      setHistory([])
    }
  }
  
  // 保存偏好设置
  const savePreferences = () => {
    SafeStorage.set(STORAGE_KEYS.PREFS, tempPrefs)
    setPrefs(tempPrefs)
    setIsEditingPrefs(false)
  }
  
  // 添加到收藏（模拟）
  const addToFavorites = (type: string, title: string) => {
    const newItem: FavoriteItem = {
      id: `fav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      createdAt: new Date().toISOString(),
      payload: {}, // 实际项目中会包含具体数据
    }
    
    const updatedFavorites = [newItem, ...favorites].slice(0, 50) // 限制最多50个
    SafeStorage.set(STORAGE_KEYS.FAVORITES, updatedFavorites)
    setFavorites(updatedFavorites)
  }
  
  // 模拟添加一些示例数据用于演示
  useEffect(() => {
    // 如果没有收藏数据，添加一些示例
    if (favorites.length === 0) {
      const examples: FavoriteItem[] = [
        {
          id: 'fav-1',
          type: 'bazi',
          title: '张三八字排盘',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          payload: {},
        },
        {
          id: 'fav-2',
          type: 'ziwei',
          title: '李四紫微斗数',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          payload: {},
        },
      ]
      SafeStorage.set(STORAGE_KEYS.FAVORITES, examples)
      setFavorites(examples)
    }
    
    // 如果没有历史数据，添加一些示例
    if (history.length === 0) {
      const examples: HistoryItem[] = [
        {
          id: 'hist-1',
          type: 'bazi',
          title: '王五八字排盘',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          payload: {},
        },
        {
          id: 'hist-2',
          type: 'ziwei',
          title: '赵六紫微斗数',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          payload: {},
        },
        {
          id: 'hist-3',
          type: 'qimen',
          title: '钱七奇门遁甲',
          createdAt: new Date(Date.now() - 10800000).toISOString(),
          payload: {},
        },
      ]
      SafeStorage.set(STORAGE_KEYS.HISTORY, examples)
      setHistory(examples)
    }
  }, [])
  
  // 计算统计信息
  const stats = useMemo(() => ({
    totalFavorites: favorites.length,
    totalHistory: history.length,
  }), [favorites.length, history.length])
  
  return (
    <div className="bg-silk pb-24 pt-14 md:pt-20">
      <div className="zf-container flex flex-col gap-8">
        <header>
          <p className="font-latin text-[11px] font-medium tracking-[0.3em] text-golddim">
            PROFILE
          </p>
          <h1 className="mt-1 font-serif text-[30px] font-black tracking-[0.1em] text-inktext">
            个人中心
          </h1>
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-golddim/25 bg-deep/95 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12.5px] leading-[1.8] text-silkmuted">
              🍃 当前为游客模式：收藏与历史保存在当前设备浏览器，无需注册即可使用。
              更换设备后数据不互通。
            </p>
            <span className="shrink-0 rounded-full border border-golddim/40 px-4 py-1.5 text-[11.5px] tracking-[0.1em] text-golddim">
              账号系统即将上线 · 支持云同步与充值
            </span>
          </div>
        </header>

        {/* ===== 收藏功能 ===== */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle eyebrow="FAVORITES">
              <span className="inline-flex items-center gap-2">
                <Star className="h-5 w-5 text-golddim" aria-hidden />
                我的收藏
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-inkmuted">{stats.totalFavorites} 项</span>
              {stats.totalFavorites > 0 && (
                <ZifuButton variant="ghost" onClick={clearFavorites}>
                  清空
                </ZifuButton>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {favorites.length === 0 ? (
              <EmptyState 
                title="暂无收藏" 
                description="点击「收藏」按钮将命盘添加到此处，方便快速访问。"
                action={
                  <ZifuButton variant="foil" onClick={() => addToFavorites('bazi', '我的八字')}>添加示例</ZifuButton>
                }
              />
            ) : (
              <div className="space-y-4">
                {favorites.slice(0, 10).map((fav) => (
                  <div 
                    key={fav.id} 
                    className="flex items-center justify-between rounded-lg border border-gold/15 bg-silk2 p-4 hover:border-gold/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-goldbright">
                        {fav.type === 'bazi' && '八字'}
                        {fav.type === 'ziwei' && '紫微'}
                        {fav.type === 'qimen' && '奇门'}
                        {fav.type === 'liuyao' && '六爻'}
                        {fav.type === 'hecan' && '合参'}
                        {fav.type !== 'bazi' && fav.type !== 'ziwei' && fav.type !== 'qimen' && fav.type !== 'liuyao' && fav.type !== 'hecan' && '命盘'}
                      </div>
                      <div>
                        <h3 className="font-sans text-[15px] font-medium text-inktext">{fav.title}</h3>
                        <p className="text-[12px] text-inkmuted">{fmtTime(fav.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RestoreLink item={fav}>查看</RestoreLink>
                      <button 
                        className="text-[13px] text-zifured hover:text-zifured/80"
                        onClick={() => {
                          const updated = favorites.filter(f => f.id !== fav.id)
                          SafeStorage.set(STORAGE_KEYS.FAVORITES, updated)
                          setFavorites(updated)
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
                {favorites.length > 10 && (
                  <div className="text-center">
                    <ZifuButton variant="secondary">
                      查看全部 {favorites.length} 项
                    </ZifuButton>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== 历史回看 ===== */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle eyebrow="HISTORY">
              <span className="inline-flex items-center gap-2">
                <History className="h-5 w-5 text-golddim" aria-hidden />
                历史记录
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-inkmuted">{stats.totalHistory} 次</span>
              {stats.totalHistory > 0 && (
                <ZifuButton variant="ghost" onClick={clearHistory}>
                  清空
                </ZifuButton>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <EmptyState 
                title="暂无历史记录" 
                description="每次排盘后，结果会自动保存在此处，最多保留最近10次。"
                action={
                  <ZifuButton variant="foil" onClick={() => addToFavorites('bazi', '我的八字')}>添加示例</ZifuButton>
                }
              />
            ) : (
              <div className="space-y-4">
                {history.slice(0, 10).map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between rounded-lg border border-gold/15 bg-silk2 p-4 hover:border-gold/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-goldbright">
                        {item.type === 'bazi' && '八字'}
                        {item.type === 'ziwei' && '紫微'}
                        {item.type === 'qimen' && '奇门'}
                        {item.type === 'liuyao' && '六爻'}
                        {item.type === 'hecan' && '合参'}
                        {item.type !== 'bazi' && item.type !== 'ziwei' && item.type !== 'qimen' && item.type !== 'liuyao' && item.type !== 'hecan' && '命盘'}
                      </div>
                      <div>
                        <h3 className="font-sans text-[15px] font-medium text-inktext">{item.title}</h3>
                        <p className="text-[12px] text-inkmuted">{fmtTime(item.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RestoreLink item={item}>回看</RestoreLink>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== 偏好设置 ===== */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle eyebrow="PREFERENCES">
              <span className="inline-flex items-center gap-2">
                <Settings className="h-5 w-5 text-golddim" aria-hidden />
                偏好设置
              </span>
            </CardTitle>
            {!isEditingPrefs && (
              <ZifuButton variant="secondary" onClick={() => setIsEditingPrefs(true)}>
                编辑
              </ZifuButton>
            )}
          </CardHeader>
          <CardContent>
            {isEditingPrefs ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-sans text-[15px] font-medium text-inktext mb-2">默认性别</h3>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="defaultGender" 
                        value="male" 
                        checked={tempPrefs.defaultGender === 'male'}
                        onChange={(e) => setTempPrefs({...tempPrefs, defaultGender: e.target.value as 'male' | 'female' | 'other'})}
                        className="h-4 w-4 text-goldbright focus:ring-goldbright"
                      />
                      <span className="text-[14px] text-inktext">男</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="defaultGender" 
                        value="female" 
                        checked={tempPrefs.defaultGender === 'female'}
                        onChange={(e) => setTempPrefs({...tempPrefs, defaultGender: e.target.value as 'male' | 'female' | 'other'})}
                        className="h-4 w-4 text-goldbright focus:ring-goldbright"
                      />
                      <span className="text-[14px] text-inktext">女</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="defaultGender" 
                        value="other" 
                        checked={tempPrefs.defaultGender === 'other'}
                        onChange={(e) => setTempPrefs({...tempPrefs, defaultGender: e.target.value as 'male' | 'female' | 'other'})}
                        className="h-4 w-4 text-goldbright focus:ring-goldbright"
                      />
                      <span className="text-[14px] text-inktext">其他</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-sans text-[15px] font-medium text-inktext mb-1">真太阳时</h3>
                    <p className="text-[13px] text-inkmuted">使用真太阳时计算命盘（更精确）</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={tempPrefs.useTrueSolarTime === true}
                      onChange={(e) => setTempPrefs({...tempPrefs, useTrueSolarTime: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gold/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gold after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-goldbright"></div>
                  </label>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <ZifuButton variant="ghost" onClick={() => setIsEditingPrefs(false)}>
                    取消
                  </ZifuButton>
                  <ZifuButton variant="foil" onClick={savePreferences}>
                    保存设置
                  </ZifuButton>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gold/15">
                  <span className="text-[14px] text-inktext">默认性别</span>
                  <span className="text-[14px] font-medium text-inktext">
                    {prefs.defaultGender === 'male' && '男'}
                    {prefs.defaultGender === 'female' && '女'}
                    {prefs.defaultGender === 'other' && '其他'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gold/15">
                  <span className="text-[14px] text-inktext">真太阳时</span>
                  <span className="text-[14px] font-medium text-inktext">
                    {prefs.useTrueSolarTime ? '启用' : '禁用'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[14px] text-inktext">主题模式</span>
                  <span className="text-[14px] font-medium text-inktext">深色</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== 快捷入口 ===== */}
        <Card>
          <CardHeader>
            <CardTitle eyebrow="QUICK ACCESS">快捷入口</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link to="/bazi" className="block">
                <div className="flex items-center gap-3 rounded-lg border border-gold/15 bg-silk2 p-4 hover:border-gold/30 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-goldbright">
                    八字
                  </div>
                  <div>
                    <h3 className="font-sans text-[15px] font-medium text-inktext">八字排盘</h3>
                    <p className="text-[13px] text-inkmuted">传统八字命理分析</p>
                  </div>
                </div>
              </Link>
              
              <Link to="/ziwei" className="block">
                <div className="flex items-center gap-3 rounded-lg border border-gold/15 bg-silk2 p-4 hover:border-gold/30 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-goldbright">
                    紫微
                  </div>
                  <div>
                    <h3 className="font-sans text-[15px] font-medium text-inktext">紫微斗数</h3>
                    <p className="text-[13px] text-inkmuted">星曜命盘推演</p>
                  </div>
                </div>
              </Link>
              
              <Link to="/qimen" className="block">
                <div className="flex items-center gap-3 rounded-lg border border-gold/15 bg-silk2 p-4 hover:border-gold/30 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-goldbright">
                    奇门
                  </div>
                  <div>
                    <h3 className="font-sans text-[15px] font-medium text-inktext">奇门遁甲</h3>
                    <p className="text-[13px] text-inkmuted">时空决策系统</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
