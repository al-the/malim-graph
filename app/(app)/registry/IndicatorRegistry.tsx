'use client'

import { useEffect, useState, useCallback } from 'react'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { TagInput } from '@/components/ui/TagInput'
import toast from 'react-hot-toast'
import type { Indicator } from '@/lib/types'
import { SOURCE_AUTHORITIES, INDICATOR_CATEGORIES } from '@/lib/types'

const SDG_OPTIONS = Array.from({ length: 17 }, (_, i) => `SDG${i + 1}`) as readonly string[]

const FREQ_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
  { value: 'periodic', label: 'Periodic' },
  { value: 'ad_hoc', label: 'Ad hoc' },
]

const emptyForm: Partial<Indicator> = {
  indicator_id: '', canonical_name: '', canonical_name_ms: '', authority: '',
  series_code: '', category: '', unit: '', base_year: '', frequency: 'annual',
  methodology_reference: '', sdg_alignment: [], notes: '',
}

export function IndicatorRegistry() {
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showDeprecated, setShowDeprecated] = useState(false)
  const [editing, setEditing] = useState<Partial<Indicator> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const q = new URLSearchParams()
    if (showDeprecated) q.set('deprecated', 'true')
    if (search) q.set('search', search)
    if (category) q.set('category', category)
    const res = await fetch(`/api/indicators?${q}`)
    const data = await res.json()
    setIndicators(data.indicators || [])
    setLoading(false)
  }, [showDeprecated, search, category])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch(isNew ? '/api/indicators' : `/api/indicators/${editing.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })
      if (!res.ok) throw new Error()
      toast.success(isNew ? 'Indicator created.' : 'Indicator updated.')
      setEditing(null)
      load()
    } catch {
      toast.error('Failed to save indicator.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeprecate(ind: Indicator) {
    const newStatus = ind.status === 'active' ? 'deprecated' : 'active'
    if (newStatus === 'deprecated' && !confirm(`Deprecate "${ind.canonical_name}"?`)) return
    try {
      await fetch(`/api/indicators/${ind.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success(newStatus === 'deprecated' ? 'Indicator deprecated.' : 'Indicator restored.')
      load()
    } catch {
      toast.error('Failed.')
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 h-full">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <input placeholder="Search by name or code…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-8 px-3 rounded border border-border bg-bg-subtle text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 w-60" />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="h-8 px-3 rounded border border-border bg-bg-subtle text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent">
            <option value="">All categories</option>
            {INDICATOR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-2 text-2xs text-text-secondary cursor-pointer">
            <input type="checkbox" checked={showDeprecated} onChange={(e) => setShowDeprecated(e.target.checked)} className="accent-primary" />
            Show deprecated
          </label>
          <div className="ml-auto">
            <Button onClick={() => { setEditing({ ...emptyForm }); setIsNew(true) }}>Add Indicator</Button>
          </div>
        </div>

        <div className="bg-bg-surface border border-border rounded-lg shadow-card overflow-hidden flex-1">
          <div className="overflow-x-auto h-full">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Indicator ID</th>
                  <th>Name</th>
                  <th>Authority</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Frequency</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonTable rows={6} cols={8} />
                ) : indicators.length === 0 ? (
                  <EmptyState message="No indicators found" description="Add your first indicator to the registry." />
                ) : (
                  indicators.map((ind) => (
                    <tr key={ind.id} className={ind.status === 'deprecated' ? 'opacity-50' : ''}>
                      <td className="mono">{ind.indicator_id}</td>
                      <td className={ind.status === 'deprecated' ? 'line-through text-text-disabled' : 'font-medium'}>
                        {ind.canonical_name}
                      </td>
                      <td className="text-text-secondary">{ind.authority}</td>
                      <td className="text-text-secondary">{ind.category}</td>
                      <td className="text-text-secondary">{ind.unit}</td>
                      <td className="text-text-secondary">{ind.frequency}</td>
                      <td><Badge variant={ind.status === 'active' ? 'active' : 'suspended'}>{ind.status === 'active' ? 'Active' : 'Deprecated'}</Badge></td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditing({ ...ind }); setIsNew(false) }}
                            className="text-2xs text-accent hover:underline">Edit</button>
                          <button onClick={() => handleDeprecate(ind)}
                            className={`text-2xs hover:underline ${ind.status === 'active' ? 'text-warning' : 'text-success'}`}>
                            {ind.status === 'active' ? 'Deprecate' : 'Restore'}
                          </button>
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

      {/* Add/Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={isNew ? 'Add Indicator' : 'Edit Indicator'} width={560}>
        {editing && (
          <div className="p-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Indicator ID" required value={editing.indicator_id || ''} onChange={(e) => setEditing({ ...editing, indicator_id: e.target.value })} />
              <Input label="Series Code" value={editing.series_code || ''} onChange={(e) => setEditing({ ...editing, series_code: e.target.value })} />
            </div>
            <Input label="Canonical Name" required value={editing.canonical_name || ''} onChange={(e) => setEditing({ ...editing, canonical_name: e.target.value })} />
            <Input label="Canonical Name (Malay)" value={editing.canonical_name_ms || ''} onChange={(e) => setEditing({ ...editing, canonical_name_ms: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Authority" required value={editing.authority || ''} onChange={(e) => setEditing({ ...editing, authority: e.target.value })}
                placeholder="Select…" options={SOURCE_AUTHORITIES.map((a) => ({ value: a, label: a }))} />
              <Select label="Category" required value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                placeholder="Select…" options={INDICATOR_CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Unit" required value={editing.unit || ''} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} />
              <Input label="Base Year" value={editing.base_year || ''} onChange={(e) => setEditing({ ...editing, base_year: e.target.value })} />
            </div>
            <Select label="Frequency" required value={editing.frequency || ''} onChange={(e) => setEditing({ ...editing, frequency: e.target.value as Indicator['frequency'] })}
              placeholder="Select…" options={FREQ_OPTIONS} />
            <Input label="Methodology Reference" value={editing.methodology_reference || ''} onChange={(e) => setEditing({ ...editing, methodology_reference: e.target.value })} />
            <TagInput label="SDG Alignment" options={SDG_OPTIONS} value={editing.sdg_alignment || []}
              onChange={(v) => setEditing({ ...editing, sdg_alignment: v })} />
            <Textarea label="Notes" rows={3} value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button loading={saving} onClick={handleSave}>Save Indicator</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
