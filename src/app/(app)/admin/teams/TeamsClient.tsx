'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import ConfirmDialog from '@/components/shell/ConfirmDialog'

interface Manager { id: string; name: string; role: string }
interface TeamRow {
  id: string; name: string; manager_id: string | null; planning_mode: string
  submission_deadline_day: number | null; submission_deadline_time: string | null
  check_in_mandatory: boolean; eod_mandatory: boolean
  manager: { id: string; name: string } | null
  member_count: { count: number }[]
}
interface DepartmentRow {
  id: string; name: string; senior_manager_id: string | null
  senior_manager: { id: string; name: string } | null
  teams: TeamRow[]
}

const DAYS_LABEL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ─── Department Modal ─────────────────────────────────────────────────────────

const deptSchema = z.object({
  name: z.string().min(1, 'Name required'),
  senior_manager_id: z.string().optional().nullable(),
})

function DepartmentModal({
  open, onClose, onSaved, editDept, managers,
}: {
  open: boolean; onClose: () => void; onSaved: () => void
  editDept: DepartmentRow | null; managers: Manager[]
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: '', senior_manager_id: '' },
  })

  useEffect(() => {
    reset({ name: editDept?.name ?? '', senior_manager_id: editDept?.senior_manager_id ?? '' })
    setError(null)
  }, [editDept, open, reset])

  async function onSubmit(data: { name: string; senior_manager_id?: string | null }) {
    setSaving(true); setError(null)
    const url = editDept ? `/api/admin/teams/${editDept.id}` : '/api/admin/teams'
    const method = editDept ? 'PATCH' : 'POST'
    const body = editDept ? { type: 'department', ...data } : { type: 'department', ...data }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error); return }
    onSaved(); onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-[0px_4px_24px_rgba(77,85,106,0.08)] p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-on-surface">{editDept ? 'Edit Department' : 'New Department'}</h2>
          <button onClick={onClose}><span className="material-symbols-outlined text-on-surface-variant">close</span></button>
        </div>
        {error && <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Department Name</label>
            <input {...register('name')} placeholder="e.g. Product & Engineering" className="input-field" />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Senior Manager</label>
            <select {...register('senior_manager_id')} className="input-field">
              <option value="">No senior manager assigned</option>
              {managers.filter(m => ['senior_manager', 'admin'].includes(m.role)).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-full bg-integrity text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>}
              {editDept ? 'Save Changes' : 'Create Department'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-full text-on-surface-variant hover:bg-surface-container-high font-semibold">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Team Modal ───────────────────────────────────────────────────────────────

const teamSchema = z.object({
  name: z.string().min(1, 'Name required'),
  department_id: z.string().min(1, 'Department required'),
  manager_id: z.string().optional().nullable(),
  planning_mode: z.enum(['locked', 'fluid']).default('fluid'),
  submission_deadline_day: z.coerce.number().min(0).max(6).optional().nullable(),
  submission_deadline_time: z.string().optional().nullable(),
  check_in_mandatory: z.boolean().default(false),
  eod_mandatory: z.boolean().default(false),
})

function TeamModal({
  open, onClose, onSaved, editTeam, departments, managers,
}: {
  open: boolean; onClose: () => void; onSaved: () => void
  editTeam: TeamRow & { department_id?: string } | null
  departments: DepartmentRow[]; managers: Manager[]
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(teamSchema),
    defaultValues: { planning_mode: 'fluid', check_in_mandatory: false, eod_mandatory: false },
  })

  useEffect(() => {
    if (editTeam) {
      reset({
        name: editTeam.name,
        department_id: editTeam.department_id ?? '',
        manager_id: editTeam.manager_id ?? '',
        planning_mode: editTeam.planning_mode as 'locked' | 'fluid',
        submission_deadline_day: editTeam.submission_deadline_day ?? undefined,
        submission_deadline_time: editTeam.submission_deadline_time ?? '',
        check_in_mandatory: editTeam.check_in_mandatory,
        eod_mandatory: editTeam.eod_mandatory,
      })
    } else {
      reset({ planning_mode: 'fluid', check_in_mandatory: false, eod_mandatory: false })
    }
    setError(null)
  }, [editTeam, open, reset])

  async function onSubmit(data: any) {
    setSaving(true); setError(null)
    const url = editTeam ? `/api/admin/teams/${editTeam.id}` : '/api/admin/teams'
    const method = editTeam ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'team', ...data }) })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error); return }
    onSaved(); onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-[0px_4px_24px_rgba(77,85,106,0.08)] p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-on-surface">{editTeam ? 'Edit Team' : 'New Team'}</h2>
          <button onClick={onClose}><span className="material-symbols-outlined text-on-surface-variant">close</span></button>
        </div>
        {error && <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Team Name</label>
              <input {...register('name')} placeholder="e.g. Frontend" className="input-field" />
              {errors.name && <p className="text-xs text-error mt-1">{String(errors.name.message)}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Department</label>
              <select {...register('department_id')} className="input-field">
                <option value="">Select department…</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.department_id && <p className="text-xs text-error mt-1">{String(errors.department_id.message)}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Team Manager</label>
            <select {...register('manager_id')} className="input-field">
              <option value="">No manager assigned</option>
              {managers.filter(m => ['manager', 'senior_manager', 'admin'].includes(m.role)).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Planning Mode</label>
            <div className="flex gap-3">
              {(['fluid', 'locked'] as const).map(mode => (
                <label key={mode} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={mode} {...register('planning_mode')} className="accent-primary" />
                  <span className="text-sm font-medium capitalize">{mode}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Plan Deadline Day</label>
              <select {...register('submission_deadline_day')} className="input-field">
                <option value="">No deadline</option>
                {DAYS_LABEL.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Deadline Time (24h)</label>
              <input {...register('submission_deadline_time')} type="time" className="input-field" />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('check_in_mandatory')} className="accent-primary w-4 h-4" />
              <span className="text-sm font-medium">Mandatory daily check-in</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('eod_mandatory')} className="accent-primary w-4 h-4" />
              <span className="text-sm font-medium">Mandatory EOD wrap-up</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-full bg-integrity text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>}
              {editTeam ? 'Save Changes' : 'Create Team'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-full text-on-surface-variant hover:bg-surface-container-high font-semibold">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TeamsClient({ managers }: { managers: Manager[] }) {
  const [departments, setDepartments] = useState<DepartmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [deptModalOpen, setDeptModalOpen] = useState(false)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [editDept, setEditDept] = useState<DepartmentRow | null>(null)
  const [editTeam, setEditTeam] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'department' | 'team'; message: string } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/teams')
    const json = await res.json()
    setDepartments(json.departments ?? [])
    // Expand all by default
    if (json.departments) setExpanded(new Set(json.departments.map((d: DepartmentRow) => d.id)))
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function deleteDept(id: string) {
    setDeleteTarget({ id, type: 'department', message: 'Delete this department? All teams inside it will also be deleted.' })
  }

  async function deleteTeam(id: string) {
    setDeleteTarget({ id, type: 'team', message: 'Delete this team?' })
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    await fetch(`/api/admin/teams/${deleteTarget.id}?type=${deleteTarget.type}`, { method: 'DELETE' })
    setDeleteTarget(null)
    fetchData()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Teams & Departments</h1>
          <p className="text-on-surface-variant max-w-xl">Configure your organisational structure.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setEditDept(null); setDeptModalOpen(true) }}
            className="px-6 py-3 rounded-full bg-tertiary-fixed text-tertiary-container text-sm font-semibold hover:bg-tertiary-fixed-dim transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add_business</span>
            Add Department
          </button>
          <button
            onClick={() => { setEditTeam(null); setTeamModalOpen(true) }}
            className="px-6 py-3 rounded-full bg-integrity text-white text-sm font-semibold hover:opacity-90 shadow-[0px_4px_24px_rgba(77,85,106,0.08)] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">group_add</span>
            Add Team
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-4xl text-outline animate-spin">progress_activity</span>
        </div>
      ) : departments.length === 0 ? (
        <div className="card text-center py-20">
          <span className="material-symbols-outlined text-5xl text-outline block mb-4">corporate_fare</span>
          <p className="text-on-surface-variant font-medium text-lg">No departments yet</p>
          <p className="text-outline text-sm mt-2">Start by creating your organisational structure.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {departments.map(dept => (
            <div key={dept.id} className="bg-white rounded-2xl shadow-[0px_4px_24px_rgba(77,85,106,0.08)] overflow-hidden">
              {/* Department row */}
              <div className="flex items-center gap-4 px-6 py-5">
                <button
                  onClick={() => toggleExpand(dept.id)}
                  className="text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-xl transition-transform" style={{ transform: expanded.has(dept.id) ? 'rotate(90deg)' : '' }}>
                    chevron_right
                  </span>
                </button>
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">corporate_fare</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-on-surface">{dept.name}</p>
                  <p className="text-xs text-outline">
                    {dept.senior_manager?.name ? `Senior Manager: ${dept.senior_manager.name}` : 'No senior manager'} · {dept.teams.length} team{dept.teams.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditDept(dept); setDeptModalOpen(true) }}
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-xl transition-all"
                  >
                    <span className="material-symbols-outlined text-xl">edit</span>
                  </button>
                  <button
                    onClick={() => deleteDept(dept.id)}
                    className="p-2 text-on-surface-variant hover:text-error hover:bg-surface-container-high rounded-xl transition-all"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </div>

              {/* Teams nested */}
              {expanded.has(dept.id) && dept.teams.length > 0 && (
                <div className="border-t border-surface-container-high">
                  {dept.teams.map(team => (
                    <div key={team.id} className="flex items-center gap-4 px-6 py-4 pl-16 hover:bg-surface-container transition-colors group">
                      <div className="w-8 h-8 rounded-xl bg-secondary-container/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary text-sm">groups</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-on-surface text-sm">{team.name}</p>
                        <p className="text-xs text-outline">
                          {team.manager?.name ? `Manager: ${team.manager.name}` : 'No manager'} ·{' '}
                          {team.member_count?.[0]?.count ?? 0} member{(team.member_count?.[0]?.count ?? 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className={`badge text-xs ${team.planning_mode === 'locked' ? 'bg-primary-container/20 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                        {team.planning_mode}
                      </span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditTeam({ ...team, department_id: dept.id }); setTeamModalOpen(true) }}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-xl"
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                        <button
                          onClick={() => deleteTeam(team.id)}
                          className="p-2 text-on-surface-variant hover:text-error hover:bg-surface-container-high rounded-xl"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {expanded.has(dept.id) && dept.teams.length === 0 && (
                <div className="border-t border-surface-container-high px-16 py-6 text-sm text-outline">
                  No teams yet —{' '}
                  <button
                    onClick={() => { setEditTeam({ department_id: dept.id }); setTeamModalOpen(true) }}
                    className="text-primary font-semibold hover:underline"
                  >
                    add one
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <DepartmentModal open={deptModalOpen} onClose={() => setDeptModalOpen(false)} onSaved={fetchData} editDept={editDept} managers={managers} />
      <TeamModal open={teamModalOpen} onClose={() => setTeamModalOpen(false)} onSaved={fetchData} editTeam={editTeam} departments={departments} managers={managers} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Confirm Delete"
        message={deleteTarget?.message ?? ''}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
