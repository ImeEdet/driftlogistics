# Gate Dispatch on Approval + First Delivery CTA

## What you'll see

- The Fleet Console's "Dispatch Engine" tile becomes a real, clickable entry point — but only after your company is **approved**. Before that, it shows a clear locked state explaining what's needed.
- A new **Dispatch** page at `/dashboard/company/dispatch` listing delivery requests (empty at first), with a prominent **"Create your first delivery request"** CTA.
- A guided **New Delivery Request** form covering pickup, dropoff, package details, and scheduling.
- Submitted requests show in the dispatch list with status (pending / assigned / in_transit / delivered / cancelled). Driver assignment isn't part of this turn — that's the next milestone.

## States on the Fleet Console

The Dispatch tile reflects the company's verification status:

```text
not_started / in_progress  -> "Complete onboarding to unlock dispatch"
submitted                  -> "Dispatch unlocks once your business is approved"
rejected                   -> "Onboarding rejected — update & resubmit"
approved                   -> "Open Dispatch -> "  (active link)
```

Direct visits to `/dashboard/company/dispatch` and `/dashboard/company/dispatch/new` while not approved redirect back to the console with a toast.

## Delivery request form

Fields, grouped:

- **Pickup**: contact name, phone, address, scheduled pickup time, notes
- **Dropoff**: contact name, phone, address, notes
- **Package**: type (document / parcel / food / fragile / other), weight (kg), size (S/M/L/XL), declared value (optional)
- **Priority**: standard / express
- Auto: `company_id = auth.uid()`, `status = 'pending'`, `created_at`

## Technical details

**Migration** — adds two enums and one table:

- `delivery_status` enum: `pending`, `assigned`, `in_transit`, `delivered`, `cancelled`
- `package_type` enum: `document`, `parcel`, `food`, `fragile`, `other`
- `public.delivery_requests` table with: pickup/dropoff contact + address + notes, scheduled_pickup_at, package_type, weight_kg, size, declared_value, priority, status, company_id (FK auth.users), created_at, updated_at
- GRANTs to `authenticated` and `service_role`; RLS so a company only sees/creates/edits its own requests (`auth.uid() = company_id`)
- Insert is additionally guarded by a check that the company's `company_profiles.status = 'approved'` (defense in depth alongside UI gating)
- `touch_updated_at` trigger

**Routes** (TanStack file-based):

- `src/routes/_authenticated/dashboard.company.dispatch.tsx` — list + empty state with the "Create your first delivery request" CTA
- `src/routes/_authenticated/dashboard.company.dispatch.new.tsx` — multi-section form

Both routes call `supabase.auth.getUser()` + read `company_profiles.status`; if not `approved`, redirect to `/dashboard/company` with a toast.

**Console update** — `dashboard.company.tsx` reads `status` (already wired), and the existing "Dispatch Engine" tile becomes status-aware: locked label when not approved, active `<Link to="/dashboard/company/dispatch">` when approved.

**Out of scope this turn**: driver assignment, live map tracking, pricing/quotes, notifications, edit/cancel actions on existing requests (status will be read-only `pending`).

## Files

- `supabase/migrations/<ts>_delivery_requests.sql` (new)
- `src/routes/_authenticated/dashboard.company.tsx` (edit — make Dispatch tile status-aware)
- `src/routes/_authenticated/dashboard.company.dispatch.tsx` (new)
- `src/routes/_authenticated/dashboard.company.dispatch.new.tsx` (new)
