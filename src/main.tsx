import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import './styles/global.css'
import { App } from './app/App'
import { Providers } from './app/providers'
import { ErrorBoundary } from './components/ErrorBoundary'
import { bindAuthCache, createQueryClient } from './app/queryClient'

const client = createQueryClient()
const unbindAuthCache = bindAuthCache(client)
if (import.meta.hot) import.meta.hot.dispose(unbindAuthCache)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Providers client={client}>
        <App />
      </Providers>
    </ErrorBoundary>
  </StrictMode>,
)
