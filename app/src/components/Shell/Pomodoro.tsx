import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FiClock, FiPlay, FiPause, FiRotateCcw, FiSkipForward, FiSettings, FiVolume2, FiVolumeX, FiMinus } from 'react-icons/fi'
import styles from './Shell.module.css'

type Phase = 'work' | 'short' | 'long'
type Config = { work: number; short: number; long: number; cycles: number }
type Stored = {
  phase: Phase
  cyclesCompleted: number
  endsAt: number | null
  msRemaining: number | null
  pendingPhase: Phase | null
  justFinished: Phase | null
  minimized: boolean
  pos: { x: number; y: number }
  muted: boolean
  config: Config
  history: Record<string, number>
  notifPerm: NotificationPermission
}

const STORAGE_KEY = 'pomodoro'
const BC_NAME = 'pomodoro'
const WIDGET_W = 280
const WIDGET_H = 160
const PHASE_LABEL: Record<Phase, string> = { work: 'trabajo', short: 'pausa corta', long: 'pausa larga' }

const DEFAULT_CONFIG: Config = { work: 25, short: 5, long: 15, cycles: 4 }

function nextPhase(phase: Phase, cyclesCompleted: number, cfg: Config): Phase {
  if (phase !== 'work') return 'work'
  const done = cyclesCompleted + 1
  return done % cfg.cycles === 0 ? 'long' : 'short'
}

function durationSec(phase: Phase, cfg: Config): number {
  return cfg[phase] * 60
}

function todayKey(now = Date.now()): string {
  const d = new Date(now)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function pruneHistory(h: Record<string, number>, now = Date.now()): Record<string, number> {
  const cutoff = now - 90 * 24 * 60 * 60 * 1000
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(h)) {
    const t = new Date(k + 'T00:00:00').getTime()
    if (!Number.isNaN(t) && t >= cutoff) out[k] = v
  }
  return out
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function clampDuration(n: unknown): number {
  const v = Number(n)
  if (!Number.isFinite(v)) return 1
  return clamp(Math.round(v), 1, 180)
}

function clampCycles(n: unknown): number {
  const v = Number(n)
  if (!Number.isFinite(v)) return 1
  return clamp(Math.round(v), 1, 10)
}

function clampPos(p: { x: number; y: number }): { x: number; y: number } {
  const maxX = Math.max(0, window.innerWidth - WIDGET_W)
  const maxY = Math.max(0, window.innerHeight - WIDGET_H)
  return { x: clamp(p.x, 0, maxX), y: clamp(p.y, 0, maxY) }
}

function defaultPos(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 16, y: 16 }
  return clampPos({ x: window.innerWidth - WIDGET_W - 16, y: window.innerHeight - WIDGET_H - 16 })
}

function last7Days(h: Record<string, number>, now = Date.now()): number[] {
  const out: number[] = []
  for (let i = 6; i >= 0; i--) {
    const k = todayKey(now - i * 24 * 60 * 60 * 1000)
    out.push(h[k] ?? 0)
  }
  return out
}

function sparkPath(values: number[], w = 80, h = 20): string {
  if (values.length === 0) return ''
  const max = Math.max(1, ...values)
  const step = values.length === 1 ? 0 : w / (values.length - 1)
  return values
    .map((v, i) => {
      const x = i * step
      const y = h - (v / max) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function loadState(): Stored {
  const base: Stored = {
    phase: 'work',
    cyclesCompleted: 0,
    endsAt: null,
    msRemaining: null,
    pendingPhase: null,
    justFinished: null,
    minimized: typeof window !== 'undefined' && window.matchMedia('(max-width: 599px)').matches,
    pos: defaultPos(),
    muted: false,
    config: { ...DEFAULT_CONFIG },
    history: {},
    notifPerm: typeof Notification !== 'undefined' ? Notification.permission : 'default',
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<Stored>
    const merged: Stored = {
      ...base,
      ...parsed,
      config: { ...DEFAULT_CONFIG, ...(parsed.config ?? {}) },
      pos: parsed.pos ? clampPos(parsed.pos) : base.pos,
      history: pruneHistory(parsed.history ?? {}),
    }
    if (merged.endsAt != null && Date.now() - merged.endsAt > 2000 && !merged.pendingPhase) {
      const np = nextPhase(merged.phase, merged.cyclesCompleted, merged.config)
      const done = merged.phase === 'work' ? merged.cyclesCompleted + 1 : merged.cyclesCompleted
      const hist = merged.phase === 'work'
        ? { ...merged.history, [todayKey()]: (merged.history[todayKey()] ?? 0) + 1 }
        : merged.history
      return { ...merged, phase: np, cyclesCompleted: done, endsAt: null, msRemaining: null, pendingPhase: np, justFinished: merged.phase, history: hist }
    }
    return merged
  } catch {
    return base
  }
}

function saveState(s: Stored): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch { /* quota or disabled */ }
}

function computeSeconds(s: Stored): number {
  if (s.endsAt != null) return Math.max(0, Math.round((s.endsAt - Date.now()) / 1000))
  if (s.msRemaining != null) return Math.round(s.msRemaining / 1000)
  return durationSec(s.pendingPhase ?? s.phase, s.config)
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function useMediaQuery(q: string): boolean {
  const [match, setMatch] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(q).matches : false))
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setMatch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return match
}

// Dev self-check — covers the only non-trivial logic branches.
if (import.meta.env.DEV) {
  const cfg = DEFAULT_CONFIG
  console.assert(nextPhase('work', 3, cfg) === 'long', 'nextPhase work→long after 4 cycles')
  console.assert(nextPhase('work', 0, cfg) === 'short', 'nextPhase work→short')
  console.assert(nextPhase('short', 1, cfg) === 'work', 'nextPhase short→work')
  console.assert(nextPhase('long', 4, cfg) === 'work', 'nextPhase long→work')
  console.assert(clampDuration(0) === 1 && clampDuration(999) === 180 && clampDuration('x') === 1, 'clampDuration bounds')
  console.assert(clampCycles(0) === 1 && clampCycles(99) === 10, 'clampCycles bounds')
  const pruned = pruneHistory({ 'bad-key': 5, '2020-01-01': 3, [todayKey()]: 2 })
  console.assert(pruned['bad-key'] === undefined && pruned['2020-01-01'] === undefined && pruned[todayKey()] === 2, 'pruneHistory drops old + invalid entries')
  console.assert(sparkPath([0, 0, 0]).length > 0, 'sparkPath handles all zeros')
  console.assert(sparkPath([]) === '', 'sparkPath handles empty')
}

export function Pomodoro() {
  const [state, setState] = useState<Stored>(loadState)
  const [secondsLeft, setSecondsLeft] = useState<number>(() => computeSeconds(state))
  const [isDragging, setIsDragging] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [toastReady, setToastReady] = useState(false)
  const isMobile = useMediaQuery('(max-width: 599px)')

  const audioRef = useRef<AudioContext | null>(null)
  const bcRef = useRef<BroadcastChannel | null>(null)
  const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null)
  const originalTitleRef = useRef<string>(typeof document !== 'undefined' ? document.title : '')
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playedForPendingRef = useRef<string | null>(null)
  const skipNextBroadcastRef = useRef(false)

  // Persist + broadcast on every state change.
  useEffect(() => {
    saveState(state)
    if (skipNextBroadcastRef.current) { skipNextBroadcastRef.current = false; return }
    bcRef.current?.postMessage({ type: 'changed' })
  }, [state])

  // Tick: recompute secondsLeft against the wall clock, not by decrementing.
  useEffect(() => {
    setSecondsLeft(computeSeconds(state))
    if (state.endsAt == null) return
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((state.endsAt! - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) {
        clearInterval(id)
        handlePhaseEnd()
      }
    }, 500)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.endsAt])

  // BroadcastChannel sync between tabs (fallback: storage event).
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(BC_NAME)
      bcRef.current = bc
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'changed') {
          skipNextBroadcastRef.current = true
          setState(loadState())
        }
      }
      return () => { bc.close(); bcRef.current = null }
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      skipNextBroadcastRef.current = true
      setState(loadState())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Clamp position on viewport resize.
  useEffect(() => {
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setState((s) => ({ ...s, pos: clampPos(s.pos) })))
    }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf) }
  }, [])

  // Visibility: flush pending beep/notification when tab becomes visible.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      if (state.pendingPhase && playedForPendingRef.current !== phaseKey(state)) {
        notify(state.pendingPhase, state.phase)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pendingPhase, state.phase])

  // Reset title on unmount.
  useEffect(() => () => {
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current)
    document.title = originalTitleRef.current
  }, [])

  // Enable toast interactions after a short delay so a double-tap doesn't auto-confirm.
  useEffect(() => {
    if (!state.pendingPhase) { setToastReady(false); return }
    const id = setTimeout(() => setToastReady(true), 250)
    return () => clearTimeout(id)
  }, [state.pendingPhase])

  const initAudio = useCallback(() => {
    if (audioRef.current || typeof window === 'undefined') return
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    try { audioRef.current = new Ctor() } catch { /* ignore */ }
  }, [])

  const beep = useCallback(() => {
    if (state.muted) return
    const ctx = audioRef.current
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const play = (freq: number, start: number, dur: number) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.frequency.value = freq
        o.type = 'sine'
        g.gain.setValueAtTime(0.0001, now + start)
        g.gain.exponentialRampToValueAtTime(0.25, now + start + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur)
        o.connect(g); g.connect(ctx.destination)
        o.start(now + start)
        o.stop(now + start + dur + 0.02)
      }
      play(880, 0, 0.18)
      play(660, 0.22, 0.22)
    } catch { /* ignore */ }
  }, [state.muted])

  const sysNotify = useCallback((pending: Phase, prev: Phase) => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    try {
      new Notification('Pomodoro', {
        body: `Terminaste ${PHASE_LABEL[prev]}. Siguiente: ${PHASE_LABEL[pending]}.`,
        tag: 'pomodoro',
      })
    } catch { /* ignore */ }
  }, [])

  const notify = useCallback((pending: Phase, prev: Phase) => {
    if (document.visibilityState !== 'visible') return
    playedForPendingRef.current = `${prev}->${pending}`
    beep()
    sysNotify(pending, prev)
    document.title = `⏰ ${PHASE_LABEL[pending]} — Atlas`
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current)
    titleTimerRef.current = setTimeout(() => { document.title = originalTitleRef.current }, 10000)
  }, [beep, sysNotify])

  const handlePhaseEnd = useCallback(() => {
    setState((s) => {
      const np = nextPhase(s.phase, s.cyclesCompleted, s.config)
      const done = s.phase === 'work' ? s.cyclesCompleted + 1 : s.cyclesCompleted
      const hist = s.phase === 'work'
        ? { ...s.history, [todayKey()]: (s.history[todayKey()] ?? 0) + 1 }
        : s.history
      const nextState: Stored = {
        ...s,
        phase: np,
        cyclesCompleted: done,
        endsAt: null,
        msRemaining: null,
        pendingPhase: np,
        justFinished: s.phase,
        history: hist,
      }
      // Fire-and-forget: notify after state commit so title changes with the new phase.
      queueMicrotask(() => notify(np, s.phase))
      return nextState
    })
  }, [notify])

  // Handlers
  const onStart = useCallback(() => {
    initAudio()
    setState((s) => {
      const ms = s.msRemaining ?? durationSec(s.pendingPhase ?? s.phase, s.config) * 1000
      const phase = s.pendingPhase ?? s.phase
      return { ...s, phase, pendingPhase: null, justFinished: null, endsAt: Date.now() + ms, msRemaining: null }
    })
    playedForPendingRef.current = null
  }, [initAudio])

  const onPause = useCallback(() => {
    initAudio()
    setState((s) => {
      if (s.endsAt == null) return s
      const left = Math.max(0, s.endsAt - Date.now())
      return { ...s, endsAt: null, msRemaining: left }
    })
  }, [initAudio])

  const onReset = useCallback(() => {
    initAudio()
    setState((s) => ({ ...s, phase: 'work', cyclesCompleted: 0, endsAt: null, msRemaining: null, pendingPhase: null, justFinished: null }))
    playedForPendingRef.current = null
  }, [initAudio])

  const onSkip = useCallback(() => {
    initAudio()
    setState((s) => {
      const np = nextPhase(s.phase, s.cyclesCompleted, s.config)
      const done = s.phase === 'work' ? s.cyclesCompleted + 1 : s.cyclesCompleted
      return { ...s, phase: np, cyclesCompleted: done, endsAt: null, msRemaining: null, pendingPhase: np, justFinished: s.phase }
    })
  }, [initAudio])

  const onLater = useCallback(() => {
    setState((s) => ({ ...s, pendingPhase: null, justFinished: null, endsAt: null, msRemaining: null }))
    playedForPendingRef.current = null
  }, [])

  const onMuteToggle = useCallback(() => {
    initAudio()
    setState((s) => ({ ...s, muted: !s.muted }))
  }, [initAudio])

  const onRequestNotif = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    try {
      const perm = await Notification.requestPermission()
      setState((s) => ({ ...s, notifPerm: perm }))
    } catch { /* ignore */ }
  }, [])

  const onConfigChange = useCallback((key: keyof Config, raw: string) => {
    setState((s) => ({
      ...s,
      config: {
        ...s.config,
        [key]: key === 'cycles' ? clampCycles(raw) : clampDuration(raw),
      },
    }))
  }, [])

  const onConfigReset = useCallback(() => {
    setState((s) => ({ ...s, config: { ...DEFAULT_CONFIG } }))
  }, [])

  const onClearHistory = useCallback(() => {
    if (!window.confirm('¿Vaciar historial de ciclos?')) return
    setState((s) => ({ ...s, history: {} }))
  }, [])

  // Drag
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isMobile) return
    // Don't steal clicks destined for child buttons (mute/config/close).
    if ((e.target as HTMLElement).closest('button')) return
    initAudio()
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    dragOffsetRef.current = { dx: e.clientX - state.pos.x, dy: e.clientY - state.pos.y }
    setIsDragging(true)
  }, [initAudio, isMobile, state.pos.x, state.pos.y])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragOffsetRef.current) return
    const { dx, dy } = dragOffsetRef.current
    const pos = clampPos({ x: e.clientX - dx, y: e.clientY - dy })
    setState((s) => ({ ...s, pos }))
  }, [isDragging])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    const target = e.currentTarget as HTMLElement
    try { target.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
    dragOffsetRef.current = null
    setIsDragging(false)
  }, [isDragging])

  const onHandleKey = useCallback((e: React.KeyboardEvent) => {
    const step = 10
    let dx = 0, dy = 0
    if (e.key === 'ArrowLeft') dx = -step
    else if (e.key === 'ArrowRight') dx = step
    else if (e.key === 'ArrowUp') dy = -step
    else if (e.key === 'ArrowDown') dy = step
    else return
    e.preventDefault()
    setState((s) => ({ ...s, pos: clampPos({ x: s.pos.x + dx, y: s.pos.y + dy }) }))
  }, [])

  // Toast: Esc closes.
  useEffect(() => {
    if (!state.pendingPhase) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onLater() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.pendingPhase, onLater])

  const running = state.endsAt != null
  const displaySeconds = running ? secondsLeft : computeSeconds(state)
  const currentPhaseLabel = PHASE_LABEL[state.pendingPhase ?? state.phase]
  const total = durationSec(state.pendingPhase ?? state.phase, state.config)
  const progress = total > 0 ? 1 - displaySeconds / total : 0
  const todayCount = state.history[todayKey()] ?? 0
  const totalCount = useMemo(() => Object.values(state.history).reduce((a, b) => a + b, 0), [state.history])
  const spark = useMemo(() => last7Days(state.history), [state.history])

  // FAB visuals: ring stroke-dasharray based on progress of CURRENT phase.
  const r = 20
  const circumference = 2 * Math.PI * r
  const dash = running || state.msRemaining != null ? circumference * progress : 0

  const widgetStyle: React.CSSProperties = isMobile
    ? {}
    : { left: state.pos.x, top: state.pos.y, opacity: isDragging ? 0.55 : 1 }

  const toggleMinimized = useCallback(() => {
    initAudio()
    setState((s) => ({ ...s, minimized: !s.minimized }))
  }, [initAudio])

  return (
    <>
      {state.minimized && (
        <button
          type="button"
          className={styles.pomodoroFab}
          aria-label="Abrir Pomodoro"
          aria-expanded={false}
          aria-haspopup="dialog"
          data-testid="pomodoro-fab"
          data-pending={state.pendingPhase ? 'true' : 'false'}
          onClick={toggleMinimized}
        >
          <svg className={styles.pomodoroRing} viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r={r} className={styles.pomodoroRingTrack} />
            <circle
              cx="24" cy="24" r={r}
              className={styles.pomodoroRingFill}
              strokeDasharray={`${dash} ${circumference}`}
              transform="rotate(-90 24 24)"
            />
          </svg>
          <span className={styles.pomodoroFabLabel}>
            {running || state.msRemaining != null ? fmtTime(displaySeconds) : <FiClock aria-hidden="true" />}
          </span>
        </button>
      )}

      <div
        className={`${styles.pomodoro} ${isDragging ? styles.pomodoroDragging : ''}`}
        style={widgetStyle}
        role="region"
        aria-label="Pomodoro"
        data-testid="pomodoro-widget"
        hidden={state.minimized}
      >
        <div
          className={styles.pomodoroHandle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onHandleKey}
          role="button"
          tabIndex={0}
          aria-label="Mover Pomodoro (flechas para ajustar)"
          title={isMobile ? '' : 'Arrastra o usa flechas para mover'}
        >
          <span className={styles.pomodoroPhaseLabel}>{currentPhaseLabel}</span>
          <div className={styles.pomodoroHandleActions}>
            <button type="button" className={styles.pomodoroIconBtn} onClick={onMuteToggle} aria-label={state.muted ? 'Activar sonido' : 'Silenciar'}>
              {state.muted ? <FiVolumeX /> : <FiVolume2 />}
            </button>
            <button type="button" className={styles.pomodoroIconBtn} onClick={() => setShowConfig((v) => !v)} aria-label="Ajustes" aria-expanded={showConfig}>
              <FiSettings />
            </button>
            <button type="button" className={styles.pomodoroIconBtn} onClick={toggleMinimized} aria-label="Minimizar">
              <FiMinus />
            </button>
          </div>
        </div>

        <div className={styles.pomodoroTime} aria-live="polite">{fmtTime(displaySeconds)}</div>

        <div className={styles.pomodoroActions}>
          {running ? (
            <button type="button" className={styles.pomodoroBtn} onClick={onPause} aria-label="Pausar">
              <FiPause aria-hidden="true" /> Pausar
            </button>
          ) : (
            <button type="button" className={`${styles.pomodoroBtn} ${styles.pomodoroBtnPrimary}`} onClick={onStart} aria-label="Iniciar">
              <FiPlay aria-hidden="true" /> Iniciar
            </button>
          )}
          <button type="button" className={styles.pomodoroBtn} onClick={onSkip} aria-label="Saltar fase">
            <FiSkipForward aria-hidden="true" />
          </button>
          <button type="button" className={styles.pomodoroBtn} onClick={onReset} aria-label="Reiniciar">
            <FiRotateCcw aria-hidden="true" />
          </button>
        </div>

        <div className={styles.pomodoroStats}>
          <span>Hoy: <strong>{todayCount}</strong> 🍅 · Total: <strong>{totalCount}</strong></span>
          <svg className={styles.pomodoroSpark} viewBox="0 0 80 20" aria-label="Ciclos últimos 7 días">
            <path d={sparkPath(spark)} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>

        {showConfig && (
          <div className={styles.pomodoroConfig}>
            <label>Trabajo <input type="number" min={1} max={180} value={state.config.work} onChange={(e) => onConfigChange('work', e.target.value)} /></label>
            <label>Pausa corta <input type="number" min={1} max={180} value={state.config.short} onChange={(e) => onConfigChange('short', e.target.value)} /></label>
            <label>Pausa larga <input type="number" min={1} max={180} value={state.config.long} onChange={(e) => onConfigChange('long', e.target.value)} /></label>
            <label>Ciclos <input type="number" min={1} max={10} value={state.config.cycles} onChange={(e) => onConfigChange('cycles', e.target.value)} /></label>
            <div className={styles.pomodoroConfigActions}>
              <button type="button" className={styles.pomodoroBtn} onClick={onConfigReset}>Restablecer</button>
              <button type="button" className={styles.pomodoroBtn} onClick={onClearHistory}>Vaciar historial</button>
            </div>
            <div className={styles.pomodoroConfigActions}>
              {state.notifPerm === 'granted' ? (
                <span className={styles.pomodoroNote}>Avisos del sistema activos.</span>
              ) : state.notifPerm === 'denied' ? (
                <span className={styles.pomodoroNote}>Avisos bloqueados — gestiónalos en el navegador.</span>
              ) : (
                <button type="button" className={styles.pomodoroBtn} onClick={onRequestNotif}>Activar avisos del sistema</button>
              )}
            </div>
          </div>
        )}

        {state.pendingPhase && (
          <div className={styles.pomodoroToast} role="alertdialog" aria-label="Fase terminada" data-testid="pomodoro-toast">
            <p>
              {state.justFinished && <>Terminaste <strong>{PHASE_LABEL[state.justFinished]}</strong>. </>}
              Siguiente: <strong>{PHASE_LABEL[state.pendingPhase]}</strong> ({fmtTime(durationSec(state.pendingPhase, state.config))}).
            </p>
            <div className={styles.pomodoroToastActions}>
              <button type="button" className={`${styles.pomodoroBtn} ${styles.pomodoroBtnPrimary}`} onClick={onStart} disabled={!toastReady} autoFocus>
                Empezar
              </button>
              <button type="button" className={styles.pomodoroBtn} onClick={onLater}>Más tarde</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function phaseKey(s: Stored): string {
  return `${s.phase}->${s.pendingPhase ?? ''}`
}
