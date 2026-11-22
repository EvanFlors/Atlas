import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'atlas.theme'

function readStored(): Theme {
    try {
        const value = localStorage.getItem(STORAGE_KEY)
        if (value === 'light' || value === 'dark' || value === 'system') {
            return value
        }
    } catch {}
    return 'system'
}

function systemResolved(): ResolvedTheme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(resolved: ResolvedTheme) {
    document.documentElement.dataset.theme = resolved
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(() => readStored())
    const [resolved, setResolved] = useState<ResolvedTheme>(() =>
        readStored() === 'system' ? systemResolved() : readStored() as ResolvedTheme,
    )

    const setTheme = useCallback((t: Theme) => {
        try {
            localStorage.setItem(STORAGE_KEY, t)
        } catch {}
        setThemeState(t)
        const next: ResolvedTheme = t === 'system' ? systemResolved() : t
        setResolved(next)
        apply(next)
    }, [])

    useEffect(() => {
        if (theme === 'system') return
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const onChange = () => {
            const next: ResolvedTheme = mq.matches ? 'dark' : 'light'
            setResolved(next)
            apply(next)
        }
        mq.addEventListener('change', onChange)
        return () => {
            mq.removeEventListener('change', onChange)
        }
    }, [theme])

    return { theme, resolved, setTheme }
}