# Implementation Plan: Add WorkOS AuthKit + Supabase Auth to Skill Editor

## Objective

Add authentication to Skill Editor using **WorkOS AuthKit** (client-only mode) and **Supabase**.

This pass should:
- Support Google OAuth through the hosted WorkOS auth flow
- Support email/password sign-in and sign-up through the same hosted WorkOS auth flow
- Replace the existing placeholder auth card in the sidebar with a working signed-out / signed-in UI
- Show a small signed-in avatar in the editor toolbar
- Upsert the authenticated user into Supabase `profiles`

This pass should **not** implement remote skill syncing yet. Local editing and IndexedDB persistence should continue to work exactly as they do today.

---

## Current App Structure

Skill Editor is a React 19 + Vite 7 + Tailwind v4 SPA deployed on Vercel at `skilleditor.com`. There is no backend server in this repo.

The current app structure is:
- `src/SkillEditorApp.tsx` restores local session state and renders `EditorLayout` directly
- `src/components/EditorLayout.tsx` renders the main split view: `SkillSidebar` on the left, editor pane on the right
- `src/components/SkillSidebar.tsx` contains the current placeholder auth card at the bottom of the sidebar
- `src/components/EditorToolbar.tsx` is the top toolbar in the editor pane
- `src/components/SiteFooter.tsx` is only the token-count footer for the editor pane

Important: there is **no** `IntroScreen.tsx`, **no** intro/editor route switching, and **no** `TopBar.tsx` in the current repo. Do not build against those assumptions.

---

## Already Configured

These are already set up and do not need to be created as part of this work:
- WorkOS account with Google social login enabled
- WorkOS hosted auth configured with client sessions
- WorkOS redirect URIs configured for `/callback`
- Supabase project configured to trust WorkOS-issued tokens
- Supabase JWT template set with:
  - `aud: "authenticated"`
  - `role: "authenticated"`
- Supabase `profiles` and `skills` tables created with RLS policies
- Environment variables available locally and in Vercel:
  - `VITE_WORKOS_CLIENT_ID`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

Note: `@workos-inc/authkit-react` and `@supabase/supabase-js` are already present in `package.json`. No dependency installation step is required unless versions need to be refreshed deliberately.

---

## Supabase Schema

```sql
-- profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workos_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: auth.jwt() ->> 'sub' = workos_user_id (SELECT, INSERT, UPDATE)

-- skills table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,          -- workos_user_id
  name TEXT NOT NULL,
  content TEXT NOT NULL,          -- full SKILL.md content
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);
-- RLS: auth.jwt() ->> 'sub' = user_id (SELECT, INSERT, UPDATE, DELETE)
```

For this pass, only `profiles` must be written to.

---

## Files In Scope

| File | Role in this plan |
|------|-------------------|
| `src/main.tsx` | Wrap app with `AuthKitProvider` |
| `src/App.tsx` | No major changes expected; app shell remains the same |
| `src/SkillEditorApp.tsx` | Call profile-sync hook after auth is available |
| `src/components/SkillSidebar.tsx` | Replace placeholder auth card with working signed-out / signed-in UI |
| `src/components/EditorToolbar.tsx` | Add small signed-in avatar indicator |
| `src/components/SiteFooter.tsx` | Leave as token-count footer; do not move auth UI here |
| `src/hooks/useSupabase.ts` | New hook for creating a Supabase client with WorkOS access tokens |
| `src/hooks/useProfileSync.ts` | New hook to upsert authenticated users into `profiles` |
| `src/lib/supabase.ts` | New Supabase client wiring |
| `src/globals.css` | Only if minor styling support is needed |

---

## Implementation Steps

### 1. Wrap the app with `AuthKitProvider`

In `src/main.tsx`, wrap `<App />` with `AuthKitProvider` using `VITE_WORKOS_CLIENT_ID`.

Use the current app entry as-is; do not introduce any router or extra auth page.

---

### 2. Add Supabase client wiring

Create `src/lib/supabase.ts`.

It should:
- Export a helper for creating a Supabase client
- Read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Pass the WorkOS access token to Supabase using the client’s async access-token option

Create `src/hooks/useSupabase.ts`.

It should:
- Read `getAccessToken` from `useAuth()` in `@workos-inc/authkit-react`
- Return a memoized Supabase client instance

Keep this hook small and focused; it should only solve auth-aware client creation.

---

### 3. Add profile sync on login

Create `src/hooks/useProfileSync.ts`.

Behavior:
- When `user` from `useAuth()` becomes available, upsert a row into `profiles`
- Use Supabase from `useSupabase()`
- Upsert on `workos_user_id`

Field mapping:
- `user.id` -> `workos_user_id`
- `user.email` -> `email`
- `user.firstName` + `user.lastName` -> `display_name`
- `user.profilePictureUrl` -> `avatar_url`

Call this hook in `src/SkillEditorApp.tsx`.

It should run quietly in the background and should not block rendering.

---

### 4. Replace the sidebar auth card in `SkillSidebar.tsx`

The current placeholder auth UI already lives at the bottom of `src/components/SkillSidebar.tsx`. That is the UI to replace.

Do **not** move auth into `SiteFooter.tsx`.

#### Logged-out state

Show a compact version of the existing card that:
- Keeps the current “Save your skills” framing
- Explains that signing in enables a personal cloud-backed skill library later
- Includes a primary auth action that calls `signIn()`

That single hosted auth entry point should cover:
- Google OAuth
- Email/password sign-in
- Email/password sign-up

No separate local sign-up form should be built in this repo.

#### Logged-in state

Replace the CTA card with a signed-in account card that shows:
- Avatar from `user.profilePictureUrl`, with a fallback to initials or a generic icon
- User email
- A `Sign out` action that calls `signOut()`

Design guidance:
- Keep it compact and visually consistent with the current sidebar card
- Use existing tokens/classes such as `bg-bg-surface`, `border-border`, `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Truncate long email addresses cleanly

Behavior guidance:
- `signOut()` should clear the WorkOS auth session and return the UI to the signed-out state
- **Do not clear IndexedDB editor state on sign-out**
- Logged-out users should still be able to use the editor exactly as before

If `useAuth()` is still loading, render the logged-out presentation rather than blocking the sidebar.

---

### 5. Add a small signed-in avatar to `EditorToolbar.tsx`

Update `src/components/EditorToolbar.tsx`.

When logged in:
- Show a small circular avatar, approximately `24x24`
- Place it in the right-side control area near the export menu
- No dropdown or expanded account menu is needed in the toolbar

When logged out:
- Show nothing extra in the toolbar

This is only a visual signed-in indicator for the editor pane.

---

### 6. Handle `/callback` without new routes

The app already uses a catch-all SPA rewrite in `vercel.json`, so `/callback` will load the app shell.

Do not add:
- A router
- A dedicated callback page
- Extra route state

If AuthKit requires any callback-specific provider configuration, keep it minimal and compatible with the existing single-screen SPA structure.

Configured redirect URIs are:
- `https://skilleditor.com/callback`
- `http://localhost:5173/callback`

---

## What Not To Build

- No new screens or pages
- No intro view, account settings view, or profile management page
- No custom email/password form inside the app
- No skill sync / stash sync implementation yet
- No changes to how local IndexedDB draft persistence works
- No auth UI inside `SiteFooter.tsx`

---

## Design Notes

Use the existing theme tokens from `src/globals.css`:

```txt
--color-bg-primary: #1a1a1a
--color-bg-sidebar: #141414
--color-bg-surface: #242424
--color-bg-hover: #2a2a2a
--color-bg-active: #333333
--color-border: #333333
--color-text-primary: #e5e5e5
--color-text-secondary: #999999
--color-text-muted: #666666
--color-accent: #D97757
--color-accent-hover: #E08A6D
```

Prefer existing Tailwind utility usage already present in `SkillSidebar.tsx` and `EditorToolbar.tsx`.

---

## Verification Checklist

After implementation, verify:

1. `npm run build` succeeds
2. Clicking the sidebar `Sign in` action opens the WorkOS hosted auth flow
3. The hosted auth flow supports both Google OAuth and email/password sign-in/sign-up
4. After authenticating, the sidebar card changes to the signed-in account view
5. After authenticating, `EditorToolbar` shows a small avatar indicator
6. A row is created or updated in Supabase `profiles`
7. Signing out returns the UI to the logged-out state
8. Signing out does **not** clear local IndexedDB editor state
9. Logged-out users can still use the editor normally
10. Refreshing while signed in preserves the auth session
