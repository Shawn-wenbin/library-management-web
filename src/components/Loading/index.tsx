import { Spin } from 'antd'

export function Loading() {
  return (
    <div className="loading-state" role="status">
      <Spin />
      <span>正在确认登录状态…</span>
    </div>
  )
}
