# Antigravity Instructions: Integrate Tripcraft Artwork Pack

## Objective

Integrate the five new transparent logo/persona PNGs and the 23 India destination PNGs already saved in `public/artwork/` into the current Tripcraft UI. This task is a visual asset-integration pass only: preserve existing planner behavior, data contracts, authentication, map functionality, and responsive layout. Do not regenerate the supplied images or create additional destination/activity/weather artwork.

## Before editing

1. Inspect the current working tree and preserve all existing user changes. Do not reset, revert, or clean unrelated files.
2. Read `TRIPCRAFT_IMAGE_ASSET_PLAN.md` for the regional coverage and landmark rules, but apply the current India-only product scope: `destination-india-fallback.png` is the unresolved/India-neutral visual fallback. Do not implement or restore the obsolete global fallback.
3. Confirm all assets listed below exist under `public/artwork/`. Use those exact filenames and paths; do not duplicate them into another folder.
4. Inspect the relevant current components before editing, especially the landing page, My Home/dashboard, planner persona selector, trip workspace, trips library, top navigation, sidebar, mobile navigation, and existing destination-art resolver.

## Supplied assets

All paths below are relative to the project root.

### Five new brand/persona marks

| File | Required use |
| --- | --- |
| `public/artwork/tripcraft-mark.png` | Brand symbol in the landing page, shared app navigation/header, authentication shell, and footer where a brand mark is currently shown. Pair it with the live “Tripcraft” text wordmark in the UI; do not bake or recreate the wordmark inside the image. |
| `public/artwork/persona-backpacker.png` | Backpacker persona card and persona indicators/badges. |
| `public/artwork/persona-culture-seeker.png` | Culture Seeker persona card and persona indicators/badges. |
| `public/artwork/persona-comfort-traveller.png` | Comfort Traveller persona card and persona indicators/badges. |
| `public/artwork/persona-family.png` | Family persona card and persona indicators/badges. |

The brand mark and persona art have transparent backgrounds. Render them with containment (`object-fit: contain` or equivalent), preserve their aspect ratio, and place them on a suitable existing solid/tinted surface so their transparent areas do not become an opaque box. Do not crop off meaningful symbol details. Keep persona names as accessible live text. Add useful alt text for informative images; use empty alt text only where the mark is genuinely redundant with adjacent visible text.

### Twenty-three India destination illustrations

#### Landing / fallback

- `public/artwork/landing-india-atlas-hero.png` — landing-page hero artwork; reuse a calm crop for an empty dashboard state if appropriate.
- `public/artwork/destination-india-fallback.png` — neutral India-wide destination fallback when the city or its state/region cannot be confidently resolved.

#### Regional masters (11)

- `public/artwork/region-north-himalaya.png` — Jammu & Kashmir, Ladakh, Himachal Pradesh, Uttarakhand.
- `public/artwork/region-ne-eastern-hills.png` — Arunachal Pradesh, Sikkim, Meghalaya, Nagaland.
- `public/artwork/region-ne-river-tea.png` — Assam, Manipur, Mizoram, Tripura.
- `public/artwork/region-gangetic-plains.png` — Punjab, Haryana, Delhi, Uttar Pradesh, Bihar.
- `public/artwork/region-west-arid-desert.png` — Rajasthan and Gujarat/Kutch.
- `public/artwork/region-central-plateau-forest.png` — Madhya Pradesh, Chhattisgarh, Jharkhand.
- `public/artwork/region-east-delta-coast.png` — West Bengal and Odisha.
- `public/artwork/region-konkan-west-coast.png` — Maharashtra and Goa.
- `public/artwork/region-deccan-temple-plateau.png` — Telangana, Andhra Pradesh, Tamil Nadu, and interior Karnataka.
- `public/artwork/region-western-ghats-backwaters.png` — Kerala and coastal Karnataka.
- `public/artwork/region-indian-islands.png` — Andaman & Nicobar Islands and Lakshadweep.

Use a regional master as the normal destination artwork for supported Indian cities. Select it from trusted state/region metadata; do not infer a state from a city-name substring if that could misclassify the place. If metadata is missing or ambiguous, use the India fallback rather than a misleading region.

#### Named landmark exceptions (11)

Use these only for a confident match to the named destination. Otherwise use the regional master.

- `public/artwork/landmark-delhi-red-fort.png` — Delhi.
- `public/artwork/landmark-jaipur-hawa-mahal.png` — Jaipur.
- `public/artwork/landmark-agra-taj-mahal.png` — Agra.
- `public/artwork/landmark-varanasi-ghats.png` — Varanasi.
- `public/artwork/landmark-udaipur-lake-palace.png` — Udaipur.
- `public/artwork/landmark-goa-panaji-coast.png` — Goa/Panaji.
- `public/artwork/landmark-mumbai-gateway.png` — Mumbai.
- `public/artwork/landmark-kolkata-howrah.png` — Kolkata.
- `public/artwork/landmark-amritsar-golden-temple.png` — Amritsar.
- `public/artwork/landmark-hampi-ruins.png` — Hampi.
- `public/artwork/landmark-mysuru-palace.png` — Mysuru.

The landmark list is a small visual exception layer, not a destination preset list. Do not turn these into quick-pick destinations, alter search behavior, or add new city-specific overrides.

## Required placement and behavior

1. **Brand identity:** replace any inconsistent text-only or placeholder brand icon with `tripcraft-mark.png` alongside the existing live Tripcraft wordmark. Reuse one shared presentation/style across landing, auth, desktop navigation, mobile navigation, and footer. Keep the mark compact and crisp; do not force a large square image into a horizontal wordmark slot.
2. **Persona selector:** show the matching persona art inside each of the four existing persona options. Keep current names, descriptions, selected states, keyboard behavior, and selection values unchanged. Do not remove or rewrite persona copy or scoring semantics. Replace redundant generic persona glyphs only where the supplied art clearly serves the same purpose.
3. **Persona references:** use the same four marks, at a smaller consistent size, wherever the UI identifies a selected persona (trip header, featured trip, or trip card). Avoid introducing new decorative badges if the existing design has no persona indicator in that location.
4. **Landing page:** use `landing-india-atlas-hero.png` in the existing hero artwork area. Keep headline, calls to action, and controls as live HTML text/elements; do not use a screenshot or bake text into the image.
5. **Destination image resolution:** implement or adapt one shared resolver so destination artwork follows this order: (a) exact, confidently matched landmark image; (b) region image from trusted state/region metadata; (c) `destination-india-fallback.png`. Keep India-only destination scope intact.
6. **Consistent destination reuse:** resolve one master image per trip/destination and reuse it with suitable focal crops for My Home/dashboard featured trip, trip workspace hero, and trips-library cards. Keep focal content visible across wide and compact crops. Do not generate alternate copies for each page.
7. **Weather art:** retain the four already-existing weather assets and existing weather-state behavior. These are not part of the 23 new destination assets, and should not be replaced by the persona or destination imagery:
   - `public/artwork/weather-clear-sun.png`
   - `public/artwork/weather-rain-cloud.png`
   - `public/artwork/weather-thunderstorm.png`
   - `public/artwork/weather-cold-wind.png`
8. **Never convert the real map into artwork.** The Google Maps/API implementation, map markers, selected-activity highlight, pan/zoom, and map interactions remain real and functional. Do not add map illustrations, fake routes, decorative map backdrops, or a second map image.
9. **Keep activity cards image-free.** Do not assign a destination master to individual itinerary activities or generate/introduce activity thumbnails.

## Visual and technical guardrails

- Preserve the established evergreen/teal, sage, coral, saffron, and parchment visual language. The provided marks are the source art; do not recolor, redraw, apply filters, or add drop shadows that muddy their cut-paper edges.
- Preserve transparent alpha on the five logos/persona marks. Do not flatten them onto black or white backgrounds.
- Use Next.js image handling appropriate to the current project. Prefer local static paths and avoid adding external image hosts or remote dependencies for these supplied assets.
- Set explicit dimensions/aspect ratios or stable containers to prevent layout shift. Use responsive sizing and appropriate `sizes` for large destination masters.
- The supplied destination PNGs are large. Keep the masters intact; use the existing Next.js image optimization path or a non-destructive derived delivery format if the project already supports it. Do not overwrite the PNG masters or commit duplicate oversized variants without a demonstrated need.
- Check desktop and mobile crops, transparency against both light and dark surfaces, loading/error states, keyboard selection, and accessible image labels.
- Do not modify scheduling, recommendations, maps, weather calculations, authentication, database/schema, API contracts, destination eligibility, or itinerary persistence as part of this artwork task.

## Verification and completion

1. Run the repository’s relevant lint/typecheck/build checks and fix only regressions introduced by this artwork integration.
2. Inspect the landing page, persona-selection step, My Home/dashboard, trip workspace, trips library, login/signup shell, desktop navigation, and mobile navigation. Confirm that the intended assets load and that text remains legible.
3. Test at a desktop viewport and a narrow mobile viewport. Check that images do not overflow, stretch, cause horizontal scrolling, or displace important controls.
4. Confirm there are no broken/missing paths, no white/black boxes behind transparent artwork, no external-image dependency for these surfaces, and no images added to the map or individual activity cards.
5. Summarize the files changed, the exact resolver mapping implemented, checks run, and any limitation. Do not push, deploy, or change any production data unless I separately authorize that work.
