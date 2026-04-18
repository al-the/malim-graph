import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { containers } from '@/lib/cosmos'
import { SubmissionDetail } from '../SubmissionDetail'
import type { Submission } from '@/lib/types'

export default async function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { resources } = await containers
    .submissions()
    .items.query<Submission>({
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: params.id }],
    })
    .fetchAll()

  const sub = resources[0]
  if (!sub) redirect('/submissions')

  if (session.user.role === 'porter' && sub.porter_id !== session.user.id) {
    redirect('/submissions')
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={sub.s1_title_en || 'Submission'}
        breadcrumb={['MalimDB', 'Submissions']}
      />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl">
          <SubmissionDetail submission={sub} />
        </div>
      </div>
    </div>
  )
}
