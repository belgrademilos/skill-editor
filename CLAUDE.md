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
- **Zustand** for state management (multiple stores: editor, library, auth)
- **Firebase** v10+ modular SDK (Auth + Firestore) for Google sign-in and per-user cloud sync
- **JSZip** for .skill/.zip pack/unpack
- **gray-matter** for YAML frontmatter parsing
- **idb-keyval** for IndexedDB session persistence (anonymous users only)
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

- `src/store/skillStore.ts` — Central Zustand store for the **active** skill. Single `content` string (full document), `skillName` derived from frontmatter, session persistence (debounced 1s to IndexedDB; skipped when signed in). Exposes `loadSkillFile`, `loadMdFile`, `loadFromGitHub`, `restoreSession`, `updateContent`, `setActiveContent`, `startFromScratch`.
- `src/store/skillLibraryStore.ts` — Zustand store for the sidebar library: `skills: SkillEntry[]`, `selectedId`, plus cloud-mode fields (`mode: 'local' | 'cloud'`, `cloudUid`, `cloudUnsubscribe`, `cloudInitialLoad`). Actions: `selectSkill`, `addSkill`, `removeSkill`, `duplicateSkill`, `updateSelectedContent`, `bindToCloud`, `unbindFromCloud`. Mutators mirror to Firestore when `mode === 'cloud'`; `updateSelectedContent` debounces cloud upserts (~800ms).
- `src/store/placeholderSkills.ts` — The 4 built-in placeholder skills (`PLACEHOLDER_SKILLS`) and the shared `SkillEntry` type. Extracted from `skillLibraryStore` to avoid a circular dep with `lib/cloudSkills.ts`.
- `src/store/authStore.ts` — Zustand store for Firebase auth: `user`, `status: 'loading' | 'signed-in' | 'signed-out'`, `signInWithGoogle` (popup with `signInWithRedirect` fallback when popup is blocked), `signOutUser`. `initAuthListener()` wires `onAuthStateChanged` to update the store. If Firebase env vars are missing, status initializes to `'signed-out'` so the app still runs.
- `src/lib/firebase.ts` — Lazy singleton initializers (`getFirebaseApp`, `getFirebaseAuth`, `getFirebaseDb`), `GoogleAuthProvider` instance, and `isFirebaseConfigured` boolean derived from `VITE_FIREBASE_*` env vars.
- `src/lib/cloudSkills.ts` — Firestore wrappers: `subscribeToUserSkills`, `upsertSkill`, `deleteSkillFromCloud`, `isUserLibraryEmpty`, `seedUserLibrary`. Layout: `users/{uid}/skills/{skillId}`.
- `src/SkillEditorApp.tsx` — App entry point. Calls `initAuthListener()` on mount and subscribes to `authStore` to drive library transitions: on sign-in → `bindToCloud(uid)` + clear IndexedDB; on sign-out → `unbindFromCloud()` + reset to placeholder library; on initial `signed-out` → `restoreSession()` from IndexedDB.
- `src/components/EditorLayout.tsx` — Main layout: horizontal flex with `SkillSidebar` + (toolbar + CodeMirror editor), with `SiteFooter` at the bottom.
- `src/components/SkillSidebar.tsx` — Left-hand skills panel. Header with "Skills" label and "+" add menu (Upload / Import GitHub URL), scrollable list of skill entries. Clicking an entry selects it and loads its content into `skillStore` via `setActiveContent`. Footer is auth-state-driven: loading skeleton, "Sign in with Google" CTA, or avatar + display name + "Sign out"; falls back to a disabled "Sign in (unavailable)" state when Firebase isn't configured.
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
- **Three-store split**: `skillStore` holds the active document being edited; `skillLibraryStore` holds the sidebar list (local or cloud-backed); `authStore` holds the Firebase user + status. Editor changes propagate to the library via `updateSelectedContent`, and sidebar selection writes back into the editor via `setActiveContent`.
- **Library dual-mode**: `skillLibraryStore` operates in `'local'` mode (seeded with `PLACEHOLDER_SKILLS`, persisted to IndexedDB via `skillStore.persistSession`) or `'cloud'` mode (backed by `users/{uid}/skills` in Firestore, real-time sync via `onSnapshot`). `SkillEditorApp` drives the transition by subscribing to `authStore` — on sign-in it calls `bindToCloud(uid)`, which seeds the 4 placeholders if the user's subcollection is empty, then subscribes for live updates; on sign-out it calls `unbindFromCloud()` which resets to the placeholder library. Mutators (`addSkill`, `removeSkill`, `duplicateSkill`, `updateSelectedContent`) route writes to Firestore when in cloud mode; keystroke edits are debounced ~800ms. To avoid clobbering mid-edit content, snapshot reconciliation merges any pending upsert back into incoming cloud state.
- **Session auto-save**: When signed out, every mutation calls `persistSession()` which debounces to IndexedDB. On reload, `restoreSession()` recovers the full editing state. Backwards-compatible with old multi-file session format. When signed in, `persistSession` is a no-op — Firestore is the source of truth, and `SkillEditorApp` calls `clearSession()` on the sign-in transition.
- **GitHub import (V1)**: `loadFromGitHub()` accepts a public GitHub repo URL, parses `owner/repo`, and tries `raw.githubusercontent.com/.../main/SKILL.md` then `.../master/SKILL.md`. No auth, no branch selection, no subdirectory support yet. Errors surface as "Invalid link" in the sidebar GitHub import modal.
- **Spellcheck disabled**: The editor sets `spellcheck: false` — no red squiggly underlines.
- **Vite config**: Polyfills `process.env`, `global`, and `Buffer` for gray-matter (Node library) to work in browser.
- **Firebase config gating**: `isFirebaseConfigured` in `lib/firebase.ts` checks for `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`. When any are missing the sidebar footer shows a disabled "Sign in (unavailable)" state and the app runs in permanent local mode. This keeps the OSS fork-and-run experience working without Firebase credentials.
- **StrictMode + auth listener**: `initAuthListener()` MUST register a fresh `onAuthStateChanged` listener every call — React 19 StrictMode double-invokes effects, and any "already initialized" guard would leave the second invocation with a no-op after the first's cleanup ran, stalling `status` at `'loading'` forever. The cleanup returned from the effect unsubscribes per-registration; multiple listeners briefly overlapping is fine since they mutate the same store.

## Deployment

- Hosted on Vercel at `skilleditor.com`. `vercel.json` has a catch-all SPA rewrite to `index.html`.
- `@vercel/analytics/react` is included in `App.tsx` but auto-disables outside Vercel — no env vars needed to run locally.
- Firebase is optional for running locally. When `VITE_FIREBASE_*` vars are absent the app runs fully client-side with IndexedDB persistence. With them wired up, sign-in unlocks Firestore-backed cloud sync.
- Env vars live in `.env.local` (git-ignored) for local dev and in Vercel Project Settings → Environment Variables for prod/preview. `.env.example` documents the required keys. Firebase web config values are public by design — security is enforced via Firestore rules + authorized domains.
- Required in Firebase Console: Auth provider **Google** enabled; **Authorized domains** must include `localhost`, the Vercel preview pattern, and `skilleditor.com`. Firestore rules should scope access to `users/{uid}`:
  ```
  match /users/{uid}/skills/{skillId} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
  ```

## Open Source

- MIT licensed, single-repo approach. Deployment-specific code (analytics, Firebase) gracefully no-ops for local/non-Vercel contributors.
- Contributors can clone and run `npm install && npm run dev` without any Vercel or Firebase setup. The sidebar will show a disabled sign-in placeholder; the editor works fully against IndexedDB.

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
