import { describe, it, expect } from 'vitest'
import { parseFrontmatter, serializeFrontmatter } from '../frontmatter'

describe('parseFrontmatter', () => {
  it('parses name and description from YAML frontmatter', () => {
    const md = `---
name: my-skill
description: A test skill
---

# Hello`
    const result = parseFrontmatter(md)
    expect(result.frontmatter.name).toBe('my-skill')
    expect(result.frontmatter.description).toBe('A test skill')
    expect(result.body).toBe('# Hello')
  })

  it('returns empty strings when frontmatter is missing', () => {
    const result = parseFrontmatter('# Just markdown')
    expect(result.frontmatter.name).toBe('')
    expect(result.frontmatter.description).toBe('')
    expect(result.body).toBe('# Just markdown')
  })

  it('preserves extra frontmatter fields', () => {
    const md = `---
name: test
description: desc
custom_field: value
---

Body`
    const result = parseFrontmatter(md)
    expect(result.frontmatter.custom_field).toBe('value')
  })

  it('handles empty body', () => {
    const md = `---
name: test
description: desc
---
`
    const result = parseFrontmatter(md)
    expect(result.frontmatter.name).toBe('test')
    expect(result.body).toBe('')
  })
})

describe('serializeFrontmatter', () => {
  it('serializes name and description into YAML frontmatter', () => {
    const result = serializeFrontmatter(
      { name: 'my-skill', description: 'A skill' },
      '# Body'
    )
    expect(result).toBe('---\nname: my-skill\ndescription: A skill\n---\n\n# Body')
  })

  it('includes extra fields after name and description', () => {
    const result = serializeFrontmatter(
      { name: 'test', description: 'desc', custom: 'val' },
      'body'
    )
    expect(result).toContain('custom: val')
    const lines = result.split('\n')
    const nameIdx = lines.indexOf('name: test')
    const customIdx = lines.indexOf('custom: val')
    expect(customIdx).toBeGreaterThan(nameIdx)
  })

  it('round-trips with parseFrontmatter', () => {
    const original = { name: 'round-trip', description: 'test round trip' }
    const body = '# Hello\n\nSome content'
    const serialized = serializeFrontmatter(original, body)
    const parsed = parseFrontmatter(serialized)
    expect(parsed.frontmatter.name).toBe(original.name)
    expect(parsed.frontmatter.description).toBe(original.description)
    expect(parsed.body).toBe(body)
  })
})
