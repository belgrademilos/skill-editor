# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Skill Editor — a free, browser-based editor for agent skills. Works with skills for any agent platform (Claude Code, Cursor, ChatGPT, Codex, Manus, and others). Users import `.skill`/`.zip`/`.md` files, edit with a rich markdown editor, and export them back. Hosted at `skilleditor.com` on Vercel.

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — TypeScript check + Vite production build (`tsc -b && vite build`)
- `npm run lint` — ESLint across the project
- `npm test` — Run all tests once (vitest)
- `npm run test:watch` — Run tests in watch mode
- `npm run preview` — Preview production build locally

## Tech Stack

- React 19, TypeScript, Vite 7, Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Novel** (TipTap/ProseMirror-based) for rich markdown editing of `.md` files, via a local fork in `src/novel/`
- **Zustand** for state management (single store for the editor)
- **JSZip** for .skill/.zip pack/unpack
- **gray-matter** for YAML frontmatter parsing
- **idb-keyval** for IndexedDB session persistence
- **lucide-react** for icons
- **vitest** + **@testing-library/react** for tests (jsdom environment)

## Architecture

### View Routing

The editor manages two views (`intro`, `editor`) via Zustand store, with browser history sync via `useViewHistorySync` hook (uses `window.history` directly, no router library). Deployment uses `vercel.json` with a catch-all SPA rewrite to `index.html`. An "About" modal (`AboutModal.tsx`) is triggered from the footer instead of separate pages.

### Editor Data Flow

1. User uploads `.skill`/`.zip` → `lib/zip.ts` unpacks → `skillStore` loads files into a `Map<string, string>`
2. SKILL.md frontmatter is parsed separately (`lib/frontmatter.ts`) and managed in store state; the files map only holds the markdown body
3. On export, frontmatter is re-serialized and injected back into SKILL.md before packing

### Key Files

- `src/store/skillStore.ts` — Central Zustand store. All file CRUD, tab/UI state, session persistence (debounced 1s to IndexedDB). Source of truth for the editor.
- `src/SkillEditorApp.tsx` — Editor entry point (view switching, hooks).
- `src/lib/zip.ts` — Zip pack/unpack, file tree building, common prefix stripping, download helpers
- `src/lib/frontmatter.ts` — YAML frontmatter parse/serialize using gray-matter
- `src/lib/storage.ts` — IndexedDB persistence via idb-keyval
- `src/components/EditorLayout.tsx` — Main layout: resizable sidebar + tabs + editor. Routes files to the correct editor component based on file type.
- `src/components/Editor/NovelEditor.tsx` — Rich markdown editor (Novel/TipTap). Wraps EditorRoot/EditorContent from the local Novel fork, configures extensions, image upload, slash commands, and hosts the TableOfContents overlay.
- `src/components/Editor/BubbleToolbar.tsx` — Floating formatting toolbar (bold, italic, link, etc.) that appears on text selection.
- `src/components/Editor/TableOfContents.tsx` — Floating TOC navigation that overlays the right side of the editor. Extracts H1/H2/H3 headings, highlights the active heading on scroll, and smooth-scrolls to headings on click. Visible on xl+ screens only.
- `src/components/Editor/SlashCommandItems.tsx` — Slash command menu items (headings, lists, images, tables, etc.)
- `src/components/Editor/PlainTextEditor.tsx` — Plain textarea for non-markdown text files
- `src/components/Editor/ImagePreview.tsx` — Read-only preview for image files
- `src/components/Editor/HtmlPreview.tsx` — Read-only preview for HTML files
- `src/components/Editor/SkillHeader.tsx` — Name/description fields shown only when editing SKILL.md
- `src/novel/` — Local fork of the Novel editor framework. Contains EditorRoot, EditorContent, EditorCommand, EditorBubble, extensions (StarterKit, Table, Image, etc.), and plugins.

### Important Patterns

- **Frontmatter separation**: SKILL.md body is stored in the files map; frontmatter lives in `store.frontmatter` (and `frontmatterMap` for multi-SKILL archives). They are only recombined on export via `serializeFrontmatter()`.
- **Editor routing by file type**: `.md` files → NovelEditor, images → ImagePreview, `.html` → HtmlPreview, everything else → PlainTextEditor.
- **Session auto-save**: Every mutation calls `persistSession()` which debounces to IndexedDB. On reload, `restoreSession()` recovers the full editing state.
- **File tree**: Built dynamically from the files map keys via `buildTree()`. SKILL.md is always sorted first.
- **Vite config**: Polyfills `process.env`, `global`, and `Buffer` for gray-matter (Node library) to work in browser.
- **View routing**: Editor has two views (`intro`, `editor`) managed in Zustand store, with browser history sync via `useViewHistorySync` hook. About info is shown in a modal from the footer.

## Deployment

- Hosted on Vercel at `skilleditor.com`. `vercel.json` has a catch-all SPA rewrite to `index.html`.
- `@vercel/analytics/react` is included in `App.tsx` but auto-disables outside Vercel — no env vars needed to run locally.
- No secrets or API keys in the codebase. If Vercel-specific env vars are added later, use `import.meta.env.VITE_*` and add placeholders to `.env.example`.

## Open Source

- MIT licensed, single-repo approach. Deployment-specific code (analytics) gracefully no-ops for local/non-Vercel contributors.
- Contributors can clone and run `npm install && npm run dev` without any Vercel setup.

## SKILL.md Format

See `Skill-MD-Format-Rules.md` for the complete spec. Key points:
- YAML frontmatter with `name` and `description` required
- Name: lowercase, hyphens, digits only, max 64 chars
- Description should explain what the skill does AND when to trigger it
- Body is markdown instructions (the "playbook")
