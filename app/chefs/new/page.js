import PageShell from '@/app/components/PageShell'
import NewChefForm from './NewChefForm'
import { getSession } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function NewChefPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  return (
    <PageShell active="/chefs">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Add</div>
          <h1 className="page-title" style={{ fontStyle: 'italic' }}>New Chef</h1>
        </div>
      </div>
      <NewChefForm />
    </PageShell>
  )
}
