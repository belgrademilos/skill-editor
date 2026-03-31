import { describe, it, expect } from 'vitest'
import { buildTree, stripCommonPrefix } from '../zip'

describe('buildTree', () => {
  it('builds a flat file list', () => {
    const files = new Map([
      ['README.md', '# Readme'],
      ['SKILL.md', '# Skill'],
    ])
    const tree = buildTree(files)
    expect(tree).toHaveLength(2)
    // SKILL.md should sort first
    expect(tree[0].name).toBe('SKILL.md')
    expect(tree[0].type).toBe('file')
    expect(tree[1].name).toBe('README.md')
  })

  it('nests files into folders', () => {
    const files = new Map([
      ['src/index.ts', ''],
      ['src/lib/utils.ts', ''],
    ])
    const tree = buildTree(files)
    expect(tree).toHaveLength(1)
    expect(tree[0].name).toBe('src')
    expect(tree[0].type).toBe('folder')
    expect(tree[0].children).toHaveLength(2)
    // index.ts and lib folder
    const childNames = tree[0].children!.map(c => c.name)
    expect(childNames).toContain('index.ts')
    expect(childNames).toContain('lib')
  })

  it('returns empty array for empty map', () => {
    expect(buildTree(new Map())).toEqual([])
  })

  it('always sorts SKILL.md first regardless of nesting', () => {
    const files = new Map([
      ['z-file.md', ''],
      ['SKILL.md', ''],
      ['a-file.md', ''],
    ])
    const tree = buildTree(files)
    expect(tree[0].name).toBe('SKILL.md')
  })
})

describe('stripCommonPrefix', () => {
  it('strips shared directory prefix', () => {
    const files = new Map([
      ['my-skill/SKILL.md', '# Skill'],
      ['my-skill/lib/utils.md', '# Utils'],
    ])
    const result = stripCommonPrefix(files)
    expect(result.has('SKILL.md')).toBe(true)
    expect(result.has('lib/utils.md')).toBe(true)
    expect(result.has('my-skill/SKILL.md')).toBe(false)
  })

  it('does not strip when no common prefix', () => {
    const files = new Map([
      ['SKILL.md', '# Skill'],
      ['README.md', '# Readme'],
    ])
    const result = stripCommonPrefix(files)
    expect(result.has('SKILL.md')).toBe(true)
    expect(result.has('README.md')).toBe(true)
  })

  it('handles single file', () => {
    const files = new Map([['dir/SKILL.md', 'content']])
    const result = stripCommonPrefix(files)
    expect(result.has('SKILL.md')).toBe(true)
  })

  it('handles empty map', () => {
    expect(stripCommonPrefix(new Map())).toEqual(new Map())
  })
})
