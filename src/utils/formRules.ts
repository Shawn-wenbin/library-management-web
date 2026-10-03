import type { Rule } from 'antd/es/form'

export const requiredText = (max: number): Rule[] => [
  { required: true, whitespace: true, message: '请输入内容' },
  { max, message: `最多 ${max} 个字符` },
]
export const optionalText = (max: number): Rule[] => [
  { max, message: `最多 ${max} 个字符` },
]
export const positiveIdRules: Rule[] = [
  {
    validator: (_, value: number | null | undefined) =>
      value == null || (Number.isSafeInteger(value) && value > 0)
        ? Promise.resolve()
        : Promise.reject(new Error('请输入有效的正整数编号')),
  },
]
export const dateRules: Rule[] = [
  {
    validator: (_, value: string | null | undefined) => {
      if (!value) return Promise.resolve()
      const date = new Date(`${value}T00:00:00Z`)
      return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
        ? Promise.resolve()
        : Promise.reject(new Error('请输入有效日期（YYYY-MM-DD）'))
    },
  },
]
