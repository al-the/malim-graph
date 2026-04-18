import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { UserManagement } from './UserManagement'

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="User Management" breadcrumb={['MalimDB', 'Admin']} />
      <div className="flex-1 p-6 overflow-hidden">
        <UserManagement currentUserId={session.user.id} />
      </div>
    </div>
  )
}
