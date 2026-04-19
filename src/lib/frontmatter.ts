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
  const normalized = markdown.replace(/^\uFEFF/, '');
  const lines = normalized.split(/\r?\n/);

  if (lines[0]?.trim() !== '---') {
    return {
      frontmatter: { name: '', description: '' },
      body: normalized.trimStart(),
    };
  }

  const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (endIndex === -1) {
    return {
      frontmatter: { name: '', description: '' },
      body: normalized.trimStart(),
    };
  }

  const data = parseYamlBlock(lines.slice(1, endIndex));
  const content = lines.slice(endIndex + 1).join('\n');

  return {
    frontmatter: {
      ...data,
      name: typeof data.name === 'string' ? data.name : '',
      description: typeof data.description === 'string' ? data.description : '',
    },
    body: content.trimStart(),
  };
}

function parseYamlBlock(lines: string[]): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    if (!key) continue;

    const value = line.slice(separator + 1).trim();
    data[key] = parseScalar(value);
  }

  return data;
}

function parseScalar(value: string): unknown {
  if (value === '') return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;

  const numberValue = Number(value);
  if (value.trim() !== '' && Number.isFinite(numberValue) && String(numberValue) === value) {
    return numberValue;
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  if (
    (value.startsWith('{') && value.endsWith('}')) ||
    (value.startsWith('[') && value.endsWith(']'))
  ) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
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
