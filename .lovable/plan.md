# Drift X — Landing + Auth Scaffold

Building the Drift X marketing site with the "Tactical Radar" direction, plus a Lovable Cloud auth scaffold that supports both Companies and Drivers.

## Scope of this build

1. **Landing page** at `/` — full Tactical Radar composition (hero with live radar, dual-audience split, 5-pillar feature grid, vision band, footer).
2. **Auth pages** powered by Lovable Cloud:
   - `/signup` — single form with a role toggle (Company / Driver), email + password.
   - `/login` — email + password.
   - On signup, a profile row is created with the chosen role.
3. **Placeholder dashboards** (gated behind auth):
   - `/dashboard/company` — "coming soon" placeholder, themed.
   - `/dashboard/driver` — "coming soon" placeholder, themed.
   - After login, user is routed to the dashboard matching their role.

Anything beyond this (job dispatching, wallet, admin panel, Google Maps integration, real-time tracking) is out of scope for this turn and will be built in follow-up steps.

## Pages & routes

```text
/                       Landing (Tactical Radar)
/login                  Email + password login
/signup                 Email + password + role pick
/dashboard/company      Protected, role = company
/dashboard/driver       Protected, role = driver
```

Nav and hero CTAs route as follows:
- "Recruit Drivers" / "For Companies" panel → `/signup?role=company`
- "Apply to Drive" / "For Drivers" panel → `/signup?role=driver`
- "Login" nav → `/login`
- "Sign Up" nav → `/signup`

## Design system

Locked from the chosen direction — copied verbatim into `src/styles.css`:
- Background `#050505`, foreground `#ffffff`, muted `#a1a1aa`, accent `#3b82f6`, border `rgba(255,255,255,0.08)`
- Fonts: Inter Tight (display), Inter (body), JetBrains Mono (mono labels)
- Motion: `reveal`, `pulse-dot` keyframes; radar visual in hero

Dark theme is the only theme.

## Technical details

- **Backend:** Lovable Cloud is enabled for auth. A `profiles` table stores `id` (FK to `auth.users`), `role` (`company` | `driver`), `created_at`. RLS: users can read/update only their own profile. A trigger creates the profile on signup using `role` from `raw_user_meta_data`.
- **Auth flow:** `supabase.auth.signUp({ email, password, options: { data: { role }, emailRedirectTo: window.location.origin } })`. Session listener set up before `getSession()`. Auth state lives in router context so route guards can read it.
- **Route guards:** TanStack pathless layout `src/routes/_authenticated.tsx` redirects unauthenticated users to `/login`. Dashboards live under `_authenticated/` and render role-specific content based on the profile row.
- **Files added:** route files for index, login, signup, `_authenticated`, two dashboards; `src/integrations/supabase/client.ts` (already provided by Cloud); a shared `Nav` and `Footer` component; one Supabase migration for the `profiles` table + trigger.

## Out of scope (future turns)

Job dispatching engine, driver onboarding/document upload, wallet & payouts, admin control center, company fleet integration, Google Maps live tracking, push/SMS alerts.
