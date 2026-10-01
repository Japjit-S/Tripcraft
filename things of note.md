# Things of Note — Master Repair & Overhaul Checklist

**Created:** 2026-10-01  
**Status:** Queued for tomorrow's session  

---

## 0. First Thing Tomorrow: Discussion Item
* **Explain `clustering.ts` (`clusterCandidatesByAnchor` & Haversine distance):** Walk Master through what geographic clustering is supposed to do, why the function in `src/lib/engine/clustering.ts` (Lines 31–61) is currently uncalled dead code, and how we actually want geographic grouping to work (especially when mixing town sights with outer regional treks like Triund or Beas Kund).

---

## 1. Codebase & Git History Cleanup (Pure Repair)
* **Delete AI Clutter & Dead Files:**
  - Delete `.backups/` directory.
  - Delete leftover markdown clutter (`UI_WALKTHROUGH.md`, `work summary.md`, root `implementation_plan.md`, etc.).
  - Delete `CuratedPackProvider` (`src/lib/providers/curatedPackProvider.ts`) and the 6 hardcoded JSON files (`src/lib/providers/curated/*.json`).
* **Repair Git History (Without Creating a New Repo):**
  - Clean the working tree and use `git reset --soft` / rebase to rebuild a clean, logical commit history on the existing repository.

---

## 2. Critical Bugs Found in Code Audit (Must Fix Tomorrow)

### Bug 1 (CRITICAL): In-Memory Cache Corruption (`src/lib/engine/hardFilters.ts`, Line 202)
* **What happens:** On an `EXTREME_HEAT` day, Line 202 runs:
  `candidate.slotAffinity = candidate.slotAffinity.filter((s) => s !== 'AFTERNOON');`
* **Why it's catastrophic:** It mutates the `CandidateActivity` object **in place**. Because providers cache `CandidateActivity[]` in memory across days and across requests, a single hot day permanently strips `'AFTERNOON'` from that activity for Day 2, Day 3, and every subsequent user request until the server restarts.
* **Fix:** Never mutate candidate objects in place. Clone or compute allowed slots per day without touching the source object.

### Bug 2: Why Manali & Dharamshala Returned "Jack Shit" (`src/lib/providers/osmProvider.ts`)
* **2A — Missing Nature, Trek, and Stadium Tags (Lines 35–38):**
  - `buildOverpassQuery` only queries `museum|attraction|viewpoint|gallery|theme_park`, `fort|palace|monument|castle|ruins`, `park|garden`, and `marketplace|place_of_worship`.
  - It completely ignores:
    - Hiking trails & treks (`route=hiking`, `information=trailhead`, `sac_scale`) $\rightarrow$ misses **Triund Trek** and **Beas Kund Trek**.
    - Mountains, peaks, valleys, waterfalls, passes, glaciers, hot springs (`natural=peak|valley|waterfall|glacier|hot_spring`, `mountain_pass=yes`) $\rightarrow$ misses **Solang Valley**, **Rohtang Pass**, **Jogini Waterfall**.
    - Stadiums (`leisure=stadium`) $\rightarrow$ misses **HPCA Cricket Stadium** in Dharamshala.
  - Instead, it floods the candidate pool with tiny neighborhood shrines (`place_of_worship`) and street corner parks (`leisure=park`).
* **2B — The `.slice(0, 50)` Wikidata Truncation Bug (Line 51):**
  - `const uniqueIds = Array.from(new Set(wikidataIds)).slice(0, 50);`
  - Overpass returns hundreds of elements in raw database ID order (mostly small local shrines/parks first).
  - Line 51 slices only the **first 50 unsorted items** to check Wikidata sitelinks! Famous landmarks at index #51+ get `0` sitelinks (`prominence = 0`) and get buried at the bottom.
* **2C — Rigid 15km Radius (Line 32):**
  - `radiusM = 15000` (15 km) cuts off major mountain passes, valley excursions, and trek base camps located 15–35 km outside town centers.

### Bug 3: Binary `indoor` + 2.5mm Drizzle Wipes Out Entire Cities (`classifyDay.ts` Line 54 & `hardFilters.ts` Line 182)
* **What happens:**
  - `classifyDay.ts` Line 54 labels the entire 24-hour day as `RAIN` if precipitation is merely `>= 2.5 mm`.
  - `hardFilters.ts` Line 182 (`if (!candidate.indoor)`) then **deletes 100% of outdoor activities for the entire day**.
  - This also turns `scoring.ts` Lines 60–61 (`normWeatherFit` for rain) into **100% dead code**, because all outdoor items were already deleted in `hardFilters.ts` before `scoring.ts` ever runs.
* **Fix:**
  - Replace binary `indoor: boolean` with a continuous **`weatherExposure` float (`0.0` to `1.0`)**.
  - Replace hard rain deletion with a continuous trade-off between **Weather Severity (`0.0–1.0`)**, **Exposure (`0.0–1.0`)**, **Activity Vitality/Prominence (`0.0–1.0`)**, and **Persona Resilience**.
  - Only hard-block when conditions are genuinely hazardous (e.g., thunderstorm/blizzard on an exposed trek). In normal rain, high-vitality activities (like a must-do trek or landmark) remain scheduled with a `"Pack raincoat / waterproof gear"` advisory.

### Bug 4: Rigid 3-Activities-Per-Day Rule & Ignored Duration (`normalize.ts` & `allocation.ts`)
* **What happens:**
  - `normalize.ts` calculates `typicalDurationMin` for every item, and `allocation.ts` **completely ignores it**.
  - Every day is forced into 3 separate single-slot activities (Morning, Afternoon, Evening).
* **Fix:**
  - Support real multi-slot and multi-day spans:
    - **Single-Slot** (2–3 hrs)
    - **Half-Day** (Morning + Afternoon, or Afternoon + Evening)
    - **Full-Day** (Morning + Afternoon + Evening)
    - **Multi-Day / Overnight** (e.g., Triund Trek or Beas Kund Trek occupying Full Day 1 + Day 2 Morning & Afternoon).

### Bug 5: Pass A "Day Anchor" Ignores Persona & Blocks Nature (`src/lib/engine/allocation.ts`, Lines 40–65)
* **What happens:**
  - Pass A picks the #1 anchor activity of every day *without* calling `scoreCandidate()`—completely ignoring whether the user selected Backpacker, Culture Seeker, Comfort Traveller, or Family.
  - Line 46 restricts anchors to `LANDMARK` or `CULTURE` (unless `prominence >= 0.7`), blocking nature/trek activities from being the centerpiece of a day.

### Bug 6: Broken Arrival Time Cutoff Math (`src/lib/engine/hardFilters.ts`, Lines 125–148)
* **What happens:**
  - `MORNING` is blocked if arrival $\ge$ `11:30 AM`, and `AFTERNOON` is only blocked if arrival $\ge$ **`5:00 PM` (`17:00`)**.
  - If a traveller lands at **`4:45 PM`**, the engine leaves `AFTERNOON` open and schedules a full 3-hour Afternoon tour 15 minutes before 5:00 PM.
* **Fix:** Calculate remaining usable daylight/slot hours after accounting for transit + check-in buffer.
