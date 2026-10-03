import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { updateSearchParams } from './searchParams'

// Recover from a saved out-of-range URL or a shrinking filtered result after a mutation.
export function usePageCorrection(
  page: number,
  pageSize: number,
  total?: number,
) {
  const [search, setSearch] = useSearchParams()
  useEffect(() => {
    if (total === undefined) return
    const lastPage = Math.max(1, Math.ceil(total / pageSize))
    if (page > lastPage) {
      setSearch(updateSearchParams(search, { page: lastPage }), {
        replace: true,
      })
    }
  }, [page, pageSize, total, search, setSearch])
}
