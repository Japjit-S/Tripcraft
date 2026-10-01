# Supabase Implementation Plan — Full-Stack Persistence, Auth & Weather Caching

**Target Workspace:** `d:\GDG dev task\antigravity working folder`  
**Objective:** Execute the complete Supabase integration (PostgreSQL schema, Row-Level Security, `@supabase/ssr` Next.js 15 Authentication, Database-backed Weather Cache, and CRUD API routes) on the first try with zero regressions to the existing 26 passing engine tests or UI features.

---

## 0. Agent Operating Protocol & Codebase Standards

1. **Communication:** Address the user as **"Master"**. Be concise, direct, and technically accurate.
2. **Code Cleanliness (`AGENTS.md`):**
   - No unused imports, dead variables, commented-out test code, or stray `console.log` statements.
   - Strict TypeScript (`npx tsc --noEmit` must pass with 0 errors). Avoid `any`.
   - Keep files modular (< 250 lines). Put Supabase helpers in `src/lib/supabase/` and keep UI components presentational.
3. **Existing Test Suite:** Never break existing unit tests (`npm test` runs `tsx --test tests/engine/*.test.ts`).

---

## 1. Critical Edge Cases Solved Upfront

| # | Edge Case / Pitfall | Mandatory Implementation Rule |
| :--- | :--- | :--- |
| **1** | **Missing `DecisionLogDrawer` data on saved trips** | Standard roadmap tables omit `auditLog`, `warnings`, and `feasibilityStatus`. We add `audit_log JSONB`, `warnings JSONB`, and `feasibility_status TEXT` to `itineraries` for **100% lossless round-trip serialization**. |
| **2** | **Broken Map markers on saved trips** | Standard `itinerary_items` omits coordinates and engine metadata. We store `latitude`, `longitude`, `candidate_id`, `intensity`, `typical_duration_min`, `is_flex`, `flex_reason`, `score_breakdown JSONB`, and `sort_order` on `itinerary_items`. |
| **3** | **Foreign Key crash when new user saves first trip** | If `itineraries.user_id` references `profiles(id)` and the profile row wasn't created yet, saving crashes. We: (a) attach a Postgres trigger `on_auth_user_created` to auto-create `profiles`, and (b) reference `auth.users(id) ON DELETE CASCADE` directly. |
| **4** | **Next.js 15 `cookies()` async runtime crash** | Next.js 15 made `cookies()` asynchronous. `src/lib/supabase/server.ts` MUST use `const cookieStore = await cookies()` with `@supabase/ssr`. |
| **5** | **Duplicate cities in `destinations` table** | Use a deterministic text primary key `id` (e.g. `openmeteo:1269515` or normalized `city-country_code`) with `ON CONFLICT (id) DO UPDATE` so geocoding Jaipur multiple times maintains 1 canonical row. |
| **6** | **RLS blocking public `weather_cache` writes** | Since `POST /api/itineraries/generate` works for both guests and signed-in users, `destinations` and `weather_cache` have RLS policies allowing `anon` and `authenticated` read/upsert, while `itineraries`, `itinerary_days`, `itinerary_items`, and `itinerary_day_notes` are strictly locked to `auth.uid() = user_id`. |
| **7** | **Missing `.env.local` graceful degradation** | Create a helper `isSupabaseConfigured(): boolean`. If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, gracefully fall back to `tripStore.ts` (`localStorage`) + in-memory weather cache instead of crashing with a 500 error. |

---

## 2. Complete PostgreSQL Schema & RLS (`supabase/schema.sql`)

Save this exact SQL script to `supabase/schema.sql` in the project root so Master can paste and run it in the Supabase SQL Editor:

```sql
-- Enable UUID generation
create extension if not exists "pgcrypto";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Traveller'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. DESTINATIONS
create table if not exists public.destinations (
  id text primary key, -- e.g. "openmeteo:1269515" or "jaipur-in"
  city text not null,
  country text not null,
  country_code text,
  admin1 text,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now()
);

alter table public.destinations enable row level security;

create policy "Destinations are publicly readable"
  on public.destinations for select
  to anon, authenticated
  using (true);

create policy "Destinations can be upserted by server/clients"
  on public.destinations for insert
  to anon, authenticated
  with check (true);

create policy "Destinations can be updated"
  on public.destinations for update
  to anon, authenticated
  using (true);

-- 3. WEATHER CACHE
create table if not exists public.weather_cache (
  id uuid primary key default gen_random_uuid(),
  destination_id text not null references public.destinations(id) on delete cascade,
  forecast_date date not null,
  payload jsonb not null, -- Stores DayForecast object
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (destination_id, forecast_date)
);

create index if not exists idx_weather_cache_lookup
  on public.weather_cache (destination_id, forecast_date);

alter table public.weather_cache enable row level security;

create policy "Weather cache is publicly readable"
  on public.weather_cache for select
  to anon, authenticated
  using (true);

create policy "Weather cache can be written"
  on public.weather_cache for insert
  to anon, authenticated
  with check (true);

create policy "Weather cache can be updated"
  on public.weather_cache for update
  to anon, authenticated
  using (true);

-- 4. FEASIBILITY RULES
create table if not exists public.feasibility_rules (
  id text primary key,
  scope text not null, -- city, country_code, or '*'
  rule_type text not null check (rule_type in ('geopolitical', 'advisory', 'seasonal', 'weather')),
  severity text not null check (severity in ('info', 'caution', 'block')),
  message text not null,
  source_url text,
  reviewed_at date not null default current_date
);

alter table public.feasibility_rules enable row level security;

create policy "Feasibility rules are publicly readable"
  on public.feasibility_rules for select
  to anon, authenticated
  using (true);

-- 5. ITINERARIES (Owner-protected via RLS)
create table if not exists public.itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination_id text not null references public.destinations(id),
  persona text not null check (persona in ('Backpacker', 'Culture Seeker', 'Comfort Traveller', 'Family')),
  start_date date not null,
  days integer not null check (days between 1 and 7),
  origin_city text not null default '',
  arrival_mode text not null default 'flight' check (arrival_mode in ('flight', 'train', 'bus')),
  arrival_at text not null default '10:00 AM',
  feasibility_status text not null default 'PASSED' check (feasibility_status in ('PASSED', 'CAUTION', 'BLOCKED')),
  warnings jsonb not null default '[]'::jsonb,
  audit_log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_itineraries_user_id on public.itineraries(user_id);

alter table public.itineraries enable row level security;

create policy "Users can read own itineraries"
  on public.itineraries for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create own itineraries"
  on public.itineraries for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own itineraries"
  on public.itineraries for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own itineraries"
  on public.itineraries for delete
  to authenticated
  using (auth.uid() = user_id);

-- 6. ITINERARY DAYS
create table if not exists public.itinerary_days (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 7),
  date date not null,
  weather_state text not null default 'CLEAR',
  weather_summary text not null,
  is_estimated_weather boolean not null default false,
  unique (itinerary_id, day_number)
);

alter table public.itinerary_days enable row level security;

create policy "Users can manage own itinerary days"
  on public.itinerary_days for all
  to authenticated
  using (
    exists (
      select 1 from public.itineraries i
      where i.id = itinerary_days.itinerary_id
      and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.itineraries i
      where i.id = itinerary_days.itinerary_id
      and i.user_id = auth.uid()
    )
  );

-- 7. ITINERARY ITEMS
create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  itinerary_day_id uuid not null references public.itinerary_days(id) on delete cascade,
  candidate_id text,
  slot text not null check (slot in ('MORNING', 'AFTERNOON', 'EVENING')),
  sort_order integer not null default 0,
  title text not null,
  category text not null,
  reason text not null,
  indoor boolean not null default false,
  intensity text not null default 'MEDIUM',
  typical_duration_min integer not null default 90,
  latitude double precision,
  longitude double precision,
  is_flex boolean not null default false,
  flex_reason text,
  score_breakdown jsonb
);

alter table public.itinerary_items enable row level security;

create policy "Users can manage own itinerary items"
  on public.itinerary_items for all
  to authenticated
  using (
    exists (
      select 1 from public.itinerary_days d
      join public.itineraries i on i.id = d.itinerary_id
      where d.id = itinerary_items.itinerary_day_id
      and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.itinerary_days d
      join public.itineraries i on i.id = d.itinerary_id
      where d.id = itinerary_items.itinerary_day_id
      and i.user_id = auth.uid()
    )
  );

-- 8. ITINERARY DAY NOTES
create table if not exists public.itinerary_day_notes (
  id uuid primary key default gen_random_uuid(),
  itinerary_day_id uuid not null references public.itinerary_days(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.itinerary_day_notes enable row level security;

create policy "Users can manage own day notes"
  on public.itinerary_day_notes for all
  to authenticated
  using (
    exists (
      select 1 from public.itinerary_days d
      join public.itineraries i on i.id = d.itinerary_id
      where d.id = itinerary_day_notes.itinerary_day_id
      and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.itinerary_days d
      join public.itineraries i on i.id = d.itinerary_id
      where d.id = itinerary_day_notes.itinerary_day_id
      and i.user_id = auth.uid()
    )
  );
```

---

## 3. Step-by-Step Implementation Breakdown

### Step 1: Install Packages & Create Supabase Clients (`src/lib/supabase/`)
1. Run `npm install @supabase/supabase-js @supabase/ssr`.
2. **[NEW] `src/lib/supabase/config.ts`**:
   - Export `isSupabaseConfigured(): boolean` checking `Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)`.
3. **[NEW] `src/lib/supabase/client.ts`**:
   - Browser client using `createBrowserClient` from `@supabase/ssr`.
4. **[NEW] `src/lib/supabase/server.ts`**:
   - Async server client using `createServerClient` from `@supabase/ssr` and `const cookieStore = await cookies()` from `next/headers`.
5. **[NEW] `src/middleware.ts`**:
   - Refresh session cookies via `@supabase/ssr` when `isSupabaseConfigured()` is true.

### Step 2: Database-Backed Weather Cache (`src/lib/providers/weatherProvider.ts`)
1. Keep the existing in-memory `Map` as an L1 cache so existing unit tests (`tests/engine/weatherProvider.test.ts`) continue to run offline in milliseconds with zero changes.
2. When `isSupabaseConfigured()` is true and L1 misses:
   - Upsert the `Destination` row in `public.destinations`.
   - Query `public.weather_cache` for `destination_id` and `forecast_date` in `[startDate ... endDate]` where `expires_at > now()`.
   - If all requested days are present and valid in DB cache, return them directly without calling Open-Meteo.
   - On cache miss, fetch from Open-Meteo, write to L1 `Map`, and upsert rows into `public.weather_cache` with `expires_at = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()`.

### Step 3: Relational Mapper & Repository (`src/lib/supabase/itineraryRepo.ts`)
Create clean functions mapping between `GeneratedTrip` (`src/lib/tripStore.ts`) and Supabase tables:
- `saveItineraryToDb(supabase, userId: string, trip: GeneratedTrip, destination: Destination): Promise<GeneratedTrip>`
  - Upserts `public.destinations`.
  - Inserts into `public.itineraries` (storing `audit_log`, `warnings`, `feasibility_status`, `persona`, `start_date`, `days`, `origin_city`, `arrival_mode`, `arrival_at`).
  - Bulk inserts `public.itinerary_days` and returns generated day UUIDs.
  - Bulk inserts `public.itinerary_items` across `MORNING`, `AFTERNOON`, and `EVENING` with `latitude`, `longitude`, `is_flex`, `flex_reason`, `score_breakdown`, and `sort_order`.
- `getUserItinerariesFromDb(supabase, userId: string): Promise<GeneratedTrip[]>`
- `getItineraryByIdFromDb(supabase, tripId: string): Promise<GeneratedTrip | null>`
- `deleteItineraryFromDb(supabase, tripId: string): Promise<boolean>`

### Step 4: CRUD API Endpoints (`src/app/api/itineraries/`)
1. **`POST /api/itineraries/route.ts`**: Saves a generated itinerary for the authenticated user and returns the saved `GeneratedTrip` with its canonical database UUID.
2. **`GET /api/itineraries/route.ts`**: Returns all saved itineraries owned by the authenticated user.
3. **`GET /api/itineraries/[id]/route.ts`**: Returns one saved itinerary by ID (RLS automatically blocks unauthorized access; return `404` if not found).
4. **`DELETE /api/itineraries/[id]/route.ts`**: Deletes one saved itinerary by ID for the authenticated owner.
5. **`POST /api/itineraries/days/[dayId]/notes/route.ts` & `DELETE`**: Creates/updates/deletes day notes in `public.itinerary_day_notes`.

### Step 5: Authentication Pages & Reviewer Demo Mode
1. **`src/app/(auth)/login/page.tsx`**:
   - When Supabase is configured, authenticate against `supabase.auth.signInWithPassword({ email, password })`.
   - Include a **"1-Click Demo Login"** button (`japjit31@gmail.com` / `Japjit12`) that automatically signs in (or falls back to demo session if Supabase env vars aren't set yet).
2. **`src/app/(auth)/signup/page.tsx`**:
   - Connect to `supabase.auth.signUp({ email, password, options: { data: { display_name } } })`.
3. **`src/components/layout/SidebarNav.tsx` & `src/app/(app)/dashboard/page.tsx`**:
   - Read the active user's `display_name` / email from Supabase session (defaulting to `'Japjit'` in demo fallback mode) and wire the Sign Out action.

### Step 6: Frontend Persistence Wiring & Day Notes (`DayNotes.tsx`)
1. **`src/app/(app)/planner/page.tsx`**:
   - After `POST /api/itineraries/generate` returns, if the user is authenticated with Supabase, also call `POST /api/itineraries` to persist the trip in PostgreSQL, cache in `tripStore.ts`, and redirect to `/trip/<saved_id>`.
2. **`src/app/(app)/trips/page.tsx` & `src/app/(app)/dashboard/page.tsx`**:
   - Fetch trips from `GET /api/itineraries` when authenticated, merging/falling back to `getAllStoredTrips()` for local demo resilience.
3. **`src/components/workspace/DayNotes.tsx`**:
   - Upgrade from static placeholder (`"No note as of now"`) to an interactive note list & editor that saves per-day notes to `POST /api/itineraries/days/[dayId]/notes` (and syncs to `localStorage` fallback).

---

## 4. Verification Checklist Before Completion

1. Run `npx tsc --noEmit` $\rightarrow$ Must pass with **0 errors**.
2. Run `npm test` $\rightarrow$ All **26 unit & integration tests** must pass.
3. Verify that unauthenticated / cross-user access to `/api/itineraries/[id]` is rejected by RLS.
4. Verify that `DecisionLogDrawer` and `MapPlaceholder` coordinates work identically on a trip reloaded from Supabase.
