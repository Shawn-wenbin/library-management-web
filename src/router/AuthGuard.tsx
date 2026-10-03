import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '../store/authStore'
import { SessionBoundary } from '../features/auth/SessionBoundary'

export function AuthGuard() {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()
  if (!token)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search + location.hash }}
      />
    )
  return <SessionBoundary>{() => <Outlet />}</SessionBoundary>
}
