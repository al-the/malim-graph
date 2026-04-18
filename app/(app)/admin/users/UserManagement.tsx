'use client'

import { useEffect, useState, useCallback } from 'react'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import toast from 'react-hot-toast'
import type { User } from '@/lib/types'

interface UserRow extends Omit<User, 'password'> { password?: string }

const emptyForm: Partial<UserRow> = {
  name: '', email: '', password: '', role: 'porter', porter_id: '', status: 'active'
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function UserManagement({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<UserRow> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(data.users || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    if (!editing) return
    if (isNew && (!editing.name || !editing.email || !editing.password || !editing.role)) {
      toast.error('All required fields must be filled.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(isNew ? '/api/users' : `/api/users/${editing.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Error')
      }
      toast.success(isNew ? 'User created.' : 'User updated.')
      setEditing(null)
      load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save user.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSuspend(user: UserRow) {
    const newStatus = user.status === 'active' ? 'suspended' : 'active'
    if (newStatus === 'suspended' && !confirm(`Suspend ${user.name}?`)) return
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success(newStatus === 'suspended' ? 'User suspended.' : 'User reactivated.')
      load()
    } catch {
      toast.error('Failed.')
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 h-full">
        <div className="flex justify-end">
          <Button onClick={() => { setEditing({ ...emptyForm }); setIsNew(true); setShowPass(false) }}>
            Create User
          </Button>
        </div>

        <div className="bg-bg-surface border border-border rounded-lg shadow-card overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Porter ID</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonTable rows={6} cols={7} />
                ) : users.length === 0 ? (
                  <EmptyState message="No users found" />
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td className="font-medium">{u.name}</td>
                      <td className="text-text-secondary">{u.email}</td>
                      <td><Badge variant={u.role as 'admin' | 'supervisor' | 'porter'} /></td>
                      <td className="mono text-text-secondary">{u.porter_id || '—'}</td>
                      <td><Badge variant={u.status as 'active' | 'suspended'} /></td>
                      <td className="mono text-text-secondary">{u.last_login?.slice(0, 10) || '—'}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditing({ ...u }); setIsNew(false) }}
                            className="text-2xs text-accent hover:underline">Edit</button>
                          {u.id !== currentUserId && (
                            <button onClick={() => handleSuspend(u)}
                              className={`text-2xs hover:underline ${u.status === 'active' ? 'text-warning' : 'text-success'}`}>
                              {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={isNew ? 'Create User' : 'Edit User'} width={480}>
        {editing && (
          <div className="p-6 flex flex-col gap-4">
            <Input label="Full Name" required value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input label="Email" type="email" required value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />

            {isNew && (
              <div className="flex flex-col gap-1">
                <Input
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={editing.password || ''}
                  onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowPass(!showPass)}>
                    {showPass ? 'Hide' : 'Show'} password
                  </Button>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setEditing({ ...editing, password: generatePassword() })}>
                    Generate strong password
                  </Button>
                </div>
              </div>
            )}

            <Select label="Role" required value={editing.role || 'porter'} onChange={(e) => setEditing({ ...editing, role: e.target.value as User['role'] })}
              options={[{ value: 'porter', label: 'Porter' }, { value: 'supervisor', label: 'Supervisor' }, { value: 'admin', label: 'Admin' }]} />

            {editing.role === 'porter' && (
              <Input label="Porter ID" value={editing.porter_id || ''} onChange={(e) => setEditing({ ...editing, porter_id: e.target.value })}
                helper="Format: P followed by 4 digits. E.g. P0042" placeholder="P0042" />
            )}

            {!isNew && (
              <div className="flex items-center gap-3">
                <label className="text-2xs font-medium text-text-primary">Status</label>
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, status: editing.status === 'active' ? 'suspended' : 'active' })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${editing.status === 'active' ? 'bg-success' : 'bg-border'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${editing.status === 'active' ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                <span className="text-2xs text-text-secondary">{editing.status === 'active' ? 'Active' : 'Suspended'}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button loading={saving} onClick={handleSave}>Save User</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
