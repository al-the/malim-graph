import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      <Sidebar role={session.user.role} name={session.user.name} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
        <footer className="flex-shrink-0 text-right px-4 py-1">
          <span className="text-[10px] text-text-disabled">
            &copy; {new Date().getFullYear()} Malim AI Labs Social Enterprise. All right reserved.
          </span>
        </footer>
      </div>
    </div>
  )
}
