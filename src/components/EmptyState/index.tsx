import type { ReactNode } from 'react'
import { Empty } from 'antd'

export function EmptyState({
  description = '暂无数据',
}: {
  description?: ReactNode
}) {
  return (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
  )
}
