import { Alert, Button, Popconfirm, Space, Tabs, Tag } from 'antd'
import { Link, useSearchParams } from 'react-router'
import { RequestError } from '../../components/RequestError'
import { formatDateTime } from '../../utils/formatDate'
import {
  paginationParams,
  positiveInteger,
  updateSearchParams,
} from '../../utils/searchParams'
import { ManagementTable } from '../../components/ManagementTable'
import { useMyLoans, useReturnLoan } from './hooks'
import type { Loan, MyLoanParams } from './types'

export function MyLoans() {
  const [search, setSearch] = useSearchParams()
  const status = search.get('status')
  const params: MyLoanParams = {
    ...paginationParams(search),
    status: status === 'BORROWED' || status === 'RETURNED' ? status : undefined,
    book_id: positiveInteger(search.get('book_id')),
  }
  const query = useMyLoans(params)
  const mutation = useReturnLoan()
  return (
    <div className="content-stack">
      <Tabs
        activeKey={params.status ?? 'ALL'}
        items={[
          { key: 'ALL', label: '全部借阅' },
          { key: 'BORROWED', label: '当前借阅' },
          { key: 'RETURNED', label: '历史借阅' },
        ]}
        onChange={(value) => {
          setSearch(
            updateSearchParams(search, {
              status: value === 'ALL' ? undefined : value,
              page: 1,
            }),
          )
        }}
      />
      <Space wrap>
        {params.book_id && (
          <Tag
            closable
            onClose={() =>
              setSearch(
                updateSearchParams(search, { book_id: undefined, page: 1 }),
              )
            }
          >
            图书 #{params.book_id}
          </Tag>
        )}
      </Space>
      {mutation.isSuccess && (
        <Alert type="success" showIcon message="归还成功" />
      )}
      {mutation.isError && <RequestError error={mutation.error} />}
      <ManagementTable<Loan>
        query={query}
        label="借阅"
        emptyDescription="暂无借阅记录"
        loadingLabel="正在加载借阅记录…"
        scrollX={1100}
        totalUnit="条"
        columns={[
          { title: '借阅编号', dataIndex: 'id' },
          {
            title: '图书',
            key: 'book',
            render: (_, loan) => (
              <Link to={`/books/${loan.book_id}`}>图书 #{loan.book_id}</Link>
            ),
          },
          { title: '馆藏副本编号', dataIndex: 'book_copy_id' },
          {
            title: '借出时间',
            dataIndex: 'borrowed_at',
            render: formatDateTime,
          },
          { title: '应还时间', dataIndex: 'due_at', render: formatDateTime },
          {
            title: '归还时间',
            dataIndex: 'returned_at',
            render: formatDateTime,
          },
          {
            title: '状态',
            key: 'status',
            render: (_, loan) => (
              <Space>
                <Tag color={loan.status === 'RETURNED' ? 'default' : 'blue'}>
                  {loan.status === 'RETURNED' ? '已归还' : '借阅中'}
                </Tag>
                {loan.is_overdue && <Tag color="red">逾期</Tag>}
              </Space>
            ),
          },
          {
            title: '操作',
            key: 'actions',
            render: (_, loan) =>
              loan.status === 'BORROWED' ? (
                <Popconfirm
                  title="确认归还此书？"
                  description={`借阅编号 #${loan.id}`}
                  okText="确认归还"
                  cancelText="取消"
                  disabled={mutation.isPending}
                  okButtonProps={{ disabled: mutation.isPending }}
                  onConfirm={() => {
                    if (!mutation.isPending) mutation.mutate(loan.id)
                  }}
                >
                  <Button
                    aria-label="归还"
                    disabled={mutation.isPending}
                    loading={
                      mutation.isPending && mutation.variables === loan.id
                    }
                  >
                    归还
                  </Button>
                </Popconfirm>
              ) : (
                '—'
              ),
          },
        ]}
      />
    </div>
  )
}
