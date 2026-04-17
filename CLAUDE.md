# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Skill Editor — a free, browser-based editor for agent skills. Works with skills for any agent platform (Claude Code, Cursor, ChatGPT, Codex, Manus, and others). Users import `.skill`/`.zip`/`.md` files, edit a single SKILL.md with a source-mode markdown editor, and export them back. Hosted at `skilleditor.com` on Vercel.

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — TypeScript check + Vite production build (`tsc -b && vite build`)
- `npm run lint` — ESLint across the project
- `npm test` — Run all tests once (vitest)
- `npm run test:watch` — Run tests in watch mode
- `npm run preview` — Preview production build locally

## Tech Stack

- React 19, TypeScript, Vite 7, Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **CodeMirror 6** for source-mode markdown editing (custom theme, frontmatter highlighting)
- **Zustand** for state management (single store)
- **Supabase** (`@supabase/supabase-js`) for email/password auth
- **JSZip** for .skill/.zip pack/unpack
- **gray-matter** for YAML frontmatter parsing
- **idb-keyval** for IndexedDB session persistence
- **lucide-react** for icons
- **vitest** + **@testing-library/react** for tests (jsdom environment)

## Architecture

### Single-Screen, Single-File Focus

One screen: the editor. No intro/landing page, no view routing, no history sync — `SkillEditorApp.tsx` mounts `EditorLayout` directly and the library sidebar is always visible. The editor works on a single SKILL.md file at a time (full document, including YAML frontmatter, lives in one string). The left-hand sidebar lists skills in the local library and lets the user switch between them; import and "new skill" actions live in the sidebar header. Deployment uses `vercel.json` with a catch-all SPA rewrite to `index.html`.

### Editor Data Flow

1. User adds a skill via the sidebar "+" menu (upload `.skill`/`.zip`/`.md`, import from GitHub, or start from scratch) → source is resolved into a SKILL.md string
   - Archives (`.skill`/`.zip`): `lib/zip.ts` unpacks → locates SKILL.md
   - Plain `.md`: read directly, validated for required frontmatter
   - GitHub: `loadFromGitHub()` parses the URL, fetches `raw.githubusercontent.com/{owner}/{repo}/{branch}/SKILL.md` from `main` then `master`
2. The full document string (with `---` frontmatter block) is passed directly to CodeMirror
3. `skillName` is derived reactively by parsing frontmatter from the content on each update
4. On export, `store.content` is the complete file — no reassembly needed

### Key Files

- `src/store/skillStore.ts` — Central Zustand store for the **active** skill. Single `content` string (full document), `skillName` derived from frontmatter, session persistence (debounced 1s to IndexedDB). Exposes `loadSkillFile`, `loadMdFile`, `loadFromGitHub`, `restoreSession`, `updateContent`, `setActiveContent`, `startFromScratch`.
- `src/store/skillLibraryStore.ts` — Zustand store for the sidebar library: array of `SkillEntry { id, name, content }`, `selectedId`, `sidebarOpen`. Seeded with placeholder skills. Actions: `selectSkill`, `addSkill`, `removeSkill`, `toggleSidebar`, `updateSelectedContent`.
- `src/SkillEditorApp.tsx` — App entry point. Installs `useBeforeUnload` and restores the persisted session on mount, then renders `EditorLayout`.
- `src/components/EditorLayout.tsx` — Main layout: horizontal flex with `SkillSidebar` + (toolbar + CodeMirror editor), with `SiteFooter` at the bottom.
- `src/components/SkillSidebar.tsx` — Left-hand skills panel. Header with "Skills" label and "+" add menu (Upload / Import GitHub URL), scrollable list of skill entries. Clicking an entry selects it and loads its content into `skillStore` via `setActiveContent`. Footer holds the auth card: signed-out state shows a "Log in" button that opens `AuthModal`; signed-in state shows email + initials avatar + sign-out.
- `src/components/AuthModal.tsx` — Email/password modal with sign-in ↔ sign-up toggle. Calls `useAuth().signIn`/`signUp` and surfaces Supabase errors inline.
- `src/lib/supabase.ts` — Singleton Supabase client created from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Throws at import time if either is missing.
- `src/store/authStore.ts` — Zustand store for `{ user, session, isLoading }`. Exports `initAuth()` which runs once to call `supabase.auth.getSession()` and subscribe to `onAuthStateChange`.
- `src/hooks/useAuth.ts` — Thin hook that ensures `initAuth()` has run and exposes `{ user, session, isLoading, signIn, signUp, signOut }`. Auth methods return Supabase's raw `{ data, error }` so callers can surface errors.
- `src/components/EditorToolbar.tsx` — Minimal toolbar: skill name display, dirty indicator, export dropdown (.skill / .md).
- `src/components/SiteFooter.tsx` — Footer with two cells: left (sidebar-width) holds a GitHub repo link + "WTF is Skill Editor?" button that opens `AboutModal`; right cell shows the live token count from `skillDocumentStats`.
- `src/components/AboutModal.tsx` — Modal triggered from the footer.
- `src/components/Editor/SkillEditor.tsx` — React wrapper around CodeMirror.
- `src/components/Editor/useCodeMirror.ts` — Thin React ↔ CodeMirror 6 bridge. `useRef` + `useEffect`, controlled value sync, save keybinding, history, search.
- `src/components/Editor/theme.ts` — Custom dark theme (`EditorView.theme`) and muted markdown syntax highlighting (`HighlightStyle`). Monospace font, 1.7 line-height, no gutters/line numbers.
- `src/components/Editor/frontmatter.ts` — Lezer markdown parser extension that recognizes YAML frontmatter blocks (`---` delimiters).
- `src/components/Editor/frontmatterDecoration.ts` — `ViewPlugin` that decorates frontmatter lines: keys bold white, values blue-gray (#8C8CA6), delimiters muted gray.
- `src/hooks/useBeforeUnload.ts` — Warns on page unload when `skillStore.isDirty` is true.
- `src/hooks/useKeyboardShortcuts.ts` — App-level shortcuts (e.g. Cmd/Ctrl+S exports as `.skill`).
- `src/lib/zip.ts` — Zip pack/unpack, file tree building, common prefix stripping, download helpers.
- `src/lib/frontmatter.ts` — YAML frontmatter parse/serialize using gray-matter.
- `src/lib/skillDocumentStats.ts` — Token count estimation for the footer display.
- `src/lib/storage.ts` — IndexedDB persistence via idb-keyval.

### Important Patterns

- **Full-document editing**: The store holds the complete SKILL.md content (frontmatter + body). No separation — what the user sees is what gets exported.
- **Reactive skill name**: `skillName` is extracted from frontmatter on every content update via `parseFrontmatter()`. No separate name/description fields to keep in sync.
- **Two-store split**: `skillStore` holds the active document being edited; `skillLibraryStore` holds the sidebar list. Editor changes propagate to the library via `updateSelectedContent`, and sidebar selection writes back into the editor via `setActiveContent`.
- **Session auto-save**: Every mutation calls `persistSession()` which debounces to IndexedDB. On reload, `restoreSession()` recovers the full editing state. Backwards-compatible with old multi-file session format.
- **GitHub import (V1)**: `loadFromGitHub()` accepts a public GitHub repo URL, parses `owner/repo`, and tries `raw.githubusercontent.com/.../main/SKILL.md` then `.../master/SKILL.md`. No auth, no branch selection, no subdirectory support yet. Errors surface as "Invalid link" in the sidebar GitHub import modal.
- **Spellcheck disabled**: The editor sets `spellcheck: false` — no red squiggly underlines.
- **Vite config**: Polyfills `process.env`, `global`, and `Buffer` for gray-matter (Node library) to work in browser.
- **Auth is optional**: Logged-out users can use the full editor with IndexedDB persistence. Sign-in is a sidebar action that unlocks future cloud features — no routes, no gating, no callback pages. Supabase's default localStorage session persists across refreshes. Sign-out does not clear IndexedDB.

## Deployment

- Hosted on Vercel at `skilleditor.com`. `vercel.json` has a catch-all SPA rewrite to `index.html`.
- `@vercel/analytics/react` is included in `App.tsx` but auto-disables outside Vercel — no env vars needed to run locally.
- Supabase is the only external service: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` locally in `.env` and in Vercel. The anon key is public by design; RLS enforces access. "Confirm email" should be OFF in the Supabase dashboard for MVP signup-and-go.
- No private secrets in the codebase. Use `import.meta.env.VITE_*` for any new envs and add placeholders to `.env.example`.

## Open Source

- MIT licensed, single-repo approach. Deployment-specific code (analytics) gracefully no-ops for local/non-Vercel contributors.
- Contributors can clone and run `npm install && npm run dev` without any Vercel setup.

## Roadmap

See `nstextview-browser-plan.md` for the full plan. Phases 1–4 (core editor, theme, markdown highlighting, YAML frontmatter) are complete. Remaining:
- Phase 5: Edit/preview toggle (Cmd+Shift+P)
- Phase 6: Markdown commands & keybindings (Cmd+B/I/E/K, smart list behaviors)
- Phase 7: File I/O & state management refinements
- Phase 8: Polish (dark/light theme, focus management, accessibility, performance)

## SKILL.md Format

See `Skill-MD-Format-Rules.md` for the complete spec. Key points:

- YAML frontmatter with `name` and `description` required
- Name: lowercase, hyphens, digits only, max 64 chars
- Description should explain what the skill does AND when to trigger it
- Body is markdown instructions (the "playbook")
