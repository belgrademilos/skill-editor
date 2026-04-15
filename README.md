# Skill Editor

A free, browser-based editor for agent skills. Works with skills for any agent platform — Claude Code, Cursor, ChatGPT, Codex, Manus, and others. Import `.skill`, `.zip`, or `.md` files, paste a GitHub repo link, edit a single SKILL.md in a source-mode markdown editor, and export it back.

**Live at [skilleditor.com](https://skilleditor.com)**

## Features

- Import `.skill` / `.zip` archives or plain `.md` files via drag-and-drop or file picker
- Import directly from a public GitHub repo by pasting the repo URL
- Source-mode markdown editing powered by CodeMirror 6 (custom dark theme, muted syntax highlighting)
- YAML frontmatter highlighting — keys, values, and `---` delimiters styled distinctly
- Skills sidebar for browsing and switching between multiple skills in a local library
- Export as `.skill` archive or single `.md` file
- Auto-save sessions to IndexedDB — pick up where you left off

## Tech Stack

React 19, TypeScript, Vite 7, Tailwind CSS v4, CodeMirror 6, Zustand, JSZip, gray-matter, idb-keyval

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment

Create a `.env.local` with:

```bash
VITE_WORKOS_CLIENT_ID=your_workos_client_id
# Optional in production if you have a WorkOS custom auth domain:
VITE_WORKOS_API_HOSTNAME=auth.yourdomain.com
```

If `VITE_WORKOS_API_HOSTNAME` is not set, the app uses AuthKit `devMode` so the client-only login flow can persist its session without a custom auth domain.

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
