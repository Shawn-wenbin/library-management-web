import axios from 'axios'
import type { components } from './generated/schema'

type ValidationIssue = components['schemas']['ValidationError']

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly issues: ValidationIssue[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidationIssue(value: unknown): value is ValidationIssue {
  return (
    isRecord(value) &&
    typeof value.msg === 'string' &&
    typeof value.type === 'string' &&
    Array.isArray(value.loc) &&
    value.loc.every(
      (part: unknown) => typeof part === 'string' || typeof part === 'number',
    )
  )
}

// The running backend's error handler omits msg and wraps issues in details.
// Keep this runtime compatibility separate from generated OpenAPI types.
const validationMessages: Record<string, string> = {
  missing: '此项为必填项',
  greater_than: '数值必须大于允许的下限',
  greater_than_equal: '数值不能小于允许的下限',
  less_than: '数值必须小于允许的上限',
  less_than_equal: '数值不能大于允许的上限',
  string_too_short: '输入内容过短',
  string_too_long: '输入内容过长',
  int_parsing: '请输入有效的整数',
  int_type: '请输入有效的整数',
  enum: '请选择有效的选项',
}

function readValidationIssues(value: unknown): ValidationIssue[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item: unknown) => {
    if (isValidationIssue(item)) return [item]
    if (
      !isRecord(item) ||
      typeof item.type !== 'string' ||
      !Array.isArray(item.loc) ||
      item.loc.length === 0 ||
      !item.loc.every(
        (part: unknown) => typeof part === 'string' || typeof part === 'number',
      )
    )
      return []
    return [
      {
        loc: item.loc,
        type: item.type,
        msg: validationMessages[item.type] ?? '此字段不符合要求，请检查输入',
      },
    ]
  })
}

export function normalizeApiError(error: unknown): ApiError {
  if (!axios.isAxiosError<unknown>(error))
    return new ApiError('请求失败，请稍后重试')
  const status = error.response?.status
  const body = error.response?.data
  // 401/403/409 are not described in OpenAPI. Treat their payloads as unknown.
  const detail = isRecord(body) ? body.detail : undefined
  const envelope =
    isRecord(body) &&
    typeof body.code === 'string' &&
    typeof body.message === 'string'
      ? body
      : undefined
  const businessMessage =
    typeof envelope?.message === 'string' && envelope.message.trim()
      ? envelope.message
      : undefined
  const issues = readValidationIssues(
    Array.isArray(detail) ? detail : envelope?.details,
  )
  if (!status) return new ApiError('无法连接服务器，请检查网络后重试')
  if (status === 401)
    return new ApiError('登录凭据无效或已过期，请重新登录', status)
  if (status === 403) return new ApiError('无权限访问', status)
  if (status === 404)
    return new ApiError(businessMessage ?? '请求的资源不存在', status)
  if (status === 409)
    return new ApiError(
      typeof detail === 'string'
        ? detail
        : (businessMessage ?? '操作存在冲突，请刷新后重试'),
      status,
    )
  if (status === 422)
    return new ApiError(
      businessMessage ?? '提交的信息不符合要求，请检查表单',
      status,
      issues,
    )
  if (status >= 500) return new ApiError('服务暂时不可用，请稍后重试', status)
  return new ApiError('请求失败，请稍后重试', status)
}
