import { Alert, Button, Popconfirm, Space, Table, Tabs, Tag } from 'antd'
import { Link, useSearchParams } from 'react-router'
import { RequestError } from '../../components/RequestError'
import { formatDateTime } from '../../utils/formatDate'
import {
  paginationParams,
  positiveInteger,
  updateSearchParams,
} from '../../utils/searchParams'
import { usePageCorrection } from '../../utils/usePageCorrection'
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
  usePageCorrection(
    params.page ?? 1,
    params.page_size ?? 20,
    query.isSuccess ? query.data.total : undefined,
  )
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
        <Button loading={query.isFetching} onClick={() => void query.refetch()}>
          刷新借阅
        </Button>
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
      {query.isError && (
        <RequestError
          error={query.error}
          retry={() => void query.refetch()}
          loading={query.isFetching}
        />
      )}
      {query.isPending && <span role="status">正在加载借阅记录…</span>}
      <Table<Loan>
        rowKey="id"
        dataSource={query.isError ? [] : query.data?.items}
        loading={query.isFetching}
        scroll={{ x: 1100 }}
        locale={{
          emptyText: query.isError
            ? '借阅记录加载失败'
            : query.isPending
              ? ' '
              : '暂无借阅记录',
        }}
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
        pagination={{
          current: params.page,
          pageSize: params.page_size,
          total: query.data?.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) =>
            setSearch(
              updateSearchParams(search, {
                page: pageSize !== params.page_size ? 1 : page,
                page_size: pageSize,
              }),
            ),
        }}
      />
    </div>
  )
}
