'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface TaskResult {
  id: string
  title: string
  status: string
  priority: string
  assignee: { id: string; name: string } | { id: string; name: string }[] | null
  project: { id: string; name: string } | { id: string; name: string }[] | null
}

interface ProjectResult {
  id: string
  name: string
  team_id: string | null
}

interface PersonResult {
  id: string
  name: string
  email: string
  role: string
}

interface SearchResults {
  tasks: TaskResult[]
  projects: ProjectResult[]
  people: PersonResult[]
  total: number
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-surface-variant text-on-surface-variant',
  in_progress: 'bg-energetic-10 text-energetic',
  in_review: 'bg-integrity-10 text-integrity',
  done: 'bg-kindness-10 text-kindness',
}

export default function GlobalSearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Flatten results for keyboard navigation
  const flatItems = results
    ? [
        ...results.tasks.map(t => ({ type: 'task' as const, id: t.id, data: t })),
        ...results.projects.map(p => ({ type: 'project' as const, id: p.id, data: p })),
        ...results.people.map(p => ({ type: 'person' as const, id: p.id, data: p })),
      ]
    : []

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=5`)
      if (res.ok) {
        const data: SearchResults = await res.json()
        setResults(data)
        setActiveIndex(-1)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length >= 2) {
      setLoading(true)
      debounceRef.current = setTimeout(() => search(query), 300)
    } else {
      setResults(null)
      setLoading(false)
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  // Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape' && open) {
        inputRef.current?.blur()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleGlobalKey)
    return () => document.removeEventListener('keydown', handleGlobalKey)
  }, [open])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Keyboard navigation in results
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || flatItems.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (i + 1) % flatItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => (i - 1 + flatItems.length) % flatItems.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0) {
        navigateToItem(flatItems[activeIndex])
      } else if (flatItems.length > 0) {
        navigateToItem(flatItems[0])
      }
    }
  }

  function navigateToItem(item: (typeof flatItems)[number]) {
    setOpen(false)
    setQuery('')
    setResults(null)
    if (item.type === 'task') router.push(`/tasks/${item.id}`)
    else if (item.type === 'project') router.push(`/board?project_id=${item.id}`)
    else if (item.type === 'person') router.push(`/admin/users`)
  }

  function highlightMatch(text: string) {
    if (!query || query.length < 2) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="text-primary-container font-medium">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }

  function resolveRelation<T>(val: T | T[] | null): T | null {
    if (!val) return null
    return Array.isArray(val) ? val[0] ?? null : val
  }

  const showDropdown = open && (loading || results)

  return (
    <div ref={containerRef} className="hidden md:flex items-center justify-center w-[40%] relative z-30">
      <div
        className={`relative w-full h-12 bg-surface-container-low rounded-full flex items-center transition-all duration-300 ${
          open ? 'shadow-[0px_4px_20px_rgba(77,85,106,0.08)] scale-[1.01]' : ''
        }`}
      >
        <span className="absolute left-4 material-symbols-outlined text-on-surface-variant text-xl">
          search
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search tasks, projects, people…"
          className="w-full h-full pl-12 pr-20 bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-on-surface-variant outline-none"
        />
        {query ? (
          <button
            onClick={() => { setQuery(''); setResults(null) }}
            className="absolute right-4 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        ) : (
          <div className={`absolute right-4 px-2 py-1 bg-white/50 rounded-md text-[10px] font-bold text-on-surface-variant tracking-wider pointer-events-none ${open ? 'hidden' : ''}`}>
            Ctrl K
          </div>
        )}
      </div>

      {/* Glassmorphism Dropdown */}
      {showDropdown && (
        <div className="absolute top-14 left-0 w-[480px] bg-white/80 backdrop-blur-[20px] rounded-2xl shadow-[0px_24px_48px_rgba(77,85,106,0.06)] overflow-hidden flex flex-col z-50 py-2">
          {loading && !results && (
            <div className="px-4 py-6 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-surface-container-high rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {results && results.total === 0 && (
            <div className="px-6 py-8 text-center">
              <span className="material-symbols-outlined text-[32px] text-on-surface-variant/30 mb-2">search_off</span>
              <p className="text-sm text-on-surface-variant">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {results && results.total > 0 && (
            <>
              {/* Tasks section */}
              {results.tasks.length > 0 && (
                <div className="px-4 py-2">
                  <h4 className="text-xs font-medium text-on-surface-variant tracking-wide uppercase mb-2">Tasks</h4>
                  {results.tasks.map((task, idx) => {
                    const globalIdx = idx
                    const assignee = resolveRelation(task.assignee)
                    return (
                      <button
                        key={task.id}
                        onClick={() => navigateToItem({ type: 'task', id: task.id, data: task })}
                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer w-full text-left transition-colors mt-0.5 ${
                          activeIndex === globalIdx ? 'bg-surface-container-low' : 'hover:bg-surface-container-high'
                        }`}
                      >
                        {activeIndex === globalIdx && (
                          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary-container to-secondary rounded-l-lg" />
                        )}
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant">
                          <span className="material-symbols-outlined text-[20px]">check_circle</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-on-surface truncate">{highlightMatch(task.title)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] ?? 'bg-surface-variant text-on-surface-variant'}`}>
                            {STATUS_LABELS[task.status] ?? task.status}
                          </span>
                          {assignee && (
                            <div className="w-6 h-6 rounded-full bg-integrity-10 flex items-center justify-center text-[10px] text-integrity font-medium">
                              {assignee.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Projects section */}
              {results.projects.length > 0 && (
                <div className="px-4 py-2 mt-1">
                  <h4 className="text-xs font-medium text-on-surface-variant tracking-wide uppercase mb-2">Projects</h4>
                  {results.projects.map((project, idx) => {
                    const globalIdx = results.tasks.length + idx
                    return (
                      <button
                        key={project.id}
                        onClick={() => navigateToItem({ type: 'project', id: project.id, data: project })}
                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer w-full text-left transition-colors ${
                          activeIndex === globalIdx ? 'bg-surface-container-low' : 'hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary-fixed/20 text-primary-container">
                          <span className="material-symbols-outlined text-[20px]">folder</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-on-surface truncate">{highlightMatch(project.name)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* People section */}
              {results.people.length > 0 && (
                <div className="px-4 py-2 mt-1">
                  <h4 className="text-xs font-medium text-on-surface-variant tracking-wide uppercase mb-2">People</h4>
                  {results.people.map((person, idx) => {
                    const globalIdx = results.tasks.length + results.projects.length + idx
                    return (
                      <button
                        key={person.id}
                        onClick={() => navigateToItem({ type: 'person', id: person.id, data: person })}
                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer w-full text-left transition-colors ${
                          activeIndex === globalIdx ? 'bg-surface-container-low' : 'hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-xs font-bold text-on-tertiary-fixed">
                          {person.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-on-surface truncate">{highlightMatch(person.name)}</p>
                        </div>
                        <div className="shrink-0">
                          <span className="text-xs text-on-surface-variant">{person.role.replace(/_/g, ' ')}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* See all footer */}
              <div className="mt-2 border-t border-outline-variant/15 px-2 pt-2 pb-1">
                <button
                  onClick={() => { setOpen(false); setQuery(''); router.push(`/board?search=${encodeURIComponent(query)}`) }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-primary hover:bg-surface-container-high rounded-lg transition-colors"
                >
                  See all {results.total} results for &ldquo;{query}&rdquo;
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Scrim behind dropdown */}
      {open && query.length >= 2 && (
        <div className="fixed inset-0 z-[-1] bg-surface/20 backdrop-blur-[2px]" />
      )}
    </div>
  )
}
