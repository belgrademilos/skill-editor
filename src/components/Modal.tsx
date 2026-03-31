import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  defaultValue?: string
  placeholder?: string
  submitLabel?: string
  validate?: (value: string) => string | null
  onSubmit: (value: string) => void
  onClose: () => void
}

export function Modal({
  title,
  defaultValue = '',
  placeholder,
  submitLabel = 'Create',
  validate,
  onSubmit,
  onClose,
}: ModalProps) {
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) {
      setError('Name cannot be empty')
      return
    }
    if (validate) {
      const err = validate(trimmed)
      if (err) {
        setError(err)
        return
      }
    }
    onSubmit(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError(null)
            }}
            placeholder={placeholder}
            className={`
              w-full px-3 py-2 text-sm rounded-lg border bg-bg-primary text-text-primary
              placeholder:text-text-muted
              focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
              ${error ? 'border-danger' : 'border-border'}
            `}
          />
          {error && (
            <p className="mt-1.5 text-xs text-danger">{error}</p>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-md text-text-secondary hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm rounded-md bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
