import type { Copy } from './adminTypes'

export const copyStatuses: { value: Copy['status']; label: string }[] = [
  { value: 'AVAILABLE', label: '可借' },
  { value: 'BORROWED', label: '借出' },
  { value: 'MAINTENANCE', label: '维护' },
  { value: 'LOST', label: '遗失' },
  { value: 'RETIRED', label: '退役' },
]
// BORROWED is entered/exited only by the loan workflow. The server validates
// the remaining transitions, which are not described in OpenAPI.
export const manualCopyStatuses = copyStatuses.filter(
  ({ value }) => value !== 'BORROWED',
)
export function copyStatusLabel(status: Copy['status']) {
  return copyStatuses.find(({ value }) => value === status)?.label ?? status
}
