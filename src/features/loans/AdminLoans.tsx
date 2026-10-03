import {
  Alert,
  Button,
  Checkbox,
  Form,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Tag,
} from 'antd'
import { useSearchParams } from 'react-router'
import { ManagementTable } from '../../components/ManagementTable'
import { RequestError } from '../../components/RequestError'
import { formatDateTime } from '../../utils/formatDate'
import { positiveIdRules } from '../../utils/formRules'
import {
  paginationParams,
  positiveInteger,
  updateSearchParams,
} from '../../utils/searchParams'
import { useReturnLoan } from './hooks'
import { useAllLoans } from './adminHooks'
import type { Loan, LoanParams } from './adminTypes'

type Filters = LoanParams & { overdue?: boolean }
export function AdminLoans() {
  const [search, setSearch] = useSearchParams()
  const overdue = search.get('overdue') === 'true'
  const selectedStatus = search.get('status')
  const params: LoanParams = {
    ...paginationParams(search),
    user_id: positiveInteger(search.get('user_id')),
    book_id: positiveInteger(search.get('book_id')),
    status:
      !overdue &&
      (selectedStatus === 'BORROWED' || selectedStatus === 'RETURNED')
        ? selectedStatus
        : undefined,
  }
  const query = useAllLoans(params, overdue)
  const mutation = useReturnLoan()
  return (
    <div className="content-stack">
      <Form<Filters>
        key={search.toString()}
        layout="vertical"
        initialValues={{ ...params, overdue }}
        onFinish={(values) =>
          setSearch(
            updateSearchParams(search, {
              ...values,
              status: values.overdue ? undefined : values.status,
              page: 1,
            }),
          )
        }
      >
        <div className="book-filters">
          <Form.Item name="user_id" label="用户编号" rules={positiveIdRules}>
            <InputNumber className="full-width" />
          </Form.Item>
          <Form.Item name="book_id" label="图书编号" rules={positiveIdRules}>
            <InputNumber className="full-width" />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(before: Filters, after: Filters) =>
              before.overdue !== after.overdue
            }
          >
            {({ getFieldValue }) => (
              <Form.Item name="status" label="借阅状态">
                <Select
                  disabled={getFieldValue('overdue') === true}
                  allowClear
                  placeholder="全部状态"
                  options={[
                    { value: 'BORROWED', label: '借阅中' },
                    { value: 'RETURNED', label: '已归还' },
                  ]}
                />
              </Form.Item>
            )}
          </Form.Item>
        </div>
        <Space wrap>
          <Form.Item name="overdue" valuePropName="checked" noStyle>
            <Checkbox>仅看逾期</Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit">
            查询
          </Button>
          <Button onClick={() => setSearch({})}>重置</Button>
        </Space>
      </Form>
      {mutation.isSuccess && (
        <Alert type="success" showIcon message="归还成功" />
      )}
      {mutation.error && <RequestError error={mutation.error} />}
      <ManagementTable<Loan>
        query={query}
        label="借阅记录"
        columns={[
          { title: '借阅编号', dataIndex: 'id' },
          { title: '用户编号', dataIndex: 'user_id' },
          { title: '图书编号', dataIndex: 'book_id' },
          { title: '馆藏编号', dataIndex: 'book_copy_id' },
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
                <Tag>{loan.status === 'BORROWED' ? '借阅中' : '已归还'}</Tag>
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
                  description={`用户 #${loan.user_id}，借阅 #${loan.id}`}
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
