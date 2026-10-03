import { Suspense, type PropsWithChildren } from 'react'
import { Outlet, useLocation } from 'react-router'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { Loading } from '../components/Loading'
import { useAuthStore } from '../store/authStore'

export function PageBoundary({ children }: PropsWithChildren) {
  const location = useLocation()
  const session = useAuthStore((state) => state.sessionVersion)
  return (
    <ErrorBoundary key={`${session}:${location.pathname}`} scope="page">
      <Suspense fallback={<Loading label="正在加载页面…" />}>
        {children ?? <Outlet />}
      </Suspense>
    </ErrorBoundary>
  )
}
