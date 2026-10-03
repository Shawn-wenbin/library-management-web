import { PageHeader } from '../../components/PageHeader'
import { Profile } from '../../features/users/Profile'

export function ProfilePage() {
  return (
    <>
      <PageHeader title="个人信息" />
      <Profile />
    </>
  )
}
