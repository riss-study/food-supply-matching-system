import type { ReactNode } from "react"

interface AsyncBoundaryProps<T> {
  isLoading: boolean
  error?: unknown
  data: T | undefined
  loadingFallback: ReactNode
  errorFallback: ReactNode
  isEmpty?: (data: T) => boolean
  emptyFallback?: ReactNode
  children: (data: T) => ReactNode
}

export function AsyncBoundary<T>({
  isLoading,
  error,
  data,
  loadingFallback,
  errorFallback,
  isEmpty,
  emptyFallback,
  children,
}: AsyncBoundaryProps<T>) {
  if (isLoading) return <>{loadingFallback}</>
  if (error || data === undefined) return <>{errorFallback}</>
  if (isEmpty && emptyFallback && isEmpty(data)) return <>{emptyFallback}</>
  return <>{children(data)}</>
}
