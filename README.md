# Tripcraft

Tripcraft is a full-stack travel planner that creates weather-aware daily itineraries for a selected city, trip date, duration, and traveler persona. Users can save, revisit, and manage their own itineraries.

**Status:** Frontend Foundation Complete. Currently in Phase 2 (Backend Integration pending).

---

## 1. The Problem and Product Decision

Planning a trip often involves juggling multiple tabs for weather, activities, maps, and notes. Existing travel planners are often either too rigid or overly reliant on slow, unpredictable AI generation.

**The Solution**: Tripcraft takes a deterministic, rule-based approach. By combining live weather forecasts with carefully curated city data and traveler personas (Backpacker, Culture Seeker, Comfort Traveler, Family), the application rapidly generates predictable, feasible itineraries. It strictly limits trips to a 7-day maximum to ensure accurate weather forecasting and a clean UI, without relying on expensive paid Places APIs or opaque LLM wrappers for core logic.

## 2. Setup and Environment Variables

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm
- Supabase account (for database and auth)
- Google Cloud account (for Maps Embed API)

### Installation
```bash
git clone <repository-url>
cd tripcraft
npm install
```

### Environment Variables
Create a `.env.local` file in the root directory:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_restricted_browser_key
```

### Running the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## 3. Architecture and Schema

**Frontend:** Next.js 15 (App Router), React, Tailwind CSS, Plus Jakarta Sans.
**Backend/Database (Planned):** Supabase (PostgreSQL)
**External APIs:** Open-Meteo (Weather), Google Maps Embed API

### Core Schema (Planned)
- `profiles`: Extends the authenticated user.
- `destinations`: Normalised location returned from geocoding.
- `weather_cache`: Avoids duplicate Open-Meteo provider calls.
- `itineraries`: The saved trip, its owner, and arrival details.
- `itinerary_days`: One record for each trip day.
- `itinerary_items`: Ordered itinerary activities and their rationale.
- `itinerary_day_notes`: User-written notes attached to a specific day.
- `feasibility_rules`: Auditable set of destination/advisory constraints.

## 4. API Endpoints (Planned)

| Route | Access | Responsibility |
|---|---|---|
| `POST /api/itineraries/generate` | Public/Signed-in | Validates inputs, runs feasibility & rules engine, returns unsaved plan. |
| `POST /api/itineraries` | Signed-in | Saves a generated itinerary for the current user. |
| `GET /api/itineraries` | Signed-in | Returns only the current user’s saved trips. |
| `GET /api/itineraries/:id` | Owner only | Returns one saved itinerary. |
| `DELETE /api/itineraries/:id` | Owner only | Deletes one saved itinerary. |
| `GET /api/destinations/search?q=`| Public | Geocodes a city search with debouncing. |

## 5. Deterministic Rules-Engine Flow

The core of Tripcraft is the itinerary generator:
1. Validate inputs (city, dates, persona, arrival mode).
2. Geocode the city safely.
3. Run feasibility checks (block/caution constraints).
4. Check `weather_cache` via a collision-free key (`destination_id` + `forecast_date`).
5. Categorize days (clear, rain, storm, hot, cold).
6. Filter candidate activities using hard weather filters (e.g., no outdoor walks in storms).
7. Apply Persona Scoring (e.g., Backpacker favors walkable/local food, Family favors kid-friendly).
8. Slot into Morning/Afternoon/Evening and generate explanation logs.

## 6. Feasibility Disclaimer

**Important:** This application contains *demo feasibility information, not authoritative travel advice*. 
Feasibility is implemented as a small, auditable, and source-linked internal rules dataset. It demonstrates the technical capability to block or warn users about geopolitical or weather-related constraints without making unsafe or unverified safety claims.

## 7. Caching and Weather

To prevent hammering the Open-Meteo API and to ensure fast generation times, weather responses are routed through a server-side cache (`weather_cache` table). Successive requests for the same city on the same dates will serve the cached payload until it expires, massively reducing duplicate provider calls.

## 8. Deployment

[Deployment URL will be added here once deployed to Vercel]
