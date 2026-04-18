import { auth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { SubmissionsTable } from './SubmissionsTable'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function SubmissionsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const isPorter = session.user.role === 'porter'
  const title = isPorter ? 'My Submissions' : 'All Submissions'

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={title}
        breadcrumb={['MalimDB']}
        actions={
          isPorter ? (
            <Link href="/submissions/new">
              <Button>Submit New Entry</Button>
            </Link>
          ) : undefined
        }
      />
      <div className="flex-1 p-6 overflow-hidden">
        <SubmissionsTable role={session.user.role} />
      </div>
    </div>
  )
}
