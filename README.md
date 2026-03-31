# Skill Editor

A free, browser-based editor for agent skills. Works with skills for any agent platform — Claude Code, Cursor, ChatGPT, Codex, Manus, and others. Import `.skill`, `.zip`, or `.md` files, edit with a rich markdown editor, and export them back.

**Live at [skilleditor.com](https://skilleditor.com)**

## Features

- Import and export `.skill` / `.zip` archives
- Rich markdown editing powered by TipTap (ProseMirror)
- YAML frontmatter editing for skill metadata (name, description)
- Multi-file support with tabbed editing and a resizable file tree sidebar
- Image preview, HTML preview, and plain text editing for non-markdown files
- Auto-save sessions to IndexedDB — pick up where you left off

## Tech Stack

React 19, TypeScript, Vite 7, Tailwind CSS v4, TipTap, Zustand, JSZip

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
