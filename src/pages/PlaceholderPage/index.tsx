import { Empty, Typography } from 'antd'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section>
      <Typography.Title level={2}>{title}</Typography.Title>
      <Empty description="此功能尚未开放" />
    </section>
  )
}
