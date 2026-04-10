'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface SystemSettings {
  company_name: string
  default_available_hours: number
  archive_window_months: number
}

export default function SystemSettingsClient() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/settings/system')
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to load system settings')
      setLoading(false)
      return
    }
    const data = await res.json()
    setSettings(data.settings)
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  async function save(patch: Partial<SystemSettings>) {
    setSaving(true)
    const res = await fetch('/api/settings/system', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const data = await res.json()
      setSettings(data.settings)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#4d556a] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-on-surface-variant text-lg font-medium">{error}</p>
      </div>
    )
  }

  if (!settings) return null

  return (
    <>
      <header className="mb-12">
        <h1 className="text-[1.5rem] font-bold tracking-tight text-on-surface mb-2">System Settings</h1>
        <p className="text-on-surface-variant font-medium">Organisation-wide configuration</p>
        {saving && <p className="text-xs text-on-surface-variant mt-1">Saving…</p>}
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Organisation Name */}
        <section className="col-span-12 lg:col-span-7 bg-white rounded-2xl p-8 shadow-[0px_24px_48px_rgba(77,85,106,0.06)]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#363e52] mb-1">Organisation Profile</h3>
              <p className="text-sm text-on-surface-variant">Manage your public-facing company identity.</p>
            </div>
            <svg className="w-6 h-6 text-[#453d36]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-4">Company Name</label>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="flex-1 bg-[#f2f4f6] border-0 rounded-full px-6 py-4 text-on-surface font-semibold focus:ring-2 focus:ring-[#4d556a]/20 transition-all"
              />
              <button
                onClick={() => save({ company_name: settings.company_name })}
                className="text-[#363e52] font-bold text-sm hover:underline px-4 py-2 transition-all active:scale-95"
              >
                Save
              </button>
            </div>
          </div>
        </section>

        {/* Work Defaults */}
        <section className="col-span-12 lg:col-span-5 bg-white rounded-2xl p-8 shadow-[0px_24px_48px_rgba(77,85,106,0.06)]">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#363e52] mb-1">Work Defaults</h3>
            <p className="text-sm text-on-surface-variant">Standard weekly capacity for employees.</p>
          </div>
          <div className="flex items-center justify-between bg-[#f2f4f6] rounded-xl p-4">
            <span className="font-semibold text-on-surface ml-2">Available hours</span>
            <div className="flex items-center gap-2 bg-white rounded-full border border-[#c6c6cd]/15 p-1">
              <button
                onClick={() => save({ default_available_hours: Math.max(1, settings.default_available_hours - 1) })}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e6e8ea] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="number"
                value={settings.default_available_hours}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (v >= 1 && v <= 168) setSettings({ ...settings, default_available_hours: v })
                }}
                onBlur={() => save({ default_available_hours: settings.default_available_hours })}
                className="w-12 text-center bg-transparent border-0 font-bold text-[#363e52] p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => save({ default_available_hours: Math.min(168, settings.default_available_hours + 1) })}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e6e8ea] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Data Retention */}
        <section className="col-span-12 lg:col-span-4 bg-white rounded-2xl p-8 shadow-[0px_24px_48px_rgba(77,85,106,0.06)] border border-[#c6c6cd]/10">
          <div className="mb-8">
            <div className="w-12 h-12 bg-[#d1c4bb] rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#211a15]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#363e52] mb-1">Data Retention</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">Define when completed tasks are moved to the archive storage.</p>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2 ml-1">Archive window</label>
              <input
                type="number"
                value={settings.archive_window_months}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (v >= 1 && v <= 120) setSettings({ ...settings, archive_window_months: v })
                }}
                onBlur={() => save({ archive_window_months: settings.archive_window_months })}
                className="w-full bg-[#f2f4f6] border-0 rounded-2xl px-6 py-4 text-on-surface font-bold focus:ring-2 focus:ring-[#453d36]/20 transition-all"
              />
            </div>
            <span className="text-sm font-bold text-on-surface-variant pb-5">months</span>
          </div>
        </section>

        {/* Quick Management Links */}
        <section className="col-span-12 lg:col-span-8 space-y-4">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4 ml-1">Quick Management</h3>

          <Link
            href="/admin/users"
            className="group bg-white hover:bg-[#f7f9fb] rounded-2xl p-5 shadow-[0px_24px_48px_rgba(77,85,106,0.04)] transition-all hover:shadow-[0px_32px_64px_rgba(77,85,106,0.08)] flex items-center justify-between border border-transparent hover:border-[#c6c6cd]/20"
          >
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 rounded-full bg-[#dae2fd] flex items-center justify-center text-[#5c647b]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-on-surface">Manage Users</p>
                <p className="text-xs text-on-surface-variant">Permissions, roles and invitations</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-[#c6c6cd] group-hover:text-[#363e52] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/admin/teams"
            className="group bg-white hover:bg-[#f7f9fb] rounded-2xl p-5 shadow-[0px_24px_48px_rgba(77,85,106,0.04)] transition-all hover:shadow-[0px_32px_64px_rgba(77,85,106,0.08)] flex items-center justify-between border border-transparent hover:border-[#c6c6cd]/20"
          >
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 rounded-full bg-[#dae2fd] flex items-center justify-center text-[#5c647b]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-on-surface">Teams & Departments</p>
                <p className="text-xs text-on-surface-variant">Org chart and reporting lines</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-[#c6c6cd] group-hover:text-[#363e52] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/admin/audit-trail"
            className="group bg-white hover:bg-[#f7f9fb] rounded-2xl p-5 shadow-[0px_24px_48px_rgba(77,85,106,0.04)] transition-all hover:shadow-[0px_32px_64px_rgba(77,85,106,0.08)] flex items-center justify-between border border-transparent hover:border-[#c6c6cd]/20"
          >
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 rounded-full bg-[#dae2fd] flex items-center justify-center text-[#5c647b]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-on-surface">Audit Trail</p>
                <p className="text-xs text-on-surface-variant">Track all system-level changes</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-[#c6c6cd] group-hover:text-[#363e52] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/admin/setup"
            className="group bg-[#191c1e] rounded-2xl p-5 shadow-xl transition-all flex items-center justify-between overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(101,109,132,0.2),transparent)]" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-10 h-10 rounded-full bg-[#2d3133] flex items-center justify-center text-slate-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-white">Sunday Setup Flow</p>
                <p className="text-xs text-slate-400">Complete your organisation profile</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-500 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </section>
      </div>
    </>
  )
}
