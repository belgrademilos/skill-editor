import { useEffect } from 'react'
import { useSkillStore } from '../store/skillStore'

export function useBeforeUnload() {
  const isDirty = useSkillStore(s => s.isDirty)
  const view = useSkillStore(s => s.view)

  useEffect(() => {
    if (!isDirty || view !== 'editor') return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, view])
}
