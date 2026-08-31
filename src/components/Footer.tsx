import BrandLogo from '@/components/BrandLogo'
import { Link } from 'react-router'
import { useDeployInfo } from '@/hooks/useDeployInfo'

const FOOT_LINKS = [
  { to: '/wiki', label: '藏经阁' },
  { to: '/talks', label: '主创说' },
  { to: '/terms', label: '服务条款' },
  { to: '/privacy', label: '隐私政策' },
]

function VersionLine() {
  const deploy = useDeployInfo()
  if (!deploy) return null
  return (
    <p className="font-latin text-[11px] tracking-[0.12em] text-silkmuted/50">
      {deploy.preview ? 'PREVIEW · ' : ''}build {deploy.commitSha}
    </p>
  )
}

export default function Footer() {
  return (
    <footer className="bg-deep3 py-16 pb-[6.5rem] text-center sm:pb-16">
      <div className="zf-container flex flex-col items-center gap-5">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandLogo variant="mark" size={24} />
          <span className="font-serif text-[18px] font-bold tracking-[0.14em] text-goldbright">
            紫府 · <span className="font-latin font-medium">Zifu Palace</span>
          </span>
        </Link>
        <p className="max-w-md text-[12.5px] leading-[1.8] text-silkmuted">
          仅供传统文化研究与娱乐参考，不构成任何医疗、投资、法律或人生决策建议。
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
        <VersionLine />
      </div>
    </footer>
  )
}
