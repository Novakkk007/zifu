import { useEffect, useState } from 'react'

export interface DeployInfo {
  env: string
  preview: boolean
  commitSha: string
}

/** 读取部署环境信息（/healthz 由后端注入，不打包进前端 bundle）。 */
export function useDeployInfo(): DeployInfo | null {
  const [info, setInfo] = useState<DeployInfo | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/healthz')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data === 'object') {
          setInfo({
            env: String(data.env ?? ''),
            preview: Boolean(data.preview),
            commitSha: String(data.commitSha ?? 'unknown'),
          })
        }
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

  return info
}
