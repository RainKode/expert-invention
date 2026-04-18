'use client'

import { useState } from 'react'
import { CustomFieldDefinition, CustomFieldType, CustomFieldScopeType } from '@/types'

interface Props {
  initialFields: CustomFieldDefinition[]
  teamId: string | null
}

const TYPE_ICONS: Record<CustomFieldType, string> = {
  text: 'text_fields',
  number: 'tag',
  date: 'calendar_today',
  dropdown: 'arrow_drop_down_circle',
  checkbox: 'check_box',
}

const TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  dropdown: 'Dropdown',
  checkbox: 'Checkbox',
}

const SCOPE_COLORS: Record<CustomFieldScopeType, string> = {
  global: 'bg-primary-container/20 text-primary',
  team: 'bg-secondary-container text-secondary',
  project: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
}

export default function CustomFieldsClient({ initialFields, teamId }: Props) {
  const [fields, setFields] = useState<CustomFieldDefinition[]>(initialFields)
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'archived'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null)
  const [archiving, setArchiving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = fields.filter(f => {
    if (activeTab === 'active') return f.status === 'active'
    if (activeTab === 'archived') return f.status === 'archived'
    return true
  })

  async function handleArchive(id: string) {
    setArchiving(id)
    const res = await fetch(`/api/custom-fields/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setFields(prev => prev.map(f => f.id === id ? { ...f, status: 'archived' } : f))
    } else {
      const json = await res.json()
      setError(json.error ?? 'Failed to archive')
    }
    setArchiving(null)
  }

  function onFieldCreated(field: CustomFieldDefinition) {
    setFields(prev => [field, ...prev])
    setShowAddModal(false)
  }

  function onFieldUpdated(field: CustomFieldDefinition) {
    setFields(prev => prev.map(f => f.id === field.id ? field : f))
    setEditingField(null)
  }

  const TABS: Array<{ key: typeof activeTab; label: string }> = [
    { key: 'all', label: 'All Fields' },
    { key: 'active', label: 'Active' },
    { key: 'archived', label: 'Archived' },
  ]

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-[#434655] mb-1">Settings</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#191c1e]">Custom Fields</h1>
          <p className="text-[#434655] mt-2">Define dynamic metadata fields for tasks across your organisation.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-integrity text-white font-medium text-sm shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Field
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-xl text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1.5 bg-surface-container-high rounded-full w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-white shadow-[0px_2px_8px_rgba(77,85,106,0.06)] text-on-surface font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Field list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-5xl text-[#c6c6cd] mb-4">tune</span>
          <p className="text-[#434655] font-medium">No custom fields yet</p>
          <p className="text-sm text-[#434655]/70 mt-1">Add a field to start capturing custom metadata on tasks.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header row */}
          <div className="grid grid-cols-12 px-6 mb-1">
            <span className="col-span-5 text-xs font-medium text-[#434655] uppercase tracking-wide">Field</span>
            <span className="col-span-2 text-xs font-medium text-[#434655] uppercase tracking-wide">Scope</span>
            <span className="col-span-2 text-xs font-medium text-[#434655] uppercase tracking-wide">Type</span>
            <span className="col-span-2 text-xs font-medium text-[#434655] uppercase tracking-wide">Status</span>
            <span className="col-span-1" />
          </div>

          {filtered.map(field => (
            <div key={field.id} className="grid grid-cols-12 items-center bg-white p-6 rounded-xl shadow-[0_4px_24px_rgba(77,85,106,0.06)] hover:shadow-[0_8px_32px_rgba(77,85,106,0.10)] transition-shadow group">
              {/* Field name + type icon */}
              <div className="col-span-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#f7f9fb] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[22px] text-integrity">
                    {TYPE_ICONS[field.field_type]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-[#191c1e]">{field.name}</p>
                  <p className="text-xs text-[#434655] mt-0.5">{TYPE_LABELS[field.field_type]}</p>
                </div>
              </div>

              {/* Scope */}
              <div className="col-span-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${SCOPE_COLORS[field.scope_type]}`}>
                  {field.scope_type}
                </span>
              </div>

              {/* Type label */}
              <div className="col-span-2 text-sm text-[#434655]">{TYPE_LABELS[field.field_type]}</div>

              {/* Status */}
              <div className="col-span-2">
                {field.status === 'active' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary-container/20 text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-surface-container text-outline">
                    <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                    Archived
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {field.status === 'active' && (
                  <>
                    <button
                      onClick={() => setEditingField(field)}
                      className="p-2 rounded-lg hover:bg-[#f7f9fb] text-[#434655] hover:text-[#191c1e] transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleArchive(field.id)}
                      disabled={archiving === field.id}
                      className="p-2 rounded-lg hover:bg-[#f7f9fb] text-[#434655] hover:text-[#191c1e] transition-colors"
                      title="Archive"
                    >
                      <span className="material-symbols-outlined text-[18px]">archive</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Field Modal */}
      {showAddModal && (
        <AddFieldModal
          teamId={teamId}
          onCreated={onFieldCreated}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Field Modal */}
      {editingField && (
        <EditFieldModal
          field={editingField}
          onUpdated={onFieldUpdated}
          onClose={() => setEditingField(null)}
        />
      )}
    </div>
  )
}

function AddFieldModal({ teamId, onCreated, onClose }: {
  teamId: string | null
  onCreated: (f: CustomFieldDefinition) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CustomFieldType>('text')
  const [scope, setScope] = useState<CustomFieldScopeType>('global')
  const [options, setOptions] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const TYPES: CustomFieldType[] = ['text', 'number', 'date', 'dropdown', 'checkbox']
  const SCOPES: CustomFieldScopeType[] = ['global', 'team', 'project']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const body: Record<string, unknown> = { name, field_type: type, scope_type: scope }
    if (type === 'dropdown') {
      const filtered = options.filter(o => o.trim())
      if (!filtered.length) { setError('Add at least one option'); setLoading(false); return }
      body.options = filtered
    }
    if (scope === 'team' && teamId) body.scope_id = teamId

    const res = await fetch('/api/custom-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Failed to create'); setLoading(false); return }
    onCreated(json.field)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-[20px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-[0px_4px_24px_rgba(77,85,106,0.08)] w-full max-w-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-on-surface">Add Custom Field</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
          </button>
        </div>
        {error && <p className="mb-4 text-sm text-error">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#434655] mb-1.5">Field Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. Estimated Hours"
              className="w-full px-4 py-2.5 rounded-full bg-[#f7f9fb] text-[#191c1e] text-sm outline-none focus:ring-2 focus:ring-integrity/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#434655] mb-1.5">Field Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map(t => (
                <button
                  key={t} type="button"
                  onClick={() => setType(t)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    type === t ? 'bg-integrity text-white' : 'bg-[#f7f9fb] text-[#434655] hover:bg-[#eef0f4]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{TYPE_ICONS[t]}</span>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#434655] mb-1.5">Scope</label>
            <div className="flex gap-2">
              {SCOPES.map(s => (
                <button
                  key={s} type="button"
                  onClick={() => setScope(s)}
                  className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                    scope === s ? 'bg-integrity text-white' : 'bg-[#f7f9fb] text-[#434655] hover:bg-[#eef0f4]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {type === 'dropdown' && (
            <div>
              <label className="block text-sm font-medium text-[#434655] mb-1.5">Options</label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={opt}
                      onChange={e => setOptions(prev => prev.map((o, idx) => idx === i ? e.target.value : o))}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-4 py-2 rounded-full bg-[#f7f9fb] text-sm text-[#191c1e] outline-none focus:ring-2 focus:ring-integrity/30"
                    />
                    {options.length > 1 && (
                      <button type="button" onClick={() => setOptions(prev => prev.filter((_, idx) => idx !== i))} className="text-on-surface-variant hover:text-error">
                        <span className="material-symbols-outlined text-[16px]">remove_circle</span>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setOptions(prev => [...prev, ''])} className="text-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[16px]">add</span> Add option
                </button>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface-variant font-medium text-sm">Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-full bg-integrity text-white font-medium text-sm"
            >
              {loading ? 'Creating…' : 'Create Field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditFieldModal({ field, onUpdated, onClose }: {
  field: CustomFieldDefinition
  onUpdated: (f: CustomFieldDefinition) => void
  onClose: () => void
}) {
  const [name, setName] = useState(field.name)
  const [options, setOptions] = useState<string[]>(field.options ?? [''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const body: Record<string, unknown> = { name }
    if (field.field_type === 'dropdown') {
      const filtered = options.filter(o => o.trim())
      if (!filtered.length) { setError('Add at least one option'); setLoading(false); return }
      body.options = filtered
    }
    const res = await fetch(`/api/custom-fields/${field.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Failed to update'); setLoading(false); return }
    onUpdated(json.field)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-[20px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-[0px_4px_24px_rgba(77,85,106,0.08)] w-full max-w-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-on-surface">Edit Field</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
          </button>
        </div>
        {error && <p className="mb-4 text-sm text-error">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#434655] mb-1.5">Field Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-full bg-[#f7f9fb] text-[#191c1e] text-sm outline-none focus:ring-2 focus:ring-integrity/30"
            />
          </div>
          {field.field_type === 'dropdown' && (
            <div>
              <label className="block text-sm font-medium text-[#434655] mb-1.5">Options</label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={opt}
                      onChange={e => setOptions(prev => prev.map((o, idx) => idx === i ? e.target.value : o))}
                      className="flex-1 px-4 py-2 rounded-full bg-[#f7f9fb] text-sm text-[#191c1e] outline-none focus:ring-2 focus:ring-integrity/30"
                    />
                    {options.length > 1 && (
                      <button type="button" onClick={() => setOptions(prev => prev.filter((_, idx) => idx !== i))} className="text-on-surface-variant hover:text-error">
                        <span className="material-symbols-outlined text-[16px]">remove_circle</span>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setOptions(prev => [...prev, ''])} className="text-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">add</span> Add option
                </button>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface-variant font-medium text-sm">Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-full bg-integrity text-white font-medium text-sm"
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
