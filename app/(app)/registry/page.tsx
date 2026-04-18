import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { IndicatorRegistry } from './IndicatorRegistry'

export default async function RegistryPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Indicator Registry" breadcrumb={['MalimDB', 'Registry']} />
      <div className="flex-1 p-6 overflow-hidden">
        <IndicatorRegistry />
      </div>
    </div>
  )
}
