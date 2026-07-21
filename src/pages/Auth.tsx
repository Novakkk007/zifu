import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Apple, CheckCircle2, Eye, EyeOff, Loader2, MessageCircle } from 'lucide-react'
import FloatingGlyphs from '@/components/FloatingGlyphs'
import { DeepButton, GoldButton } from '@/components/Buttons'
import { cn } from '@/lib/utils'

type TabKey = 'login' | 'register'

type Toast = { id: number; msg: string }

/* ---------- 表单小件 ---------- */

const fieldCls =
  'h-11 w-full rounded-lg border border-golddim/30 bg-silk px-4 font-sans text-[14.5px] text-inktext outline-none transition-shadow placeholder:text-inkmuted/70 focus:border-gold/60 focus:ring-2 focus:ring-gold/30'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-2 block font-sans text-[13px] font-medium tracking-[0.08em] text-inkmuted">
        {label}
      </label>
      {children}
    </div>
  )
}

/* ---------- 页面 ---------- */

export default function Auth() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>('login')

  /* 登录 */
  const [loginId, setLoginId] = useState('')
  const [loginPwd, setLoginPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  /* 注册 */
  const [regId, setRegId] = useState('')
  const [regCode, setRegCode] = useState('')
  const [regPwd, setRegPwd] = useState('')
  const [showRegPwd, setShowRegPwd] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    document.title = '登录 / 注册 · 紫府'
  }, [])

  /* 验证码 60s 倒计时（mock） */
  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [countdown])

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), msg })
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

  const sendCode = () => {
    if (countdown > 0) return
    if (!regId.trim()) {
      showToast('请先填写手机号或邮箱')
      return
    }
    setCountdown(60)
    showToast('演示模式 · 验证码已模拟发送')
  }

  const mockSubmit = (e: FormEvent, kind: TabKey) => {
    e.preventDefault()
    if (submitting) return
    if (kind === 'register' && !agreed) {
      showToast('请先阅读并同意《服务条款》')
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      showToast('演示模式 · 已模拟登录')
      setTimeout(() => navigate('/'), 900)
    }, 800)
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col lg:flex-row">
      {/* ===== 品牌栏（mobile 顶部横条） ===== */}
      <div className="relative flex items-center gap-3 overflow-hidden bg-deep px-6 py-4 lg:hidden">
        <img src="/assets/logo.png" alt="紫府" className="h-9 w-9" />
        <span className="bg-gradient-to-br from-goldbright to-gold bg-clip-text font-serif text-[20px] font-black tracking-[0.12em] text-transparent">
          紫府
        </span>
        <span className="ml-auto text-[11.5px] tracking-[0.08em] text-silkmuted">
          以典籍为根，AI 逐句参详
        </span>
      </div>

      {/* ===== 品牌栏（desktop 左栏 5/12） ===== */}
      <aside className="relative hidden w-[41.6%] flex-col items-center justify-center overflow-hidden bg-deep lg:flex">
        <FloatingGlyphs count={20} onDeep />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9 }}
          className="relative flex flex-col items-center px-10 text-center"
        >
          <motion.img
            src="/assets/logo.png"
            alt="紫府"
            className="h-24 w-24"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
          />
          <h1 className="mt-7 bg-gradient-to-br from-goldbright to-gold bg-clip-text font-serif text-[56px] font-black leading-none tracking-[0.16em] text-transparent">
            紫府
          </h1>
          <p className="mt-4 font-latin text-[13px] font-medium uppercase tracking-[0.5em] text-gold">
            Zifu Palace
          </p>
          <p className="mt-6 text-[14px] tracking-[0.1em] text-silkmuted">
            以典籍为根，AI 逐句参详
          </p>
          <div className="zf-hairline mt-8" />
          <p className="mt-8 text-[14px] tracking-[0.08em] text-silkmuted">
            注册即赠
            <span className="mx-1.5 font-serif text-[24px] font-bold text-goldbright">36</span>
            灵签 · 按次计费 · 无订阅
          </p>
        </motion.div>
      </aside>

      {/* ===== 表单栏（右栏 7/12，浅色） ===== */}
      <main className="relative flex flex-1 flex-col bg-silk">
        <div className="flex flex-1 items-center justify-center px-6 py-14">
          <motion.div
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="w-full max-w-[420px]"
          >
            {/* Tabs：layoutId 滑动指示 */}
            <div className="flex rounded-full border border-golddim/30 bg-silk2 p-1">
              {(
                [
                  { key: 'login', label: '登录' },
                  { key: 'register', label: '注册' },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'relative flex-1 rounded-full py-2.5 font-sans text-[14.5px] font-medium tracking-[0.2em] transition-colors',
                    tab === t.key ? 'text-silk' : 'text-inkmuted hover:text-inktext',
                  )}
                >
                  {tab === t.key && (
                    <motion.span
                      layoutId="auth-tab-pill"
                      className="absolute inset-0 rounded-full bg-deep"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </button>
              ))}
            </div>

            {/* 面板交叉切换 */}
            <div className="relative mt-9">
              <AnimatePresence mode="wait" initial={false}>
                {tab === 'login' ? (
                  <motion.form
                    key="login"
                    initial={{ x: -16, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 16, opacity: 0 }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    onSubmit={(e) => mockSubmit(e, 'login')}
                    className="flex flex-col gap-5"
                  >
                    <Field label="手机号 / 邮箱">
                      <input
                        className={fieldCls}
                        placeholder="请输入手机号或邮箱"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        autoComplete="username"
                        required
                      />
                    </Field>
                    <Field label="密码">
                      <div className="relative">
                        <input
                          className={cn(fieldCls, 'pr-11')}
                          type={showPwd ? 'text' : 'password'}
                          placeholder="请输入密码"
                          value={loginPwd}
                          onChange={(e) => setLoginPwd(e.target.value)}
                          autoComplete="current-password"
                          required
                        />
                        <button
                          type="button"
                          aria-label={showPwd ? '隐藏密码' : '显示密码'}
                          onClick={() => setShowPwd((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-inkmuted transition-colors hover:text-golddim"
                        >
                          {showPwd ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                        </button>
                      </div>
                    </Field>
                    <div className="-mt-2 text-right">
                      <button
                        type="button"
                        onClick={() => showToast('演示模式 · 重置密码暂未开放')}
                        className="text-[12.5px] tracking-[0.06em] text-inkmuted transition-colors hover:text-golddim"
                      >
                        忘记密码？
                      </button>
                    </div>
                    <DeepButton type="submit" disabled={submitting} className="mt-1 w-full">
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        '登录'
                      )}
                    </DeepButton>
                  </motion.form>
                ) : (
                  <motion.form
                    key="register"
                    initial={{ x: 16, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -16, opacity: 0 }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    onSubmit={(e) => mockSubmit(e, 'register')}
                    className="flex flex-col gap-5"
                  >
                    <Field label="手机号 / 邮箱">
                      <input
                        className={fieldCls}
                        placeholder="请输入手机号或邮箱"
                        value={regId}
                        onChange={(e) => setRegId(e.target.value)}
                        autoComplete="username"
                        required
                      />
                    </Field>
                    <Field label="验证码">
                      <div className="flex gap-3">
                        <input
                          className={fieldCls}
                          placeholder="6 位验证码"
                          value={regCode}
                          onChange={(e) => setRegCode(e.target.value)}
                          maxLength={6}
                          inputMode="numeric"
                          required
                        />
                        <button
                          type="button"
                          onClick={sendCode}
                          disabled={countdown > 0}
                          className={cn(
                            'zf-btn w-[132px] shrink-0 rounded-lg border font-sans text-[12.5px] font-medium tracking-[0.06em]',
                            countdown > 0
                              ? 'cursor-not-allowed border-golddim/20 text-inkmuted/60'
                              : 'border-golddim/50 text-golddim hover:bg-gold/10',
                          )}
                        >
                          {countdown > 0 ? (
                            <motion.span
                              key={countdown}
                              initial={{ y: 5, opacity: 0.4 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ duration: 0.18 }}
                              className="inline-block"
                            >
                              {countdown}s 后重发
                            </motion.span>
                          ) : (
                            '获取验证码'
                          )}
                        </button>
                      </div>
                    </Field>
                    <Field label="设置密码">
                      <div className="relative">
                        <input
                          className={cn(fieldCls, 'pr-11')}
                          type={showRegPwd ? 'text' : 'password'}
                          placeholder="至少 8 位，含字母与数字"
                          value={regPwd}
                          onChange={(e) => setRegPwd(e.target.value)}
                          autoComplete="new-password"
                          minLength={8}
                          required
                        />
                        <button
                          type="button"
                          aria-label={showRegPwd ? '隐藏密码' : '显示密码'}
                          onClick={() => setShowRegPwd((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-inkmuted transition-colors hover:text-golddim"
                        >
                          {showRegPwd ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                        </button>
                      </div>
                    </Field>
                    <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-[1.8] text-inkmuted">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#C7A23A]"
                      />
                      <span>
                        我已阅读并同意
                        <Link
                          to="/terms"
                          target="_blank"
                          className="mx-0.5 text-golddim underline-offset-2 hover:underline"
                        >
                          《服务条款》
                        </Link>
                      </span>
                    </label>
                    <GoldButton type="submit" disabled={submitting} className="mt-1 w-full">
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        '注册并领取 36 灵签'
                      )}
                    </GoldButton>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* 第三方登录占位 */}
            <div className="mt-10 flex flex-col items-center gap-4">
              <div className="flex w-full items-center gap-4">
                <span className="h-px flex-1 bg-golddim/20" />
                <span className="text-[12px] tracking-[0.14em] text-inkmuted">
                  第三方登录陆续开放
                </span>
                <span className="h-px flex-1 bg-golddim/20" />
              </div>
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-golddim/25 text-inkmuted/50">
                  <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-golddim/25 text-inkmuted/50">
                  <Apple className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 右栏底部一行 */}
        <footer className="flex items-center justify-center gap-3 pb-6 text-[12px] tracking-[0.08em] text-inkmuted">
          <span className="font-latin">© 2026 Zifu Palace</span>
          <span className="text-inkmuted/40">·</span>
          <Link to="/terms" className="transition-colors hover:text-golddim">
            服务条款
          </Link>
          <span className="text-inkmuted/40">·</span>
          <Link to="/" className="transition-colors hover:text-golddim">
            返回首页
          </Link>
        </footer>
      </main>

      {/* 轻量 toast（本地实现，避免依赖全局 Toaster） */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="fixed bottom-8 left-1/2 z-[70] -translate-x-1/2"
          >
            <div className="flex items-center gap-2.5 rounded-full border border-gold/30 bg-deep2 px-5 py-2.5 shadow-card">
              <CheckCircle2 className="h-4 w-4 text-goldbright" strokeWidth={1.8} />
              <span className="text-[13px] tracking-[0.08em] text-silktext">{toast.msg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
