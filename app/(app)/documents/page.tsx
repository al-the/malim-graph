import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { DocumentLibrary } from './DocumentLibrary'

export default async function DocumentsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Document Library" breadcrumb={['MalimDB', 'Layer 0']} />
      <div className="flex-1 p-6 overflow-y-auto">
        <DocumentLibrary role={session.user.role} />
      </div>
    </div>
  )
}
