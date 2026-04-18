'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Department {
  id: string
  name: string
  head_id: string | null
  head_name: string | null
}

interface Team {
  id: string
  name: string
  department_id: string | null
  manager_id: string | null
  manager_name: string | null
}

interface Employee {
  id: string
  name: string
  role: string
  team_id: string | null
  status: string
}

interface AdminSetupClientProps {
  departments: Department[]
  teams: Team[]
  employees: Employee[]
}

const STEPS = ['Departments', 'Teams', 'Employees'] as const

export default function AdminSetupClient({
  departments: initialDepts,
  teams: initialTeams,
  employees: initialEmployees,
}: AdminSetupClientProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [departments, setDepartments] = useState(initialDepts)
  const [teams, setTeams] = useState(initialTeams)
  const [employees, setEmployees] = useState(initialEmployees)

  // Department form
  const [deptName, setDeptName] = useState('')
  const [deptLoading, setDeptLoading] = useState(false)

  // Team form
  const [teamName, setTeamName] = useState('')
  const [teamDeptId, setTeamDeptId] = useState('')
  const [teamLoading, setTeamLoading] = useState(false)

  // Employee form
  const [empName, setEmpName] = useState('')
  const [empEmail, setEmpEmail] = useState('')
  const [empRole, setEmpRole] = useState('employee')
  const [empTeamId, setEmpTeamId] = useState('')
  const [empLoading, setEmpLoading] = useState(false)

  const progress = Math.round(((step + 1) / STEPS.length) * 100)

  async function addDepartment() {
    if (!deptName.trim()) return
    setDeptLoading(true)
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'department', name: deptName.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        const dept = data.department
        setDepartments((prev) => [...prev, { id: dept.id, name: dept.name, head_id: null, head_name: null }])
        setDeptName('')
      }
    } finally {
      setDeptLoading(false)
    }
  }

  async function addTeam() {
    if (!teamName.trim()) return
    setTeamLoading(true)
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'team', name: teamName.trim(), department_id: teamDeptId || undefined }),
      })
      if (res.ok) {
        const data = await res.json()
        const team = data.team
        setTeams((prev) => [...prev, { id: team.id, name: team.name, department_id: team.department_id, manager_id: null, manager_name: null }])
        setTeamName('')
      }
    } finally {
      setTeamLoading(false)
    }
  }

  async function addEmployee() {
    if (!empName.trim() || !empEmail.trim()) return
    setEmpLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: empName.trim(),
          email: empEmail.trim(),
          role: empRole,
          team_id: empTeamId || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setEmployees((prev) => [...prev, {
          id: data.user.id,
          name: data.user.name,
          role: data.user.role,
          team_id: empTeamId || null,
          status: 'active',
        }])
        setEmpName('')
        setEmpEmail('')
        setEmpRole('employee')
        setEmpTeamId('')
      }
    } finally {
      setEmpLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Progress header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-xl shadow-[0px_2px_15px_rgba(77,85,106,0.04)]">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
            >
              <span className="material-symbols-outlined bg-integrity text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
            </div>
            <span className="font-bold text-primary tracking-tight">Sunday</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-on-surface-variant">Setup Progress: {progress}%</span>
            <div className="w-32 h-2 rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-integrity"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32 px-8 max-w-7xl mx-auto">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-6 mb-12">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ring-4 ring-background transition-all ${
                  i === step
                    ? 'text-white shadow-lg bg-integrity'
                    : i < step
                      ? 'bg-primary-container/60 text-white'
                      : 'bg-surface-container-highest text-on-surface-variant'
                }`}
              >
                {i < step ? (
                  <span className="material-symbols-outlined text-lg">check</span>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-sm font-semibold ${i === step ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="w-16 h-[2px] bg-surface-container-high" />}
            </div>
          ))}
        </div>

        {/* Step 0: Departments */}
        {step === 0 && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-5">
              <div className="bg-white rounded-xl p-8 shadow-[0px_24px_48px_rgba(77,85,106,0.06)] flex flex-col gap-6">
                <h3 className="text-lg font-bold text-on-surface">Create Department</h3>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-bold text-on-surface-variant ml-2">Department Name</label>
                  <input
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="w-full bg-surface-container-low border-none rounded-full py-4 px-6 font-medium focus:ring-2 focus:ring-primary/10 text-on-surface"
                    onKeyDown={(e) => e.key === 'Enter' && addDepartment()}
                  />
                </div>
                <button
                  onClick={addDepartment}
                  disabled={deptLoading || !deptName.trim()}
                  className="bg-integrity text-white font-bold py-4 rounded-full shadow-lg shadow-primary-container/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  Add Department
                </button>
              </div>
              <div className="mt-6 bg-tertiary-fixed rounded-xl p-6 flex items-start gap-3">
                <span className="material-symbols-outlined text-tertiary-container">lightbulb</span>
                <p className="text-sm text-tertiary-container">
                  Departments group teams together. Create at least one department before adding teams.
                </p>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-7">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-2 mb-4">
                Organization Structure ({departments.length} departments)
              </h3>
              <div className="space-y-3">
                {departments.map((dept) => {
                  const teamCount = teams.filter((t) => t.department_id === dept.id).length
                  return (
                    <div key={dept.id} className="bg-white rounded-xl p-5 shadow-[0px_24px_48px_rgba(77,85,106,0.06)] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-secondary-container">apartment</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-on-surface">{dept.name}</p>
                        {dept.head_name && <p className="text-xs text-on-surface-variant">Head: {dept.head_name}</p>}
                      </div>
                      <span className="px-3 py-1 rounded-full bg-surface-container text-xs font-bold text-on-surface-variant">
                        {teamCount} team{teamCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )
                })}
                {departments.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-outline-variant/30 p-8 text-center text-on-surface-variant">
                    <p className="font-medium">No departments yet</p>
                    <p className="text-sm">Create your first department to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Teams */}
        {step === 1 && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-5">
              <div className="bg-white rounded-xl p-8 shadow-[0px_24px_48px_rgba(77,85,106,0.06)] flex flex-col gap-6">
                <h3 className="text-lg font-bold text-on-surface">Create Team</h3>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-bold text-on-surface-variant ml-2">Team Name</label>
                  <input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Frontend Team"
                    className="w-full bg-surface-container-low border-none rounded-full py-4 px-6 font-medium focus:ring-2 focus:ring-primary/10 text-on-surface"
                    onKeyDown={(e) => e.key === 'Enter' && addTeam()}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-bold text-on-surface-variant ml-2">Department</label>
                  <select
                    value={teamDeptId}
                    onChange={(e) => setTeamDeptId(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-full py-4 px-6 font-medium focus:ring-2 focus:ring-primary/10 text-on-surface appearance-none cursor-pointer"
                  >
                    <option value="">No department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={addTeam}
                  disabled={teamLoading || !teamName.trim()}
                  className="bg-integrity text-white font-bold py-4 rounded-full shadow-lg shadow-primary-container/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  Add Team
                </button>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-7">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-2 mb-4">
                Teams ({teams.length})
              </h3>
              <div className="space-y-3">
                {teams.map((team) => {
                  const dept = departments.find((d) => d.id === team.department_id)
                  return (
                    <div key={team.id} className="bg-white rounded-xl p-5 shadow-[0px_24px_48px_rgba(77,85,106,0.06)] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-primary-fixed">groups</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-on-surface">{team.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {dept?.name ?? 'No department'}
                          {team.manager_name && ` • Manager: ${team.manager_name}`}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {teams.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-outline-variant/30 p-8 text-center text-on-surface-variant">
                    <p className="font-medium">No teams yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Employees */}
        {step === 2 && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-5">
              <div className="bg-white rounded-xl p-8 shadow-[0px_24px_48px_rgba(77,85,106,0.06)] flex flex-col gap-6">
                <h3 className="text-lg font-bold text-on-surface">Add Employee</h3>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-bold text-on-surface-variant ml-2">Full Name</label>
                  <input
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                    className="w-full bg-surface-container-low border-none rounded-full py-4 px-6 font-medium focus:ring-2 focus:ring-primary/10 text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-bold text-on-surface-variant ml-2">Email</label>
                  <input
                    type="email"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full bg-surface-container-low border-none rounded-full py-4 px-6 font-medium focus:ring-2 focus:ring-primary/10 text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-bold text-on-surface-variant ml-2">Role</label>
                  <select
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-full py-4 px-6 font-medium focus:ring-2 focus:ring-primary/10 text-on-surface appearance-none cursor-pointer"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="assistant_manager">Assistant Manager</option>
                    <option value="senior_manager">Senior Manager</option>
                  </select>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-bold text-on-surface-variant ml-2">Team</label>
                  <select
                    value={empTeamId}
                    onChange={(e) => setEmpTeamId(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-full py-4 px-6 font-medium focus:ring-2 focus:ring-primary/10 text-on-surface appearance-none cursor-pointer"
                  >
                    <option value="">No team</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={addEmployee}
                  disabled={empLoading || !empName.trim() || !empEmail.trim()}
                  className="bg-integrity text-white font-bold py-4 rounded-full shadow-lg shadow-primary-container/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">person_add</span>
                  Add &amp; Send Invite
                </button>
              </div>
              <div className="mt-6 bg-tertiary-fixed rounded-xl p-6 flex items-start gap-3">
                <span className="material-symbols-outlined text-tertiary-container">lightbulb</span>
                <p className="text-sm text-tertiary-container">
                  Each new employee will receive an invite email to set their password. You can also bulk-import users from the <strong>Manage Users</strong> page.
                </p>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-7">
              <div className="flex items-center justify-between px-2 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Employees ({employees.length})
                </h3>
                <button
                  onClick={() => router.push('/admin/users')}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Manage Users
                </button>
              </div>
              <div className="space-y-3">
                {employees.map((emp) => {
                  const team = teams.find((t) => t.id === emp.team_id)
                  return (
                    <div key={emp.id} className="bg-white rounded-xl p-5 shadow-[0px_24px_48px_rgba(77,85,106,0.06)] flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                        <span className="text-on-primary-container text-sm font-bold">
                          {emp.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-on-surface">{emp.name}</p>
                        <p className="text-xs text-on-surface-variant capitalize">
                          {emp.role.replace(/_/g, ' ')} • {team?.name ?? 'Unassigned'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        {emp.status}
                      </span>
                    </div>
                  )
                })}
                {employees.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-outline-variant/30 p-8 text-center text-on-surface-variant">
                    <p className="font-medium">No employees yet</p>
                    <p className="text-sm">Add your first employee to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer nav */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-xl shadow-[0_-2px_15px_rgba(77,85,106,0.04)]">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-on-surface-variant font-semibold text-sm hover:text-on-surface transition-colors"
          >
            Save &amp; Exit Setup
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="px-6 py-3 rounded-full font-bold text-sm text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              Previous Step
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="px-6 py-3 rounded-full bg-integrity text-white font-bold text-sm flex items-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
              >
                Continue to {STEPS[step + 1]}
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            ) : (
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 rounded-full bg-integrity text-white font-bold text-sm flex items-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
              >
                Complete Setup
                <span className="material-symbols-outlined text-lg">check</span>
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
