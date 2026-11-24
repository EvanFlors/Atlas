import { useCallback, useEffect, useState } from 'react'

export type ReadingSize = 'sm' | 'md' | 'lg'

const KEY = 'atlas.reading'

function read(): ReadingSize {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'sm' || v === 'lg') return v
  } catch {}
  return 'md'
}

function apply(size: ReadingSize) {
  document.documentElement.dataset.reading = size
}

const NEXT: Record<ReadingSize, ReadingSize> = { sm: 'md', md: 'lg', lg: 'sm' }

export function useReadingSize() {
  const [size, setSize] = useState<ReadingSize>(() => {
    const s = read()
    apply(s)
    return s
  })

  useEffect(() => {
    apply(size)
  }, [size])

  const cycle = useCallback(() => {
    setSize((cur) => {
      const next = NEXT[cur]
      try {
        localStorage.setItem(KEY, next)
      } catch {}
      return next
    })
  }, [])

  return { size, cycle }
}
