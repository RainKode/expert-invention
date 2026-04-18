'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface TeamData {
  id: string
  name: string
  planning_mode: 'locked' | 'fluid'
  submission_deadline_day: number | null
  submission_deadline_time: string | null
  check_in_mandatory: boolean
  eod_mandatory: boolean
}

export default function TeamSettingsClient() {
  const [team, setTeam] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTeam = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/settings/team')
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to load team settings')
      setLoading(false)
      return
    }
    const data = await res.json()
    setTeam(data.team)
    setLoading(false)
  }, [])

  useEffect(() => { fetchTeam() }, [fetchTeam])

  async function save(patch: Partial<TeamData>) {
    setSaving(true)
    await fetch('/api/settings/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setTeam((prev) => prev ? { ...prev, ...patch } : prev)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-integrity border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-on-surface-variant text-lg font-medium">{error}</p>
        <p className="text-on-surface-variant/60 text-sm mt-2">You may not have a team assigned.</p>
      </div>
    )
  }

  if (!team) return null

  const isLocked = team.planning_mode === 'locked'

  return (
    <>
      <header className="mb-12">
        <h1 className="text-[1.5rem] font-bold tracking-tight text-on-surface mb-2">Team Settings</h1>
        <p className="text-on-surface-variant">Managing settings for {team.name}</p>
        {saving && <p className="text-xs text-on-surface-variant mt-1">Saving…</p>}
      </header>

      <div className="space-y-8">
        {/* Planning Mode */}
        <section className="bg-white p-8 rounded-2xl shadow-[0px_24px_48px_rgba(77,85,106,0.06)]">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-lg text-[#363e52]">Planning Mode</h3>
                <p className="text-sm text-on-surface-variant mt-1">Determine how team schedules are finalized.</p>
              </div>
              <div className="bg-[#f2f4f6] p-1 rounded-full flex gap-1">
                <button
                  onClick={() => save({ planning_mode: 'fluid' })}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                    !isLocked ? 'bg-gradient-to-br from-[#2226F7] to-[#00D6A3] text-white shadow-sm' : 'text-on-surface-variant hover:bg-[#e6e8ea]'
                  }`}
                >
                  Flexible
                </button>
                <button
                  onClick={() => save({ planning_mode: 'locked' })}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                    isLocked ? 'bg-gradient-to-br from-[#2226F7] to-[#00D6A3] text-white shadow-sm' : 'text-on-surface-variant hover:bg-[#e6e8ea]'
                  }`}
                >
                  Locked
                </button>
              </div>
            </div>

            {isLocked && (
              <div className="pt-6 mt-6 border-t border-dashed border-[#c6c6cd]/30">
                <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Submission Deadline</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-on-surface-variant px-4">Day of week</label>
                    <select
                      value={team.submission_deadline_day ?? 5}
                      onChange={(e) => save({ submission_deadline_day: Number(e.target.value) })}
                      className="w-full h-12 px-6 rounded-full bg-[#f2f4f6] border-0 focus:ring-2 focus:ring-integrity/20 text-on-surface font-medium appearance-none"
                    >
                      {DAYS.map((day, i) => (
                        <option key={i} value={i}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-on-surface-variant px-4">Time</label>
                    <input
                      type="time"
                      value={team.submission_deadline_time ?? '17:00'}
                      onChange={(e) => save({ submission_deadline_time: e.target.value })}
                      className="w-full h-12 px-6 rounded-full bg-[#f2f4f6] border-0 focus:ring-2 focus:ring-integrity/20 text-on-surface font-medium"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Daily Check-in */}
        <section className="bg-[#f2f4f6] p-8 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-[#eee0d7] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#453d36]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-[#363e52]">Daily Check-in</h3>
              <p className="text-sm text-on-surface-variant mt-1">Prompt members to share their focus each morning.</p>
            </div>
          </div>
          <button
            onClick={() => save({ check_in_mandatory: !team.check_in_mandatory })}
            className={`w-14 h-7 rounded-full relative flex items-center px-1 transition-colors flex-shrink-0 ${
              team.check_in_mandatory ? 'bg-integrity' : 'bg-[#e0e3e5]'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
              team.check_in_mandatory ? 'translate-x-7' : 'translate-x-0'
            }`} />
          </button>
        </section>

        {/* EOD Wrap-up */}
        <section className="bg-[#f2f4f6] p-8 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-[#eee0d7] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#453d36]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-[#363e52]">EOD Wrap-up</h3>
              <p className="text-sm text-on-surface-variant mt-1">Automatically ask for summary of work at the end of the day.</p>
            </div>
          </div>
          <button
            onClick={() => save({ eod_mandatory: !team.eod_mandatory })}
            className={`w-14 h-7 rounded-full relative flex items-center px-1 transition-colors flex-shrink-0 ${
              team.eod_mandatory ? 'bg-integrity' : 'bg-[#e0e3e5]'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
              team.eod_mandatory ? 'translate-x-7' : 'translate-x-0'
            }`} />
          </button>
        </section>

        {/* Management Links */}
        <div className="grid grid-cols-1 gap-4">
          <Link
            href="/settings/custom-fields"
            className="group bg-white p-6 rounded-2xl shadow-[0px_4px_12px_rgba(77,85,106,0.04)] hover:shadow-[0px_12px_32px_rgba(77,85,106,0.08)] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#565e74] group-hover:bg-integrity group-hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <span className="block font-bold text-[#363e52]">Manage Custom Fields</span>
                <span className="text-xs text-on-surface-variant">Configure extra data points for team entries</span>
              </div>
            </div>
            <svg className="w-5 h-5 text-[#c6c6cd] group-hover:text-[#363e52] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  )
}
