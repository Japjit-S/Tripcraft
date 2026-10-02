# Antigravity Work Order: Tripcraft Frontend Visual Overhaul

## Purpose

Redesign Tripcraft’s six core user-facing page types into one distinctive, polished product experience. This is a **frontend design and implementation task**, separate from the eight-stage engineering-hardening roadmap. Do the redesign as one focused task with the three internal passes below; do not wait for separate user approval between ordinary component/page tasks. Ask Japjit only when a decision would materially change product behavior, data, cost, security, or release scope.

The user wants to make this project a long-lived personal portfolio piece. Optimize for visual cohesion, usability, and a memorable identity—not just a quick skin over the current UI.

## Visual direction — use the two final MVP mockups as the references

The two final MVP mockups in `design-references/` are the approved visual references for this overhaul. Inspect both files before implementation: `mvp-landing-page.png` for the landing-page design and shared art direction, and `mvp-trip-workspace.png` for the trip-workspace composition. Treat these as the final direction, together with the explicit requirements and exceptions in this brief. Do not ask Japjit to resend images that are already present in the project folder. If an image cannot be opened, continue from the written requirements here and report the access issue; do not invent a conflicting visual direction.

The approved direction is **“Field Notes meets Modern Atlas”**:

- A warm, editorial, India-first travel identity: tactile and expressive, but still legible and useful as a real planner.
- The user particularly likes the concept’s **upper hero area**: oversized deep-green headline, parchment canvas, mountain-and-fort layered illustration, sun, route markings, and distinctive Tripcraft wordmark/mark.
- The bottom destination cards in the generated concept were not liked. Do not copy them literally. Redesign that area intentionally; it may be more typographic, map-like, editorial, or use restrained illustrated accents.
- Palette starting point (adjust only to improve contrast/cohesion, and record any material deviation):
  - Parchment background `#F3EEE4`
  - Soft cream surface `#FFFBF3`
  - Deep evergreen ink `#173C39`
  - Teal `#146B67`
  - Tangerine `#F28B55`
  - Saffron `#E6C85C`
  - Muted sage `#B5CCBC`
- Use editorial display typography with a highly readable sans-serif for controls and dense itinerary data. Prefer existing local/project fonts and system fallbacks; do not add a remote font dependency or new package without a concrete need.
- Use subtle paper/map texture, contour lines, dotted routes, small travel-stamp/field-note details, and carefully composed vector-like shapes. Keep these as accents around content, not noise behind it.
- Build one reusable destination illustration as the master artwork for a city/region. Compose it with safe focal areas so the same source can be cropped responsively for the hero and a small side visual; do not create separate activity-specific art or one new art file for each crop.
- Activity/itinerary cards are **text-only**: no attraction photo, thumbnail, or generated venue image. Use typography, time/slot, category treatment, and small existing/code-native category symbols for hierarchy.
- Create a coherent, reusable weather-visual family for the engine’s states: `CLEAR`, `RAIN`, `STORM`, `EXTREME_HEAT`, `COLD_WIND`, and `MIXED`. The six states should resolve through four shared illustrations/compositions as specified in `TRIPCRAFT_IMAGE_ASSET_PLAN.md`; do not generate a separate image for every state, day, or trip. Defer production asset generation until page layouts are approved.
- The generated screenshot is a **design reference only**. Never use a flattened screenshot as the website, and do not copy its accidental text/layout artifacts.
- Preserve the approved Tripcraft name and explore the concept’s sun/mountain mark as the brand direction. Implement a clean, scalable code-native mark/wordmark if needed; do not use a screenshot crop as a logo.

## Visual reference files

Review these two **final MVP mockups** in `design-references/` before implementation. They supersede the earlier concept/reference mockups for page design:

- `mvp-landing-page.png` — approved landing-page layout and primary art-direction reference: wordmark, palette, headline hierarchy, mountain/fort illustration treatment, feature section, typographic destination strip, and persona labels. The older lower destination-card treatment is not approved; follow the refined typographic/chip treatment shown here.
- `mvp-trip-workspace.png` — approved trip-workspace composition and visual treatment: destination summary, weather, trip facts, left map, center text-only day timeline, right calendar and notes. Its trip content reflects the existing Tokyo, Family, Oct 2–8, 2026 example.

These are generated visual references, not production pages or source assets. Rebuild the interface with real components; never use either flattened screenshot as the website. For the workspace mockup, one small state is illustrative-only: **“My Home” appears selected in the left navigation even though the page is a trip workspace. Do not copy that selected state; reflect the actual route and current navigation behavior.** Use the displayed content as sample UI copy only where it agrees with the verified product behavior and the explicit rules below. The Tokyo illustration is a style/composition example, not a production Tokyo asset or a reason to generate separate images for each UI card. Keep activity cards text-only, and use one destination master illustration with reusable crops as specified above. The map must be the real interactive Google Maps implementation below, centered on trusted activity coordinates and highlighting only the active activity; do not reproduce the generated map as a static image or copy any unverified cartographic details from the mockup.

Earlier files `tripcraft-homepage-concept.png` and `trip-workspace-tokyo-oct-2026.png` may remain in the folder as background/design history, but they are superseded. In particular, do not copy the earlier workspace mockup's activity thumbnails or hand-drawn map.

## Non-negotiable map contract

- The trip workspace must contain a **real interactive Google Map powered by the Google Maps JavaScript API**. A generated illustration, static screenshot, decorative map panel, or non-Google map provider is not an acceptable substitute. Do not implement a route/polyline or multiple-stop marker field as a visual approximation.
- Use the existing `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` configuration if present. Never hardcode the key, commit it, put a secret key in client code, or ask Japjit to paste a credential into chat. Treat the browser key as public and rely on appropriate Google Cloud API/referrer restrictions. Do not create keys, enable billing, or change cloud project settings without Japjit’s explicit approval.
- If the existing key is absent, invalid, restricted incorrectly, or does not have the Maps JavaScript API enabled, do not silently fall back to a mock/static map and do not change Google Cloud settings. Report the precise configuration blocker and ask Japjit for the authorized setup.
- Initial state: center the real map on the trip destination. When the user focuses an itinerary activity (using the existing select/hover behavior), pan/zoom to that activity and show **only that current activity’s highlighted marker**. Do not show all itinerary stops at once, draw a route between them, or cluster unrelated markers. When no activity is active, return to the destination overview.
- Keep map interactions and labels accessible, ensure map resizing works inside desktop/mobile layouts, and provide an honest map-load/error state that does not pretend a map is displayed.
- The map is a functional product surface; artwork may frame or crop beside it but must never overlap, obscure, or replace it.

## Scope and important boundaries

Redesign these six page types, preserving their existing features and data flows:

1. Public landing page `/`.
2. App dashboard, labeled **“My Home”** in the interface (`/dashboard`).
3. Trip planner (`/planner`).
4. Trips library (`/trips`).
5. Trip workspace (`/trip/[id]`): itinerary, map, calendar, notes, weather, and decision log.
6. Sign-in/auth experience (`/login` and associated visible auth states).

The brand may be **India-first**, with Indian destinations used in visible examples. For this visual task, **do not add an India-only hard filter, remove international support, rewrite destination resolution, or alter engine/backend behavior**. The user wants to decide/handle geographic product constraints separately; a visual overhaul must not silently make existing destinations unsupported.

**Do not generate, download, or create the final destination-image pack during this task.** The image pack is separately planned in `TRIPCRAFT_IMAGE_ASSET_PLAN.md`. Keep the artwork rendering boundary and a neutral fallback working, but do not reintroduce the removed six-city preset/image tier, city-specific quick-pick scenes, or per-activity images. Use CSS/SVG/code-native motifs where appropriate; do not burn image-generation budget during this UI pass.

Do not change itinerary algorithms, provider integrations, API contracts, Supabase schema/migrations, authentication semantics, or trip data. Do not add fake testimonials, statistics, ratings, venue recommendations, or sample trip data that could be mistaken for real user/provider data. Keep every existing action functional.

## Work method

### Pass 1 — Inspect and define the shared system

- Inspect current routes, existing components, assets, functionality, and active Git state. Confirm the eight engineering-hardening stages are complete and preserve their resulting code, deployment state, and history. Read `AGENTS.md`; read the installed Next.js docs relevant to files you will touch, as required by the repository instructions.
- Preserve all completed engineering-stage work, user changes, and uncommitted edits. If the working tree is not clean or the intended starting branch is unclear, inspect and report the exact state before changing anything; do not overwrite, discard, or rebase away existing work. Keep the visual overhaul isolated from the completed engineering work, using a separate branch/worktree if needed.
- Map the six page types and their current features before changing layout. Identify the shared shell/navigation used by authenticated pages and the separate public landing/auth shells.
- Establish a small reusable design system: color tokens, type scale, spacing, radii, elevation/border treatment, buttons, inputs, badges, cards, navigation, focus states, and subtle cartographic motifs. Avoid one-off values where shared tokens/components are appropriate.
- Use the user-approved palette above as the default. Ensure contrast for body text, controls, status labels, and keyboard focus; parchment/cream must not reduce readability.

### Pass 2 — Implement all six views as one coherent product

**Landing page:**

- Recreate the approved concept’s emotional impact: strong headline, clear primary action, and layered mountain/fort/vector-travel motif. Keep meaningful breathing room and avoid a generic SaaS gradient hero.
- Make the next section earn its space: explain the product’s weather-aware, personalized planning value with concise real claims and a visually designed destination/discovery area. Do not reproduce the disliked generated bottom cards unchanged.
- Ensure navigation and CTA route to the actual existing planner/auth paths.

**My Home dashboard:**

- Treat this as the traveller’s starting point, not an admin analytics dashboard. Prioritize continuing/creating a trip and showing the user’s actual saved journeys.
- Provide a thoughtful empty state for a new user and useful loading/error states for persistence issues. Never invent saved journeys or metrics.

**Planner:**

- Preserve destination search/disambiguation, dates/duration, arrival details, persona selection, validation, generation progress, and errors.
- Make the form feel guided and calm: clear grouping and hierarchy, visible selected states, responsive layout, and understandable progress. Do not redesign progress as fake real-time telemetry; retain truthful behavior and avoid adding false status claims.

**Trips library:**

- Make actual trips scannable and visually consistent, with clear destination/date/persona information and accessible actions.
- Design empty, loading, error, and delete-confirmation states. Preserve existing delete behavior and ownership checks.

**Trip workspace:**

- This is the densest product screen. Establish a strong hierarchy among destination summary, weather, date/day selection, text-only activity timeline, real Google Map, notes, and Decision Log. Use color and illustration to support scanning, never obscure schedule content.
- Preserve day navigation, notes, audit drawer, and activity selection/focus. Use the map contract above exactly: real Google Maps JavaScript API; destination overview when idle; only the current activity highlighted and centered while focused. Do not imply routing, travel times, weather precision, or sharing capabilities that the current backend does not provide.
- Activity cards have no images. The single destination illustration may be cropped as a separate decorative side visual in the page composition, but do not repeat it as a fake venue thumbnail on each activity card.
- At mobile widths, make itinerary, map, calendar/day navigation, and notes reachable without horizontal overflow; do not merely shrink the desktop three-pane layout.

**Sign-in/auth:**

- Carry the same brand language into a simple, reassuring sign-in experience. Preserve the current real auth flow and truthful error/loading states; do not add demo accounts or change OAuth behavior.

Across all pages, provide coherent hover, focus, selected, disabled, loading, empty, success, and error treatments. Prefer semantic elements and keyboard-accessible interactions. Respect reduced motion and avoid excessive animation.

### Pass 3 — QA and present for review

- Verify the six page types on desktop and at approximately 390–412px mobile widths. Check overflow, sticky/fixed elements, keyboard navigation, contrast, focus visibility, and legibility over textured/illustrated areas.
- Exercise existing user flows: navigate from landing to planner, submit valid/invalid planner inputs without altering production data, view My Home and trips states, open a trip workspace, change days, focus an activity/map, open Decision Log, and use auth states available in a safe environment.
- Verify that the current neutral destination fallback loads or degrades gracefully; do not restore the removed six-city artwork tier. The future regional illustration pack is specified separately in `TRIPCRAFT_IMAGE_ASSET_PLAN.md`.
- Run `npm test`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Report checks that could not run as **not run** with the exact reason; never present a skipped/failed check as passed.
- Review the full diff and confirm no backend, engine, database, authentication, or unrelated completed engineering-stage changes slipped into this visual task.

## Completion bar

The overhaul is ready for user review only when:

- The six page types clearly belong to the same brand while retaining distinct information hierarchy for each task.
- The landing hero reflects the approved reference direction; the rejected bottom-card treatment has been redesigned rather than copied.
- All prior functional flows still work, and no fake data or unsupported product claims have been introduced.
- Desktop and mobile layouts have been visually checked, with no horizontal overflow or inaccessible core controls.
- Verification results and any known limitations are reported honestly.

## Branch, deployment, and handoff rules

- The already-submitted production deployment is frozen during this work. Do not replace it, merge to its production branch, change production settings, or trigger a production deployment without Japjit’s explicit approval.
- Work on an isolated branch/worktree or safe preview. Before doing so, inspect Git state and preserve the completed eight-stage result and any user edits. Never force-push, discard uncommitted changes, or rewrite the completed engineering-stage history.
- Do not push or deploy automatically as part of this prompt. First present the completed local/preview result and evidence to Japjit; he will decide whether to publish it and when.
- If a choice would require changing production behavior, removing supported countries, altering existing user data, adding a dependency/service, or making a material design departure from the approved reference, stop and ask. For routine reversible visual implementation decisions within this brief, proceed and note the choice.

## Final response to master

When the overhaul reaches the review point, report:

1. The six views changed and the shared visual system established.
2. Where the result can be viewed (local or preview URL), clearly distinguished from production.
3. The tests/checks run, each marked pass/fail/not run.
4. Desktop/mobile review results and any remaining limitations.
5. Confirmation that production, supported-country behavior, itinerary engine, backend, database, and authentication were not changed.

Then stop and wait for Japjit’s review. Do not proceed to the destination-image generation pack or production rollout until he approves.
