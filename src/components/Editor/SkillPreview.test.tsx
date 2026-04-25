import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkillPreview } from './SkillPreview';

describe('SkillPreview', () => {
  it('separates frontmatter from rendered markdown body', () => {
    render(
      <SkillPreview
        content={`---
name: preview-skill
description: Helps preview skills.
platform: codex
---

# Playbook

Body copy.`}
      />
    );

    expect(screen.getByText('name:')).toBeInTheDocument();
    expect(screen.getByText('preview-skill')).toBeInTheDocument();
    expect(screen.getByText('description:')).toBeInTheDocument();
    expect(screen.getByText('Helps preview skills.')).toBeInTheDocument();
    expect(screen.getByText('platform:')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Playbook' })).toBeInTheDocument();
    expect(screen.queryByText('---')).not.toBeInTheDocument();
  });

  it('renders common markdown structures used in skills', () => {
    render(
      <SkillPreview
        content={`---
name: preview-skill
description: Helps preview skills.
---

## Steps

- First bullet
  - Nested bullet
1. First number
2. Second number

- [x] Done task
- [ ] Open task

[Skill Editor](https://skilleditor.com)

\`inlineCode\`

\`\`\`ts
const ready = true;
\`\`\`

| Key | Value |
| --- | --- |
| name | skill |
`}
      />
    );

    const lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(4);
    expect(within(lists[0]).getByText('First bullet')).toBeInTheDocument();
    expect(within(lists[1]).getByText('Nested bullet')).toBeInTheDocument();
    expect(within(lists[2]).getByText('First number')).toBeInTheDocument();
    expect(within(lists[2]).getByText('Second number')).toBeInTheDocument();

    const taskCheckboxes = screen.getAllByRole('checkbox');
    expect(taskCheckboxes).toHaveLength(2);
    expect(taskCheckboxes[0]).toBeChecked();
    expect(taskCheckboxes[1]).not.toBeChecked();
    expect(screen.getByText('Done task')).toBeInTheDocument();
    expect(screen.getByText('Open task')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skill Editor' })).toHaveAttribute(
      'href',
      'https://skilleditor.com'
    );
    expect(screen.getByText('inlineCode')).toBeInTheDocument();
    expect(screen.getByText('const ready = true;')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Key' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'skill' })).toBeInTheDocument();
  });
});
