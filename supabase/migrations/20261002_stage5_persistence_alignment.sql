-- Migration: Stage 5 Persistence Alignment
-- Additive, backward-compatible migration for version 2 temporal schedule, geographic transit, and weather metadata

-- 1. Extend itineraries
alter table if exists public.itineraries
  add column if not exists version integer not null default 2,
  add column if not exists destination_timezone text not null default 'UTC';

-- 2. Extend itinerary_days
alter table if exists public.itinerary_days
  add column if not exists weather_source text not null default 'forecast',
  add column if not exists weather_confidence text not null default 'high',
  add column if not exists weather_resolution text not null default 'daily';

-- 3. Extend itinerary_items
alter table if exists public.itinerary_items
  add column if not exists start_time text,
  add column if not exists end_time text,
  add column if not exists duration_min integer,
  add column if not exists event_kind text,
  add column if not exists linked_expedition_id text,
  add column if not exists distance_from_previous_km double precision,
  add column if not exists transit_from_previous_min integer,
  add column if not exists source text,
  add column if not exists is_verified boolean not null default false;
