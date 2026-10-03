import { Spin } from 'antd'

export function Loading({ label = '正在确认登录状态…' }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <Spin />
      <span>{label}</span>
    </div>
  )
}
