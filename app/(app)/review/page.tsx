import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReviewQueue } from './ReviewQueue'

export default async function ReviewPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role === 'porter') redirect('/dashboard')

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Review Queue" breadcrumb={['MalimDB']} />
      <div className="flex-1 p-6 overflow-hidden">
        <ReviewQueue />
      </div>
    </div>
  )
}
