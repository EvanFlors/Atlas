import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router-dom'
import { FiMessageCircle, FiMinus, FiSend, FiRotateCcw } from 'react-icons/fi'
import { embedQuery } from '../../lib/embed'
import styles from './Shell.module.css'

type Source = {
  categoriaId: string
  moduloId: string
  moduloTitulo: string
  sectionTitle: string
  sectionSlug: string
  score: number
}
type Msg = { role: 'user' | 'assistant'; content: string; sources?: Source[] }
type Stored = { minimized: boolean; messages: Msg[] }

const STORAGE_KEY = 'atlas-chat'
const MAX_PERSISTED = 20

function loadState(): Stored {
  const base: Stored = {
    minimized: typeof window !== 'undefined' ? window.matchMedia('(max-width: 599px)').matches : true,
    messages: [],
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<Stored>
    return {
      minimized: parsed.minimized ?? base.minimized,
      messages: Array.isArray(parsed.messages) ? parsed.messages.slice(-MAX_PERSISTED) : [],
    }
  } catch { return base }
}

function saveState(s: Stored) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, messages: s.messages.slice(-MAX_PERSISTED) })) } catch { /* ignore */ }
}

export function Chatbot() {
  const [state, setState] = useState<Stored>(loadState)
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modelStatus, setModelStatus] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { saveState(state) }, [state])

  // Autoscroll
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [state.messages, pending])

  const toggleMinimized = useCallback(() => {
    setState((s) => ({ ...s, minimized: !s.minimized }))
  }, [])

  const clearChat = useCallback(() => {
    setState((s) => ({ ...s, messages: [] }))
    setError(null)
  }, [])

  const send = useCallback(async () => {
    const q = input.trim()
    if (!q || pending) return
    setInput('')
    setError(null)
    const userMsg: Msg = { role: 'user', content: q }
    const nextMessages = [...state.messages, userMsg]
    setState((s) => ({ ...s, messages: nextMessages }))
    setPending(true)
    try {
      const qVec = await embedQuery(q, (p) => {
        if (p.status === 'progress' && typeof p.progress === 'number') {
          setModelStatus(`Preparando modelo (una sola vez): ${Math.round(p.progress)}%`)
        } else if (p.status === 'ready') {
          setModelStatus(null)
        }
      })
      setModelStatus(null)
      const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
      const res = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          qVec,
          history: state.messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`${res.status}: ${text.slice(0, 200)}`)
      }
      const data = await res.json() as { answer: string; sources?: Source[] }
      const botMsg: Msg = { role: 'assistant', content: data.answer, sources: data.sources ?? [] }
      setState((s) => ({ ...s, messages: [...nextMessages, botMsg] }))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setPending(false)
    }
  }, [input, pending, state.messages])

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }, [send])

  return (
    <>
      {state.minimized && (
        <button
          type="button"
          className={styles.chatbotFab}
          aria-label="Abrir chat"
          data-testid="chatbot-fab"
          onClick={toggleMinimized}
        >
          <FiMessageCircle aria-hidden="true" />
        </button>
      )}

      <div
        className={styles.chatbot}
        role="region"
        aria-label="Chat"
        data-testid="chatbot-widget"
        hidden={state.minimized}
      >
        <div className={styles.chatbotHeader}>
          <span className={styles.chatbotTitle}>Tutor Atlas</span>
          <div className={styles.chatbotHeaderActions}>
            <button type="button" className={styles.pomodoroIconBtn} onClick={clearChat} aria-label="Nueva conversación" disabled={pending || state.messages.length === 0}>
              <FiRotateCcw />
            </button>
            <button type="button" className={styles.pomodoroIconBtn} onClick={toggleMinimized} aria-label="Minimizar chat">
              <FiMinus />
            </button>
          </div>
        </div>

        <div className={styles.chatbotLog} ref={listRef} data-testid="chatbot-log">
          {state.messages.length === 0 && (
            <p className={styles.chatbotEmpty}>
              Pregúntame sobre Excel, Google Sheets, VBA o Apps Script. Las respuestas se basan en los módulos de Atlas.
            </p>
          )}
          {state.messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? styles.chatbotMsgUser : styles.chatbotMsgBot}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
                <ul className={styles.chatbotSources}>
                  {m.sources.slice(0, 3).map((s, j) => (
                    <li key={j}>
                      <Link to={`/${s.categoriaId}/${s.moduloId}#${s.sectionSlug}`}>
                        {s.moduloTitulo} — {s.sectionTitle}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {pending && <div className={styles.chatbotMsgBot}><em>{modelStatus ?? 'Pensando…'}</em></div>}
          {error && <div className={styles.chatbotError}>Error: {error}</div>}
        </div>

        <form
          className={styles.chatbotForm}
          onSubmit={(e) => { e.preventDefault(); send() }}
        >
          <textarea
            className={styles.chatbotInput}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Escribe tu pregunta…"
            rows={2}
            disabled={pending}
            aria-label="Mensaje"
          />
          <button type="submit" className={`${styles.pomodoroBtn} ${styles.pomodoroBtnPrimary}`} disabled={pending || !input.trim()} aria-label="Enviar">
            <FiSend aria-hidden="true" />
          </button>
        </form>
      </div>
    </>
  )
}
