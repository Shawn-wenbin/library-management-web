export function positiveInteger(value: string | null): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : undefined
}

export function paginationParams(search: URLSearchParams) {
  return {
    page: positiveInteger(search.get('page')) ?? 1,
    page_size: Math.min(positiveInteger(search.get('page_size')) ?? 20, 100),
  }
}

export function updateSearchParams(
  current: URLSearchParams,
  values: Record<string, string | number | boolean | undefined | null>,
) {
  const next = new URLSearchParams(current)
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === '') next.delete(key)
    else next.set(key, String(value))
  }
  return next
}
