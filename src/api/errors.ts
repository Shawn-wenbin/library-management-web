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

export function normalizeApiError(error: unknown): ApiError {
  if (!axios.isAxiosError<unknown>(error))
    return new ApiError('请求失败，请稍后重试')
  const status = error.response?.status
  const body = error.response?.data
  // 401/403/409 are not described in OpenAPI. Treat their payloads as unknown.
  const detail = isRecord(body) ? body.detail : undefined
  const issues = Array.isArray(detail) ? detail.filter(isValidationIssue) : []
  if (!status) return new ApiError('无法连接服务器，请检查网络后重试')
  if (status === 401)
    return new ApiError('登录凭据无效或已过期，请重新登录', status)
  if (status === 403) return new ApiError('无权限访问', status)
  if (status === 404) return new ApiError('请求的资源不存在', status)
  if (status === 409)
    return new ApiError(
      typeof detail === 'string' ? detail : '操作存在冲突，请刷新后重试',
      status,
    )
  if (status === 422)
    return new ApiError('提交的信息不符合要求，请检查表单', status, issues)
  if (status >= 500) return new ApiError('服务暂时不可用，请稍后重试', status)
  return new ApiError('请求失败，请稍后重试', status)
}
