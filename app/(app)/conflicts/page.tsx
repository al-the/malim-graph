import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { ConflictQueue } from './ConflictQueue'

export default async function ConflictsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Conflict Queue" breadcrumb={['MalimDB', 'Review']} />
      <div className="flex-1 p-6 overflow-hidden">
        <ConflictQueue />
      </div>
    </div>
  )
}
