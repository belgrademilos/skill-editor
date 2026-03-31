import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSkillStore } from '../skillStore'

// Mock IndexedDB storage
vi.mock('../../lib/storage', () => ({
  saveSession: vi.fn(),
  loadSession: vi.fn().mockResolvedValue(null),
  clearSession: vi.fn(),
}))

function resetStore() {
  useSkillStore.setState({
    skillName: '',
    skillDescription: '',
    frontmatter: null,
    frontmatterMap: new Map(),
    files: new Map(),
    fileTree: [],
    isDirty: false,
    activeFile: null,
    openTabs: [],
    view: 'intro',
    contextMenu: null,
  })
}

describe('skillStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('createFile', () => {
    it('adds a new file to the files map', () => {
      const store = useSkillStore.getState()
      store.createFile('', 'test.md')
      const state = useSkillStore.getState()
      expect(state.files.has('test.md')).toBe(true)
      expect(state.files.get('test.md')).toBe('')
      expect(state.isDirty).toBe(true)
    })

    it('creates file in a subdirectory', () => {
      const store = useSkillStore.getState()
      store.createFile('lib', 'utils.md')
      expect(useSkillStore.getState().files.has('lib/utils.md')).toBe(true)
    })

    it('does not overwrite existing file', () => {
      useSkillStore.setState({
        files: new Map([['test.md', 'existing content']]),
      })
      useSkillStore.getState().createFile('', 'test.md')
      expect(useSkillStore.getState().files.get('test.md')).toBe('existing content')
    })

    it('opens the new file as active tab', () => {
      useSkillStore.getState().createFile('', 'new.md')
      const state = useSkillStore.getState()
      expect(state.activeFile).toBe('new.md')
      expect(state.openTabs).toContain('new.md')
    })
  })

  describe('createFolder', () => {
    it('creates a .gitkeep placeholder', () => {
      useSkillStore.getState().createFolder('', 'docs')
      expect(useSkillStore.getState().files.has('docs/.gitkeep')).toBe(true)
    })

    it('creates nested folder', () => {
      useSkillStore.getState().createFolder('src', 'lib')
      expect(useSkillStore.getState().files.has('src/lib/.gitkeep')).toBe(true)
    })
  })

  describe('updateFile', () => {
    it('updates file content and marks dirty', () => {
      useSkillStore.setState({ files: new Map([['test.md', 'old']]) })
      useSkillStore.getState().updateFile('test.md', 'new content')
      const state = useSkillStore.getState()
      expect(state.files.get('test.md')).toBe('new content')
      expect(state.isDirty).toBe(true)
    })
  })

  describe('deleteFile', () => {
    it('removes the file from the map', () => {
      useSkillStore.setState({
        files: new Map([['a.md', 'a'], ['b.md', 'b']]),
        openTabs: ['a.md', 'b.md'],
        activeFile: 'a.md',
      })
      useSkillStore.getState().deleteFile('a.md')
      const state = useSkillStore.getState()
      expect(state.files.has('a.md')).toBe(false)
      expect(state.openTabs).not.toContain('a.md')
    })

    it('removes folder and all children', () => {
      useSkillStore.setState({
        files: new Map([
          ['src/a.ts', ''],
          ['src/b.ts', ''],
          ['README.md', ''],
        ]),
      })
      useSkillStore.getState().deleteFile('src')
      const state = useSkillStore.getState()
      expect(state.files.has('src/a.ts')).toBe(false)
      expect(state.files.has('src/b.ts')).toBe(false)
      expect(state.files.has('README.md')).toBe(true)
    })
  })

  describe('renameFile', () => {
    it('renames file and updates tabs', () => {
      useSkillStore.setState({
        files: new Map([['old.md', 'content']]),
        openTabs: ['old.md'],
        activeFile: 'old.md',
      })
      useSkillStore.getState().renameFile('old.md', 'new.md')
      const state = useSkillStore.getState()
      expect(state.files.has('new.md')).toBe(true)
      expect(state.files.has('old.md')).toBe(false)
      expect(state.activeFile).toBe('new.md')
      expect(state.openTabs).toContain('new.md')
    })

    it('renames folder and all children', () => {
      useSkillStore.setState({
        files: new Map([
          ['src/a.ts', 'a'],
          ['src/b.ts', 'b'],
        ]),
      })
      useSkillStore.getState().renameFile('src', 'lib')
      const state = useSkillStore.getState()
      expect(state.files.has('lib/a.ts')).toBe(true)
      expect(state.files.has('lib/b.ts')).toBe(true)
      expect(state.files.has('src/a.ts')).toBe(false)
    })
  })

  describe('duplicateFile', () => {
    it('creates a copy with -copy suffix', () => {
      useSkillStore.setState({ files: new Map([['test.md', 'content']]) })
      useSkillStore.getState().duplicateFile('test.md')
      const state = useSkillStore.getState()
      expect(state.files.has('test-copy.md')).toBe(true)
      expect(state.files.get('test-copy.md')).toBe('content')
    })
  })

  describe('setActiveFile', () => {
    it('opens file in tabs if not already open', () => {
      useSkillStore.getState().setActiveFile('new.md')
      const state = useSkillStore.getState()
      expect(state.activeFile).toBe('new.md')
      expect(state.openTabs).toContain('new.md')
    })

    it('does not duplicate tab', () => {
      useSkillStore.setState({ openTabs: ['a.md'] })
      useSkillStore.getState().setActiveFile('a.md')
      expect(useSkillStore.getState().openTabs).toEqual(['a.md'])
    })
  })

  describe('closeTab', () => {
    it('removes tab and switches to next', () => {
      useSkillStore.setState({
        openTabs: ['a.md', 'b.md', 'c.md'],
        activeFile: 'b.md',
      })
      useSkillStore.getState().closeTab('b.md')
      const state = useSkillStore.getState()
      expect(state.openTabs).toEqual(['a.md', 'c.md'])
      expect(state.activeFile).toBe('c.md')
    })

    it('sets active to null when last tab closed', () => {
      useSkillStore.setState({ openTabs: ['a.md'], activeFile: 'a.md' })
      useSkillStore.getState().closeTab('a.md')
      expect(useSkillStore.getState().activeFile).toBeNull()
    })
  })

  describe('closeSkill', () => {
    it('resets all state', () => {
      useSkillStore.setState({
        skillName: 'test',
        files: new Map([['a.md', 'content']]),
        view: 'editor',
        isDirty: true,
      })
      useSkillStore.getState().closeSkill()
      const state = useSkillStore.getState()
      expect(state.skillName).toBe('')
      expect(state.files.size).toBe(0)
      expect(state.view).toBe('intro')
      expect(state.isDirty).toBe(false)
    })
  })

  describe('updateSkillName', () => {
    it('updates name and frontmatter', () => {
      useSkillStore.setState({
        frontmatter: { name: 'old', description: 'desc' },
      })
      useSkillStore.getState().updateSkillName('new-name')
      const state = useSkillStore.getState()
      expect(state.skillName).toBe('new-name')
      expect(state.frontmatter?.name).toBe('new-name')
    })
  })
})
