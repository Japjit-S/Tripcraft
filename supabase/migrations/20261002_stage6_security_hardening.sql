-- Migration: Stage 6 Security & Authorization Hardening
-- Tightens shared table write access, enforces idempotent policies, and seals anonymous mutability

-- 1. Drop overly broad public write policies on shared destinations
drop policy if exists "Destinations can be upserted by server/clients" on public.destinations;
drop policy if exists "Destinations can be updated" on public.destinations;

-- Restrict destinations mutations to authenticated users or server
create policy "Destinations can be upserted by authenticated users"
  on public.destinations for insert
  to authenticated
  with check (true);

create policy "Destinations can be updated by authenticated users"
  on public.destinations for update
  to authenticated
  using (true);

-- 2. Drop overly broad public write policies on weather_cache
drop policy if exists "Weather cache can be written" on public.weather_cache;
drop policy if exists "Weather cache can be updated" on public.weather_cache;

-- Restrict weather cache mutations to authenticated users
create policy "Weather cache can be written by authenticated users"
  on public.weather_cache for insert
  to authenticated
  with check (true);

create policy "Weather cache can be updated by authenticated users"
  on public.weather_cache for update
  to authenticated
  using (true);

-- 3. Ensure cascading ownership checks on itinerary_day_notes delete
drop policy if exists "Users can manage own day notes" on public.itinerary_day_notes;

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
