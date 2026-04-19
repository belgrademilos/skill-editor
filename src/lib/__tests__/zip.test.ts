import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { packAsSkill, readSkillMdFromArchive, stripCommonPrefix } from '../zip';

describe('readSkillMdFromArchive', () => {
  it('reads SKILL.md from an archive root folder', async () => {
    const zip = new JSZip();
    zip.file('my-skill/SKILL.md', '---\nname: my-skill\ndescription: test\n---\n');
    zip.file('my-skill/README.md', '# Readme');

    const blob = await zip.generateAsync({ type: 'blob' });
    const file = new File([blob], 'my-skill.skill');

    await expect(readSkillMdFromArchive(file)).resolves.toContain('name: my-skill');
  });

  it('falls back to the first markdown file when SKILL.md is absent', async () => {
    const zip = new JSZip();
    zip.file('skill/notes.md', '# Notes');

    const blob = await zip.generateAsync({ type: 'blob' });
    const file = new File([blob], 'notes.zip');

    await expect(readSkillMdFromArchive(file)).resolves.toBe('# Notes');
  });
});

describe('packAsSkill', () => {
  it('exports a SKILL.md inside the skill folder', async () => {
    const blob = await packAsSkill('# Body', 'test-skill');
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());

    await expect(zip.file('test-skill/SKILL.md')?.async('string')).resolves.toBe('# Body');
  });
});

describe('stripCommonPrefix', () => {
  it('strips shared directory prefix', () => {
    const files = new Map([
      ['my-skill/SKILL.md', '# Skill'],
      ['my-skill/lib/utils.md', '# Utils'],
    ]);
    const result = stripCommonPrefix(files);
    expect(result.has('SKILL.md')).toBe(true);
    expect(result.has('lib/utils.md')).toBe(true);
    expect(result.has('my-skill/SKILL.md')).toBe(false);
  });

  it('does not strip when no common prefix', () => {
    const files = new Map([
      ['SKILL.md', '# Skill'],
      ['README.md', '# Readme'],
    ]);
    const result = stripCommonPrefix(files);
    expect(result.has('SKILL.md')).toBe(true);
    expect(result.has('README.md')).toBe(true);
  });

  it('handles single file', () => {
    const files = new Map([['dir/SKILL.md', 'content']]);
    const result = stripCommonPrefix(files);
    expect(result.has('SKILL.md')).toBe(true);
  });

  it('handles empty map', () => {
    expect(stripCommonPrefix(new Map())).toEqual(new Map());
  });
});
