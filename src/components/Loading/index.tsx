import { Spin } from 'antd'

export function Loading({
  label = '正在加载…',
  compact = false,
}: {
  label?: string
  compact?: boolean
}) {
  return (
    <div
      className={`loading-state${compact ? ' loading-state-compact' : ''}`}
      role="status"
      aria-live="polite"
    >
      <Spin />
      <span>{label}</span>
    </div>
  )
}
