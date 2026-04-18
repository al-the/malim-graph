import { auth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { PorterDashboard } from './PorterDashboard'
import { SupervisorDashboard } from './SupervisorDashboard'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Dashboard"
        breadcrumb={['Malim KG Portal']}
      />
      <div className="flex-1 p-6 overflow-y-auto">
        {session.user.role === 'porter' ? (
          <PorterDashboard userId={session.user.id} />
        ) : (
          <SupervisorDashboard role={session.user.role} />
        )}
      </div>
    </div>
  )
}
