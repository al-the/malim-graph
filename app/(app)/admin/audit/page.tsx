import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { AuditLogTable } from './AuditLogTable'

export default async function AuditPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Audit Log" breadcrumb={['MalimDB', 'Admin']} />
      <div className="flex-1 p-6 overflow-hidden">
        <AuditLogTable />
      </div>
    </div>
  )
}
