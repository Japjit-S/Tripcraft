# Project Progress & Architecture Evaluation Report: Roamwise (Tripcraft)

**Document Purpose:** Comprehensive context, architectural overview, milestone audit, and gap analysis for AI evaluation.  
**Project Type:** Full-Stack Weather-Aware Travel Itinerary Planner (GDG Dev Recruitment Task)  
**Current Overall Completion:** ~78% (Core Engine, Providers, Geocoding, UI Workspace, and Maps complete; Database Persistence & Auth transition pending)

---

## 1. Executive Summary & Product Vision

**Roamwise** (styled in the UI as **Tripcraft**) is a full-stack web application that generates personalized, weather-adaptive daily travel itineraries (1 to 7 days) based on a traveller's destination, dates, arrival logistics, and behavioural persona.

### Core Architectural Philosophy: Why Deterministic Over LLM?
Most modern travel planners act as thin wrappers around LLMs, resulting in slow generation, hallucinated venues, inconsistent formatting, and opaque reasoning. Roamwise deliberately implements a **100% deterministic, rule-based itinerary engine**:
1. **Zero Hallucinations:** Every scheduled activity originates from either a verified curated city dataset or live OpenStreetMap (OSM) geographical data.
2. **Full Inspectability (Explainable AI / Rules):** Every single inclusion, exclusion, weather swap, and score calculation is recorded in an **Audit Trail** (`AuditEntry[]`). Users and evaluators can open an in-app **Decision Log Drawer** to see the exact mathematical score breakdown and rule ID (e.g., `WX_RAIN_OUTDOOR`, `ARRIVAL_CUTOFF`, `HEAT_AFTERNOON_HIGH_INTENSITY`) behind every decision.
3. **Byte-Identical Reproducibility:** Given the same inputs and weather forecast, the engine is guaranteed to produce the exact same schedule every time.

### Scope Boundaries
* **In Scope:** City search & geocoding, 1–7 day trip window, 4 traveller personas (*Backpacker*, *Culture Seeker*, *Comfort Traveller*, *Family*), live weather forecasting + historical climate fallback, weather cache, deterministic 6-stage scheduling engine, interactive map synchronized with selected activities, day notes, user authentication, and Row-Level Security (RLS) saved trips.
* **Intentionally Out of Scope (per Roadmap):** Chatbots/LLM prose, flight/hotel bookings, payment processing, turn-by-turn navigation routing, and real-time multi-user WebSockets.

---

## 2. System Architecture & Technology Stack

* **Framework:** Next.js 15 (App Router) with React 19 and strict TypeScript.
* **Styling & Design System:** Tailwind CSS, `Plus Jakarta Sans` geometric typography, floating borderless card architecture (`rounded-[2rem]`, soft diffused shadows), and a deep cerulean/teal (`#1d6b8f`) + warm peach accent palette.
* **Weather & Geocoding Provider:** Open-Meteo Geocoding API, Open-Meteo 16-Day Forecast API, and Open-Meteo Historical Archive API (for trip dates beyond the 16-day forecast horizon).
* **Activity Data Providers:**
  * **Tier 1 (`CuratedPackProvider`):** Hand-tuned, high-precision landmark and activity packs for major Indian destinations (Jaipur, New Delhi, Varanasi/Kashi, Goa/Panjim, Udaipur, Mumbai) with alias resolution.
  * **Tier 2 (`OsmActivityProvider` + Declarative Normalizer):** Live Overpass API integration that queries OpenStreetMap nodes/ways around any geocoded coordinate, filters out junk nodes, maps OSM tags to engine categories/intensities, parses opening hours, and computes prominence using Wikipedia/Wikidata sitelinks.
* **Maps Integration:** Dual-provider architecture using the **Google Maps Embed API** (primary, restricted browser key configured) with automatic fallback to **OpenStreetMap Embed** (bounding-box + marker) and a zero-key **Google Maps Directions** deep link.
* **Database & Authentication (Pending Integration):** Supabase (PostgreSQL + Row-Level Security + `@supabase/ssr` cookie-based authentication).

---

## 3. Completed Milestones (What Has Been Built & Verified)

### A. The 6-Stage Deterministic Itinerary Engine (100% Complete)
Implemented as pure, side-effect-free TypeScript functions backed by a **26-test automated unit & integration suite** (100% passing):

1. **Stage 1 — Input Validation & Feasibility Gate:**
   * Validates duration (1–7 days), date formats, and destination coordinates.
   * Evaluates internal `FeasibilityRule` constraints (`info`, `caution`, `block`). Active `block` rules halt generation immediately with an explicit explanation; `caution` rules attach prominent warnings to the trip header.
2. **Stage 2 — Daily Weather Classification (`classifyDay`):**
   * Translates raw WMO weather codes, max/min temperatures, precipitation (mm), and wind speeds into deterministic day states: `CLEAR`, `RAIN`, `STORM`, `EXTREME_HEAT` ($\ge 38^\circ\text{C}$), `COLD_WIND`, or `MIXED`.
3. **Stage 3 — Hard Constraint Pruning (`hardFilters`):**
   * **Arrival Gate:** Parses Day 1 arrival time (`arrivalAt`) and blocks `MORNING` (and `AFTERNOON` for late arrivals) so travellers aren't scheduled for tours before their flight/train lands.
   * **Weather Gate:** Prunes outdoor activities (`indoor === false`) on `RAIN` and `STORM` days; prunes `HIGH` intensity outdoor activities during the `AFTERNOON` slot on `EXTREME_HEAT` days.
   * **Operating Hours Gate:** Checks parsed day-of-week opening hours against slot windows (`MORNING`, `AFTERNOON`, `EVENING`).
   * Every pruned candidate is logged to the audit trail with a specific rule code and human-readable explanation.
4. **Stage 4 — Multi-Factor Persona Scoring (`scoring`):**
   * Computes a composite score for every surviving candidate per slot:
     $$\text{Total Score} = w_p \cdot \text{Prominence} + w_a \cdot \text{PersonaAffinity} + w_w \cdot \text{WeatherFit} + w_s \cdot \text{SlotFit} + w_d \cdot \text{ProximityToAnchor} - \text{CategoryRepetitionPenalty} - \text{FatigueCost}$$
   * **Persona Biases:**
     * *Backpacker:* Rewards budget/free landmarks, street markets, high walkability, and social/local food spots.
     * *Culture Seeker:* Heavily weights heritage monuments, museums, temples, galleries, and guided historic walks.
     * *Comfort Traveller:* Prioritizes low physical intensity, scenic dining, relaxation, and low transit friction.
     * *Family:* Prioritizes kid-friendly venues, indoor safety buffers, shorter durations, and strict fatigue penalties.
5. **Stage 5 — Geographic Clustering & Slot Allocation (`clustering` & `allocation`):**
   * Selects a high-prominence daily "anchor" activity and uses Haversine distance calculations to cluster nearby activities on the same day, minimizing cross-city transit.
   * Greedily populates `MORNING`, `AFTERNOON`, and `EVENING` slots while enforcing trip-wide deduplication.
   * **Graceful Degradation (`FLEX` Blocks):** If extreme weather or a sparse rural location exhausts valid candidates for a slot, the engine inserts a structured `FLEX` activity block ("Flexible Exploration / Rest Buffer") and logs a `DEGRADATION` audit entry rather than crashing or scheduling unsafe outdoor activities in a storm.
6. **Stage 6 — Explainability & Output Assembly:**
   * Packages the daily schedules, weather summaries, warnings, and full `AuditEntry[]` log into a unified payload.

### B. Backend Generation & Autocomplete APIs (100% Complete)
* **`POST /api/itineraries/generate`:** Full server-side orchestration connecting geocoding, weather fetching (with 16-day forecast + historical archive fallback), activity sourcing (Curated Pack $\rightarrow$ OSM fallback), and engine execution.
* **`GET /api/destinations/search?q=`:** Server-side geocoding autocomplete endpoint used by the Planner form with client-side debouncing.

### C. Frontend User Interface & Experience (90% Complete)
* **Dashboard (`/dashboard`):** Personal travel command center displaying time-of-day greeting, a featured hero card for the upcoming trip, current weather conditions widget, "Up Next" activity preview, and quick navigation.
* **Trip Planner (`/planner`):** Modern trip configuration interface featuring debounced live city autocomplete dropdown, visual persona selector cards, date/duration pickers (capped at 1–7 days), and arrival logistics (Origin City, Flight/Train/Bus mode, Arrival Time).
* **Trip Workspace (`/trip/[id]`):** Three-pane layout:
  * **Left Column:** Sticky interactive map (`MapPlaceholder`) showing live **Google Maps Embed API** view, provider badge, coordinate readout, and a 1-click **Directions** button. Clicking any activity in the itinerary dynamically updates the map focus.
  * **Center Column:** Destination hero banner, daily weather summary card, 3 trip stat cards (Travel Dates, Persona, Arrival & Origin), and the categorized Morning / Afternoon / Evening activity checklist with indoor/outdoor badges, duration tags, and selection reasons.
  * **Right Column:** Interactive full-month calendar highlighting the active trip days (`#1d6b8f` active bubble, translucent blue for other trip days) and the Day Notes section.
  * **Decision Log Drawer (`DecisionLogDrawer`):** Slide-over inspection drawer allowing reviewers to filter engine decisions by Day or Verdict (`SELECTED`, `KEPT`, `REMOVED`, `DEGRADATION`) and inspect individual mathematical score breakdowns.
* **My Trips (`/trips`):** Grid dashboard to view, revisit, and delete generated itineraries.

---

## 4. Remaining Work (What Is Left from the Original Vision)

### 1. Supabase Database, Auth & Row-Level Security (Primary Pending Pillar)
Currently, the app uses browser `localStorage` (`tripStore.ts`) to store generated trips, an in-memory `Map` for weather caching, and a hardcoded client login (`japjit31@gmail.com` / `Japjit12`).
* **What Needs to Be Executed (Implementation Plan Ready):**
  * **PostgreSQL Schema:** Provision 8 tables (`profiles`, `destinations`, `weather_cache`, `feasibility_rules`, `itineraries`, `itinerary_days`, `itinerary_items`, `itinerary_day_notes`) with lossless JSONB columns for `audit_log`, `warnings`, and `score_breakdown` so saved trips retain full `DecisionLogDrawer` and Map functionality.
  * **Row-Level Security (RLS):** Enforce `auth.uid() = user_id` on all trip tables so User A can never read, modify, or delete User B's itineraries.
  * **Supabase Auth (`@supabase/ssr`):** Replace mock login/signup with real email/password authentication, Next.js 15 async cookie middleware, an auto-profile creation SQL trigger, and a 1-click "Demo Login" button for evaluators.
  * **Persistence CRUD Endpoints:**
    * `POST /api/itineraries` (Save generated itinerary to PostgreSQL)
    * `GET /api/itineraries` (List authenticated user's saved itineraries)
    * `GET /api/itineraries/:id` (Fetch single saved itinerary with owner verification)
    * `DELETE /api/itineraries/:id` (Delete saved itinerary with cascading cleanup)
  * **Database-Backed Weather Cache:** Connect `WeatherProvider` to query and upsert the `weather_cache` table (`destination_id` + `forecast_date` with TTL expiry) so cache hits persist across serverless invocations.

### 2. Dynamic Destination Banner / Image Resolver
* **Current State:** Jaipur trips display a custom illustration (`/jaipur-banner.jpg`), while other cities render a generic gradient placeholder with a pin icon.
* **What Is Left:** Implement a lightweight destination image resolver (curated banners for the top 6 cities + dynamic Wikimedia Commons / Unsplash landmark image lookup for arbitrary OSM cities) so every destination has a rich visual header.

### 3. Interactive Day Notes Persistence
* **Current State:** The right-sidebar `DayNotes` component currently renders a static empty state (*"No note as of now"* and an unhooked *"Add note +"* button).
* **What Is Left:** Make `DayNotes` interactive (add, edit, delete notes per day) and persist notes to `itinerary_day_notes` (with `localStorage` fallback for unsaved guest trips).

### 4. Dashboard Dynamic Weather Binding & Public Landing Polish
* **Current State:** The `/dashboard` weather widget displays static demo numbers (`28°C`, `45% Humidity`, `12 km/h Wind`), and `/` redirects straight into the app.
* **What Is Left:** Bind the Dashboard weather card to the featured trip's actual forecast data, bind the user greeting to the authenticated Supabase profile name, and optionally expose a clean public landing/welcome view for unauthenticated visitors.

### 5. Final Deployment & Verification
* Deploy the application to **Vercel** with production environment variables (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
* Record the live deployment URL in `README.md` and run the final end-to-end GDG checklist (rainy Backpacker test, clear Culture Seeker test, Family test, cache hit verification, and RLS cross-user isolation test).

---

## 5. Evaluation Readiness Scorecard

| Rubric / Evaluation Dimension | Status | Maturity | Notes |
| :--- | :--- | :---: | :--- |
| **Deterministic Rules Engine** | Complete | **100%** | 6 stages, full mathematical scoring, arrival & weather gates, 26 unit tests passing. |
| **Explainability / Audit Trail** | Complete | **100%** | Every rule evaluation logged and inspectable in the UI via `DecisionLogDrawer`. |
| **Live Weather & Forecast Fallback** | Complete | **95%** | Open-Meteo live forecast + historical archive fallback working; moving cache from RAM to Supabase DB. |
| **Destination & Activity Sourcing** | Complete | **100%** | 6 curated city packs + live OpenStreetMap Overpass API fallback with tag normalization. |
| **Interactive Maps & Directions** | Complete | **100%** | Google Maps Embed API key active & restricted + OSM fallback + zero-key Directions link. |
| **Frontend UX / Workspace Polish** | Complete | **90%** | 3-pane workspace, month calendar, planner autocomplete done; pending Day Notes input & dynamic city banners. |
| **Authentication & Security (RLS)** | Planned | **20%** | Mock auth in place; full SQL schema, RLS policies, and `@supabase/ssr` plan finalized and ready to execute. |
| **Database Persistence (CRUD)** | Planned | **25%** | Currently using `localStorage` (`tripStore.ts`); Supabase PostgreSQL tables and CRUD routes specified. |
