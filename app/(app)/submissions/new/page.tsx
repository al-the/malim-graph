import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { SubmissionForm } from '@/components/forms/SubmissionForm'

export default async function NewSubmissionPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'porter') redirect('/dashboard')

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Submit Document"
        breadcrumb={['Malim KG Portal', 'My Submissions']}
      />
      <div className="flex-1 p-6 overflow-y-auto">
        <SubmissionForm />
      </div>
    </div>
  )
}
