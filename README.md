# Tripcraft (Roamwise)

Tripcraft is a full-stack, weather-aware deterministic itinerary planner built for the GDG Dev Recruitment Task. It procedurally synthesizes realistic, feasible daily travel plans (1–7 days) for any destination worldwide based on live meteorological forecasts, open geospatial data, and traveler persona constraints—with zero opaque LLM hallucination and zero reliance on paid Places APIs.

**Status:** Full-Stack Complete & Production-Ready. Verified with 87 unit and engine integration tests passing across 15 test suites, zero TypeScript errors (`npx tsc --noEmit`), zero ESLint errors, and live Supabase PostgreSQL integration.

---

## 1. Product Architecture & Philosophy

Planning travel typically forces users to juggle disconnected tabs for weather, attraction hours, distance calculation, and itinerary assembly. Many AI travel planners produce generic or physically infeasible schedules (e.g., scheduling outdoor beach visits during monsoons or mountain hikes at night).

**The Tripcraft Approach:**
- **Deterministic Rules Engine:** Every itinerary item is chosen through a verifiable pipeline of feasibility rules, hard weather gates, arrival cutoffs, persona scoring, and spatial proximity clustering.
- **Universal Procedural Discovery:** Rather than hardcoding a shortlist of cities, Tripcraft procedurally discovers landmarks, cultural monuments, mountain treks, nature reserves, and markets worldwide using OpenStreetMap (Overpass) and Wikipedia GeoSearch.
- **Dynamic Photographic Banner Resolution:** Real, high-resolution photographs for any destination are resolved on-the-fly via the Wikipedia Page Summary API with regional disambiguation guards.
- **Full-Stack Persistence:** User authentication, trip management, and collaborative day notes are backed by Supabase PostgreSQL with Row Level Security (RLS). Gracefully falls back to browser storage if offline.

---

## 2. Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5 (Strict mode)
- **Styling:** Tailwind CSS 4, Lucide React
- **Persistence & Auth:** Supabase (`@supabase/ssr` with cookie-based session management, PostgreSQL with RLS)
- **Geocoding & Weather:** Open-Meteo (Search API, 16-day forecast API, historical climate archive for dates >16 days)
- **Procedural Discovery:** OpenStreetMap Overpass API (multi-mirror failover) + Wikipedia GeoSearch API + Wikidata Sitelinks Batch API
- **Photography:** Wikimedia REST API with contextual title matching and anti-collision validation
- **Maps:** Google Maps Embed API

---

## 3. Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 20 & 24)
- npm, pnpm, or yarn

### Installation
```bash
git clone https://github.com/Japjit-S/Tripcraft.git
cd Tripcraft
npm install
```

### Environment Configuration
Create a `.env.local` file in the root directory:
```env
# Google Maps Embed API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Supabase (PostgreSQL & Auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_anon_key

# Server-Side Supabase Keys
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_anon_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json
```

### Database Initialization
Open the **SQL Editor** in your Supabase Dashboard, paste the contents of `supabase/schema.sql`, and execute. This creates all 8 tables, indexes, triggers, and RLS policies.

### Running Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Verification Tests & Build
```bash
# Run unit & engine test suite (87 tests across 15 suites)
npm test

# Run strict TypeScript check
npx tsc --noEmit

# Run Next.js production build
npm run build
```

---

## 4. Deterministic Engine Pipeline

Each itinerary request passes through 8 deterministic stages:

```
[User Input] 
     │ (City, Dates 1–7, Persona, Arrival Time & Mode)
     ▼
1. Validation & Geocoding
     │ Open-Meteo Geocoding + Contextual Admin1 Disambiguation
     ▼
2. Weather Ingestion & 16-Day Horizon Fallback
     │ Open-Meteo Live Forecast (<16d) OR Climate Archive (>16d)
     ▼
3. Day Weather Classification
     │ Evaluates temperature, precipitation, wind -> CLEAR, RAIN, STORM, EXTREME_HEAT, COLD_WIND
     ▼
4. Feasibility Constraints
     │ Checks internal geopolitical/advisory rules -> PASSED, CAUTION, or BLOCKED
     ▼
5. Procedural Candidate Discovery
     │ Queries Wikipedia GeoSearch + Overpass OSM (adaptive search radius) + Wikidata prominence sitelinks
     ▼
6. Hard Filters & Arrival Cutoffs
     │ Arrival time drops unusable morning/afternoon slots; Storm drops hazardous outdoor activities
     ▼
7. Persona-Aware Anchor & Slot Allocation
     │ Pass A: High-prominence anchors assigned per day (respects Backpacker Nature preference)
     │ Pass B: Greedy multi-factor scoring (persona affinity + weather fit + spatial proximity)
     ▼
8. Audit Trail & Explanation Generation
     │ Every inclusion and rejection logged with human-readable rationale
```

---

## 5. API Reference

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/destinations/search?q=` | GET | Public | Debounced city search returning geocoded coordinates & administrative region (rate limited) |
| `/api/destinations/artwork?destinationId=&city=&admin1=&country=` | GET | Public | Resolves high-resolution destination photography via Wikimedia |
| `/api/itineraries/generate` | POST | Public | Validates input, bounds payload to 32KB, executes engine, and returns complete plan with audit log |
| `/api/itineraries` | GET | Authenticated | Lists saved itineraries for the authenticated user |
| `/api/itineraries` | POST | Authenticated | Saves a generated itinerary and all nested days/items to Supabase with atomic rollback guard |
| `/api/itineraries/[id]` | GET | Owner | Retrieves a specific saved itinerary by UUID (strictly user-scoped) |
| `/api/itineraries/[id]` | DELETE | Owner | Deletes a saved itinerary (cascades to days, items, and notes) |
| `/api/itineraries/days/[dayId]/notes` | GET/POST/DELETE | Owner | Retrieves, persists, or deletes day notes with server & local synchronization |

---

## 6. Supported Traveler Personas

- **Backpacker:** High preference for outdoor nature, hiking trails, viewpoints, budget-friendly street food, and authentic local bazaars. High stamina tolerance.
- **Culture Seeker:** High preference for historic monuments, palaces, museums, architectural heritage, and archaeological sites. Moderate stamina load.
- **Comfort Traveller:** Balanced pacing, preference for accessible landmarks, scenic panoramas, and high-comfort dining. Low physical fatigue tolerance.
- **Family:** Strict preference for kid-friendly attractions, parks, science galleries, and safety-screened outdoor environments. Zero high-intensity activities.

---

## 7. License

MIT
