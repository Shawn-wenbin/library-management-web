import { Descriptions, Drawer } from 'antd'
import { Loading } from '../../components/Loading'
import { RequestError } from '../../components/RequestError'
import { formatDateTime } from '../../utils/formatDate'
import { useUser } from './adminHooks'

export function UserDetails({
  id,
  onClose,
}: {
  id: number
  onClose: () => void
}) {
  const query = useUser(id)
  const user = query.data
  return (
    <Drawer open title={`用户 #${id}`} onClose={onClose}>
      {query.isPending && <Loading compact label="正在加载用户详情…" />}
      {query.error && (
        <RequestError
          error={query.error}
          retry={() => void query.refetch()}
          loading={query.isFetching}
        />
      )}
      {user && !query.isError && (
        <Descriptions
          column={1}
          items={[
            { key: 'id', label: '编号', children: user.id },
            { key: 'username', label: '用户名', children: user.username },
            { key: 'name', label: '姓名', children: user.full_name || '—' },
            { key: 'email', label: '邮箱', children: user.email },
            {
              key: 'role',
              label: '角色',
              children: user.role === 'ADMIN' ? '管理员' : '读者',
            },
            {
              key: 'status',
              label: '状态',
              children: user.is_active ? '启用' : '禁用',
            },
            {
              key: 'created',
              label: '注册时间',
              children: formatDateTime(user.created_at),
            },
            {
              key: 'updated',
              label: '更新时间',
              children: formatDateTime(user.updated_at),
            },
          ]}
        />
      )}
    </Drawer>
  )
}
