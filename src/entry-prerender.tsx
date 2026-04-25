import { renderToString } from 'react-dom/server';
import { SkillEditorApp } from './SkillEditorApp';

export function render(): string {
  return renderToString(<SkillEditorApp />);
}
