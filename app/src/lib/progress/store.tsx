import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { EMPTY, STORAGE_KEY, type ProgressState } from './schema'

type Ctx = {
  state: ProgressState
  toggleSection: (moduloId: string, sectionKey: string) => void
  toggleBookmark: (moduloId: string) => void
  setLast: (path: string) => void
  isSection: (moduloId: string, sectionKey: string) => boolean
  isBookmarked: (moduloId: string) => boolean
  exportJson: () => string
  importJson: (json: string) => { ok: true } | { ok: false; error: string }
}

const ProgressContext = createContext<Ctx | null>(null)

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw)
    return {
      done: parsed.done ?? {},
      sections: parsed.sections ?? {},
      bookmarks: parsed.bookmarks ?? {},
      last: parsed.last ?? '',
    }
  } catch {
    return { ...EMPTY }
  }
}

function save(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // shortcut: storage lleno/bloqueado, silent fail. Upgrade a toast cuando moleste.
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => load())

  useEffect(() => {
    save(state)
  }, [state])

  const toggleSection = useCallback((moduloId: string, sectionKey: string) => {
    const k = `${moduloId}|${sectionKey}`
    setState((s) => ({ ...s, sections: { ...s.sections, [k]: !s.sections[k] } }))
  }, [])

  const toggleBookmark = useCallback((moduloId: string) => {
    setState((s) => ({
      ...s,
      bookmarks: { ...s.bookmarks, [moduloId]: !s.bookmarks[moduloId] },
    }))
  }, [])

  const setLast = useCallback((path: string) => {
    setState((s) => (s.last === path ? s : { ...s, last: path }))
  }, [])

  const isSection = useCallback(
    (m: string, k: string) => !!state.sections[`${m}|${k}`],
    [state.sections],
  )
  const isBookmarked = useCallback((m: string) => !!state.bookmarks[m], [state.bookmarks])

  const exportJson = useCallback(() => JSON.stringify(state, null, 2), [state])

  const importJson = useCallback(
    (json: string): { ok: true } | { ok: false; error: string } => {
      try {
        const parsed = JSON.parse(json)
        if (typeof parsed !== 'object' || parsed === null) {
          return { ok: false, error: 'JSON inválido' }
        }
        const next: ProgressState = {
          done: parsed.done ?? {},
          sections: parsed.sections ?? {},
          bookmarks: parsed.bookmarks ?? {},
          last: parsed.last ?? '',
        }
        setState(next)
        return { ok: true }
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) }
      }
    },
    [],
  )

  const value = useMemo(
    () => ({
      state,
      toggleSection,
      toggleBookmark,
      setLast,
      isSection,
      isBookmarked,
      exportJson,
      importJson,
    }),
    [state, toggleSection, toggleBookmark, setLast, isSection, isBookmarked, exportJson, importJson],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
