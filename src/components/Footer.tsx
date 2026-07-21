import BrandLogo from '@/components/BrandLogo'
import { Link } from 'react-router-dom'

const FOOT_LINKS = [
  { to: '/wiki', label: '藏经阁' },
  { to: '/talks', label: '主创说' },
  { to: '/terms', label: '服务条款' },
]

export default function Footer() {
  return (
    <footer className="bg-deep3 py-16 text-center">
      <div className="zf-container flex flex-col items-center gap-5">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandLogo variant="mark" size={24} />
          <span className="font-serif text-[18px] font-bold tracking-[0.14em] text-goldbright">
            紫府 · <span className="font-latin font-medium">Zifu Palace</span>
          </span>
        </Link>
        <p className="max-w-md text-[12.5px] leading-[1.8] text-silkmuted">
          古籍数字化 · AI 参详 — 仅供文化研究与体验，不构成任何决策建议
        </p>
        <nav className="flex items-center gap-3 text-[13px] tracking-[0.1em]">
          {FOOT_LINKS.map((l, i) => (
            <span key={l.to} className="flex items-center gap-3">
              {i > 0 && <span className="text-silkmuted/40">｜</span>}
              <Link to={l.to} className="text-silkmuted transition-colors hover:text-goldbright">
                {l.label}
              </Link>
            </span>
          ))}
        </nav>
        <p className="font-latin text-[12px] tracking-[0.12em] text-silkmuted/70">
          © 2026 Zifu Palace. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
