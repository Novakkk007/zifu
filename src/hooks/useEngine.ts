/**
 * useEngine：浏览器直跑引擎的 mutation 形态 hook。
 *
 * 引擎函数是（基本）同步纯函数，但保持与 trpc useMutation 相似的返回形状
 * （data / error / isError / isPending / mutate / mutateAsync / reset），
 * 使原 tRPC 调用点只需替换 hook 与 import，数据读取代码零改动。
 *
 * 纯逻辑（引擎调用 + 错误归一化）抽为 invokeEngine，可无 DOM 单测。
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export type EngineStatus = 'idle' | 'pending' | 'success' | 'error'

export interface UseEngineOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>
  onError?: (error: Error, variables: TVariables) => void
}

export interface UseEngineResult<TData, TVariables> {
  data: TData | undefined
  error: Error | null
  status: EngineStatus
  isIdle: boolean
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  mutate: (variables: TVariables) => void
  mutateAsync: (variables: TVariables) => Promise<TData>
  reset: () => void
}

/** 引擎调用 + 错误归一化（非 Error 抛出统一包为 Error） */
export async function invokeEngine<TData, TVariables>(
  fn: (variables: TVariables) => TData | Promise<TData>,
  variables: TVariables,
): Promise<TData> {
  try {
    return await fn(variables)
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err))
  }
}

interface EngineState<TData> {
  status: EngineStatus
  data: TData | undefined
  error: Error | null
}

const IDLE: EngineState<never> = { status: 'idle', data: undefined, error: null }

export function useEngine<TData, TVariables = void>(
  fn: (variables: TVariables) => TData | Promise<TData>,
  options?: UseEngineOptions<TData, TVariables>,
): UseEngineResult<TData, TVariables> {
  const [state, setState] = useState<EngineState<TData>>(IDLE)
  // 引擎函数/回调每次渲染都可能新建，用 ref 保持最新而不重建 mutate
  // （ref 写入放在 effect 内，遵守 react-hooks/refs 规则）
  const fnRef = useRef(fn)
  const optsRef = useRef(options)
  useEffect(() => {
    fnRef.current = fn
    optsRef.current = options
  })

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setState({ status: 'pending', data: undefined, error: null })
      try {
        const data = await invokeEngine(fnRef.current, variables)
        setState({ status: 'success', data, error: null })
        await optsRef.current?.onSuccess?.(data, variables)
        return data
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setState({ status: 'error', data: undefined, error })
        optsRef.current?.onError?.(error, variables)
        throw error
      }
    },
    [],
  )

  const mutate = useCallback(
    (variables: TVariables) => {
      // 与 useMutation 一致：错误落入 state，不产生未捕获 rejection
      void mutateAsync(variables).catch(() => {})
    },
    [mutateAsync],
  )

  const reset = useCallback(() => setState(IDLE), [])

  return {
    data: state.data,
    error: state.error,
    status: state.status,
    isIdle: state.status === 'idle',
    isPending: state.status === 'pending',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    mutate,
    mutateAsync,
    reset,
  }
}
