import { useEffect, useCallback } from 'react'
import { useSkillStore } from '../store/skillStore'
import { packAsSkill, downloadBlob } from '../lib/zip'
import { serializeFrontmatter } from '../lib/frontmatter'

export function useKeyboardShortcuts() {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey

    if (!mod) return

    const state = useSkillStore.getState()

    // Cmd+S — Export as .skill
    if (e.key === 's' && !e.shiftKey) {
      e.preventDefault()
      if (state.view !== 'editor') return

      const exportFiles = new Map(state.files)
      for (const [path] of exportFiles) {
        if (path === 'SKILL.md' || path.endsWith('/SKILL.md')) {
          const fm = state.frontmatterMap.get(path)
          if (fm) {
            const body = exportFiles.get(path) || ''
            exportFiles.set(path, serializeFrontmatter(fm, body))
          }
        }
      }
      const name = state.skillName || 'skill'
      packAsSkill(exportFiles, name).then(blob => {
        downloadBlob(blob, `${name}.skill`)
      })
      return
    }

    // Cmd+W — Close active tab
    if (e.key === 'w' && !e.shiftKey) {
      e.preventDefault()
      if (state.activeFile) {
        state.closeTab(state.activeFile)
      }
      return
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
