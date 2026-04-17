import { SkillEditorApp } from './SkillEditorApp';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      <SkillEditorApp />
      <Analytics />
    </>
  );
}
