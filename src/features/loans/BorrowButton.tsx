import { Alert, Button } from 'antd'
import { Link } from 'react-router'
import { RequestError } from '../../components/RequestError'
import { formatDateTime } from '../../utils/formatDate'
import type { Book } from '../books/types'
import { useBorrowBook } from './hooks'

export function BorrowButton({ book }: { book: Book }) {
  const mutation = useBorrowBook()
  return (
    <div className="content-stack">
      {mutation.isError && <RequestError error={mutation.error} />}
      {mutation.isSuccess && (
        <Alert
          showIcon
          type="success"
          message="借阅成功"
          description={
            <>
              应还时间：{formatDateTime(mutation.data.due_at)}。
              <Link to="/me/loans">查看我的借阅</Link>
            </>
          }
        />
      )}
      <div>
        <Button
          aria-label="借阅此书"
          type="primary"
          loading={mutation.isPending}
          disabled={
            !book.is_active || book.available_copies < 1 || mutation.isPending
          }
          onClick={() => {
            if (!mutation.isPending) mutation.mutate(book.id)
          }}
        >
          借阅此书
        </Button>
      </div>
    </div>
  )
}
