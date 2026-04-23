import elevenStarSkill from './placeholder-skills/11-star-framework.md?raw';
import appNamingSkill from './placeholder-skills/app-naming.md?raw';
import frontendSlidesSkill from './placeholder-skills/frontend-slides.md?raw';
import promptMasterSkill from './placeholder-skills/prompt-master.md?raw';

export interface SkillEntry {
  id: string;
  name: string;
  content: string;
}

export const PLACEHOLDER_SKILLS: SkillEntry[] = [
  {
    id: '11-star-framework',
    name: '11-star-framework',
    content: elevenStarSkill,
  },
  {
    id: 'frontend-slides',
    name: 'frontend-slides',
    content: frontendSlidesSkill,
  },
  {
    id: 'prompt-master',
    name: 'prompt-master',
    content: promptMasterSkill,
  },
  {
    id: 'app-naming',
    name: 'app-naming',
    content: appNamingSkill,
  },
];
