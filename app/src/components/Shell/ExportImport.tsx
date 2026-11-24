import { useRef } from 'react'
import { FiDownload, FiUpload } from 'react-icons/fi'
import { Button } from '../ui/Button/Button'
import { useProgress } from '../../lib/progress/store'

export function ExportImport() {
  const { exportJson, importJson } = useProgress()
  const fileRef = useRef<HTMLInputElement>(null)

  const onExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `atlas-progreso-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onPickFile = () => fileRef.current?.click()

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const result = importJson(text)
    if (!result.ok) alert(`Importar falló: ${result.error}`)
    e.target.value = ''
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={onExport} aria-label="Exportar progreso">
        <FiDownload /> <span className="u-hide-mobile">Exportar</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={onPickFile} aria-label="Importar progreso">
        <FiUpload /> <span className="u-hide-mobile">Importar</span>
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={onFile}
        style={{ display: 'none' }}
      />
    </>
  )
}
