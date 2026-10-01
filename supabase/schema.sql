-- Supabase Schema for Roamwise / Tripcraft
-- Full-stack travel itinerary planner with PostgreSQL, RLS, and Auth

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
  scope text not null,
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
