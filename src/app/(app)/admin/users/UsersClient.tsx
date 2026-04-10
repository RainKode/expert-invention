'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ROLE_LABELS, ROLE_OPTIONS } from '@/lib/permissions'
import { type Role, type UserStatus } from '@/types'
import Link from 'next/link'

// Minimal type for display
interface UserRow {
  id: string
  name: string
  email: string
  role: Role
  teams: { id: string; name: string } | null
  manager: { id: string; name: string } | null
  timezone: string
  status: UserStatus
  invite_accepted: boolean
}

interface Team {
  id: string
  name: string
  department_id: string
  departments: { name: string }[] | null
}

interface Manager {
  id: string
  name: string
}

// ─── Form Schema ──────────────────────────────────────────────────────────────

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  role: z.enum(['employee', 'senior_employee', 'assistant_manager', 'manager', 'senior_manager', 'admin']),
  team_id: z.string().optional().nullable(),
  manager_id: z.string().optional().nullable(),
  timezone: z.string().min(1),
  available_hours: z.number().min(1).max(24),
  billable_permission: z.enum(['billable', 'non_billable', 'both']),
  work_week: z.array(z.number()),
})

type UserFormData = z.infer<typeof userSchema>

const TIMEZONES = [
  'UTC', 'Asia/Dhaka', 'Asia/Kolkata', 'Europe/London', 'Europe/Paris',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Asia/Dubai',
  'Asia/Singapore', 'Australia/Sydney', 'Pacific/Auckland',
]

// ─── User Form Modal ──────────────────────────────────────────────────────────

function UserFormModal({
  open, onClose, onSaved, editUser, teams, managers,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editUser: UserRow | null
  teams: Team[]
  managers: Manager[]
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<UserFormData>({
    // zodResolver type incompatibility between Zod v4 and @hookform/resolvers — cast required
    resolver: zodResolver(userSchema) as any,
    defaultValues: { role: 'employee', work_week: [1,2,3,4,5], timezone: 'Asia/Dhaka', available_hours: 8, billable_permission: 'both' },
  })

  const workWeek = watch('work_week')

  useEffect(() => {
    if (editUser) {
      // Populate form for edit — fetch full details not available on row
      reset({
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
        team_id: editUser.teams?.id ?? null,
        manager_id: editUser.manager?.id ?? null,
        timezone: editUser.timezone,
        available_hours: 8,
        billable_permission: 'both',
        work_week: [1, 2, 3, 4, 5],
      })
    } else {
      reset({ role: 'employee', work_week: [1,2,3,4,5], timezone: 'Asia/Dhaka', available_hours: 8, billable_permission: 'both' })
    }
    setError(null)
  }, [editUser, open, reset])

  function toggleDay(day: number) {
    const current = workWeek ?? []
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
    setValue('work_week', next.sort((a, b) => a - b))
  }

  async function onSubmit(data: UserFormData) {
    setSaving(true)
    setError(null)
    try {
      const url = editUser ? `/api/admin/users/${editUser.id}` : '/api/admin/users'
      const method = editUser ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to save user'); return }
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface-container-lowest rounded-2xl shadow-ambient p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold tracking-tight text-on-surface">
            {editUser ? 'Edit User' : 'Add New User'}
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Full Name</label>
              <input {...register('name')} placeholder="Alex Johnson" className="input-field" />
              {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Work Email</label>
              <input {...register('email')} type="email" placeholder="alex@company.com" className="input-field" disabled={!!editUser} />
              {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
            </div>
          </div>

          {/* Role + Team */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Role</label>
              <select {...register('role')} className="input-field">
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Team</label>
              <select {...register('team_id')} className="input-field">
                <option value="">No team assigned</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}{t.departments?.[0] ? ` — ${t.departments[0].name}` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Manager */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Reporting Manager</label>
            <select {...register('manager_id')} className="input-field">
              <option value="">No manager assigned</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Work Week */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Work Week</label>
            <div className="flex gap-2">
              {DAYS.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    workWeek?.includes(index)
                      ? 'text-white shadow-ambient-sm'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                  style={workWeek?.includes(index) ? { background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' } : {}}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Timezone + Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Timezone</label>
              <select {...register('timezone')} className="input-field">
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Available Hours/Day</label>
              <input {...register('available_hours', { valueAsNumber: true })} type="number" min={1} max={24} className="input-field" />
            </div>
          </div>

          {/* Billable permissions */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Billable Permission</label>
            <select {...register('billable_permission')} className="input-field">
              <option value="both">Billable & Non-billable</option>
              <option value="billable">Billable only</option>
              <option value="non_billable">Non-billable only</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-full text-white font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
            >
              {saving && <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>}
              {editUser ? 'Save Changes' : 'Create & Send Invite'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors font-semibold">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

const ROLE_BADGE_COLORS: Record<Role, string> = {
  admin: 'bg-primary-container/20 text-primary',
  senior_manager: 'bg-secondary-container text-secondary',
  manager: 'bg-tertiary-fixed text-tertiary-container',
  assistant_manager: 'bg-surface-container-high text-on-surface-variant',
  senior_employee: 'bg-surface-container text-on-surface-variant',
  employee: 'bg-surface-container text-outline',
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UsersClient({ teams, managers }: { teams: Team[]; managers: Manager[] }) {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all')
  const [roleFilter, setRoleFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (roleFilter) params.set('role', roleFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    const res = await fetch(`/api/admin/users?${params}`)
    const json = await res.json()
    setUsers(json.users ?? [])
    setLoading(false)
  }, [search, roleFilter, statusFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleDeactivate(user: UserRow) {
    if (!confirm(`${user.status === 'active' ? 'Deactivate' : 'Reactivate'} ${user.name}?`)) return
    setActionLoading(user.id)
    const method = user.status === 'active' ? 'DELETE' : 'DELETE'
    const url = user.status === 'active'
      ? `/api/admin/users/${user.id}`
      : `/api/admin/users/${user.id}?reactivate=true`
    await fetch(url, { method })
    await fetchUsers()
    setActionLoading(null)
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Users</h1>
          <p className="text-on-surface-variant text-lg">Manage accounts and platform permissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users/import"
            className="px-6 py-3 rounded-full text-on-surface-variant font-semibold hover:bg-surface-container-high transition-all"
          >
            Import CSV
          </Link>
          <button
            onClick={() => { setEditUser(null); setModalOpen(true) }}
            className="px-8 py-3 rounded-full text-white font-bold shadow-ambient hover:opacity-90 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
          >
            Add User
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[280px] relative">
            <span className="absolute inset-y-0 left-4 flex items-center text-outline">
              <span className="material-symbols-outlined text-xl">search</span>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name or email..."
              className="w-full bg-surface-container-high border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm"
            />
          </div>

          {/* Status toggle */}
          <div className="flex p-1.5 bg-surface-container-high rounded-full">
            {(['all', 'active', 'deactivated'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                  statusFilter === s
                    ? 'bg-surface-container-lowest shadow-ambient-sm text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-5 py-3 bg-surface-container-lowest border-none rounded-full text-sm font-semibold text-on-surface-variant shadow-ambient-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* User table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined text-4xl text-outline animate-spin">progress_activity</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-outline block mb-4">person_off</span>
            <p className="text-on-surface-variant font-medium">No users found.</p>
            <p className="text-outline text-sm mt-1">
              {search || roleFilter || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first team member to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-container-high">
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Employee</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Role</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant hidden lg:table-cell">Team</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant hidden xl:table-cell">Timezone</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Status</th>
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y-0">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-container/30 flex items-center justify-center shrink-0">
                          <span className="text-primary text-sm font-bold">{u.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface">{u.name}</p>
                          <p className="text-xs text-outline">{u.email}</p>
                        </div>
                        {!u.invite_accepted && u.status === 'active' && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary-fixed text-tertiary-container uppercase tracking-wide">
                            Pending invite
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`badge ${ROLE_BADGE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell text-on-surface-variant">
                      {u.teams?.name ?? <span className="text-outline">—</span>}
                    </td>
                    <td className="px-4 py-4 hidden xl:table-cell text-on-surface-variant text-xs">
                      {u.timezone}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`badge ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-surface-container text-outline'}`}>
                        {u.status === 'active' ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditUser(u); setModalOpen(true) }}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all rounded-xl"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeactivate(u)}
                          disabled={actionLoading === u.id}
                          className={`p-2 hover:bg-surface-container transition-all rounded-xl ${
                            u.status === 'active' ? 'text-on-surface-variant hover:text-error' : 'text-on-surface-variant hover:text-primary'
                          }`}
                          title={u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                        >
                          <span className="material-symbols-outlined text-xl">
                            {u.status === 'active' ? 'person_remove' : 'person_add'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchUsers}
        editUser={editUser}
        teams={teams}
        managers={managers}
      />
    </div>
  )
}
