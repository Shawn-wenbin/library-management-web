import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

export function Providers({
  children,
  client,
}: PropsWithChildren<{ client: QueryClient }>) {
  return (
    <QueryClientProvider client={client}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#246454',
            borderRadius: 8,
            fontFamily: 'system-ui, sans-serif',
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </QueryClientProvider>
  )
}
