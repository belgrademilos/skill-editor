# Skill Editor

A free, browser-based editor for agent skills. Works with skills for any agent platform — Claude Code, Cursor, ChatGPT, Codex, Manus, and others. Import `.skill`, `.zip`, or `.md` files, paste a GitHub repo link, edit a single SKILL.md in a source-mode markdown editor, and export it back.

**Live at [skilleditor.com](https://skilleditor.com)**

## Features

- Import `.skill` / `.zip` archives or plain `.md` files via drag-and-drop or file picker
- Import directly from public GitHub repo, file, folder, or raw URLs
- Source-mode markdown editing powered by CodeMirror 6 (custom dark theme, muted syntax highlighting)
- YAML frontmatter highlighting — keys, values, and `---` delimiters styled distinctly
- Skills sidebar for browsing and switching between multiple skills in a local library
- Export as `.skill` archive or single `.md` file
- Auto-save sessions to IndexedDB — pick up where you left off

## Tech Stack

React 19, TypeScript, Vite 7, Tailwind CSS v4, CodeMirror 6, Zustand, JSZip, idb-keyval

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests (vitest) |
| `npm run preview` | Preview production build |

## License

[MIT](LICENSE)
