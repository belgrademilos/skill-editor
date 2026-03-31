import matter from 'gray-matter';

export interface SkillFrontmatter {
  name: string;
  description: string;
  [key: string]: unknown;
}

export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  body: string;
}

export function parseFrontmatter(markdown: string): ParsedSkill {
  const { data, content } = matter(markdown);
  return {
    frontmatter: {
      name: (data.name as string) || '',
      description: (data.description as string) || '',
      ...data,
    },
    body: content.trimStart(),
  };
}

export function serializeFrontmatter(
  frontmatter: SkillFrontmatter,
  body: string
): string {
  const lines: string[] = ['---'];

  // name and description first
  lines.push(`name: ${frontmatter.name}`);
  lines.push(`description: ${frontmatter.description}`);

  // any other fields
  for (const [key, value] of Object.entries(frontmatter)) {
    if (key === 'name' || key === 'description') continue;
    if (value === undefined || value === null) continue;
    if (typeof value === 'string') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else {
      // For complex values, use simple serialization
      lines.push(`${key}: ${JSON.stringify(value)}`);
    }
  }

  lines.push('---');
  lines.push('');
  lines.push(body);

  return lines.join('\n');
}
