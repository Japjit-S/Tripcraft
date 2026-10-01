# Destination Banner & Illustration Resolution — Implementation Plan

## Purpose

Replace the current Jaipur-only banner special case and generic MapPin fallback with a reliable, reusable destination-art system for Roamwise / Tripcraft. The system must work for curated flagship cities and arbitrary destinations, look consistent across the app, and never depend on an external service to render a complete banner.

This is an implementation plan, not an implementation prompt or a general product roadmap. It covers destination artwork resolution, persistence, rendering, and verification only.

## Locked product decisions

- Use expressive, destination-specific **vector-style illustrations only**. Do not use destination photography.
- Use one resolved illustration per canonical destination on the trip workspace, dashboard feature card, and trips grid; adapt cropping and overlays per surface.
- Keep the art stable and season-neutral. Do not vary it by weather, date, or time of day.
- Aim for the attached TripIt Rome reference: warm editorial travel art, a recognizable landmark when verified, layered architecture and sky, graphic shapes, and a few playful travel details. Avoid sparse gradients and generic map-pin art.
- External sources are permitted as optional enrichment. Reliability comes from bundled/local artwork and fallbacks, not from assuming an external source is always available.

## Scope and project checks

Before changing files, inspect the current project state, data types, aliases, trip-generation route, localStorage/Supabase persistence, and all three rendering surfaces. Preserve unrelated work. The earlier report said Next.js 15, while the inspected package appeared to use Next.js 16.3.4; confirm the current `package.json` and use the installed version’s APIs.

The six curated destinations and aliases are:

- Jaipur: Amer
- Delhi: New Delhi, Dilli
- Agra
- Varanasi: Banaras, Kashi
- Udaipur
- Goa: Panaji, Panjim, North Goa, South Goa

Resolve these with an explicit canonical mapping. Do not use substring matching that could map an unrelated city or conflate destinations.

## Architecture

Use a cache-first, server-side resolver. A normal page render must not initiate an image-provider search.

1. Normalize the geocoded destination into a canonical identity using city, country/region, and stable geocoder identity or coordinates. Disambiguate same-name cities.
2. Return a bundled, destination-specific illustration for a curated destination.
3. Reuse an approved cached illustration for a previously resolved Tier 2 destination.
4. On a cache miss, optionally perform a bounded, server-side Wikimedia Commons lookup for a destination-matched illustration. Wikimedia is best-effort only; reject photographs, unrelated maps/logos, ambiguous matches, and assets with unusable source/license metadata.
5. If there is no trustworthy match or the provider fails, render a polished local vector scene from bundled vector primitives and verified destination metadata. If a specific landmark cannot be verified, do not depict or name it as though it were the destination’s landmark.
6. If destination metadata is incomplete, render a complete designed travel illustration and place the destination name in normal UI text.

The fallback must be available immediately. An external lookup or image load may improve the result, but must not block page usability or leave an empty/broken image.

## Illustration system

Create a cohesive library of reusable vector elements and compositions: layered architecture or skyline silhouettes, terrain, clouds, warm sky bands, abstract geometric shapes, and restrained travel motifs such as a dashed route or small plane. Compose and color these deterministically from stable destination metadata so the same destination does not randomly change between trips.

Use city-specific flagship art for the six curated destinations. For Tier 2, use an approved external illustration only when both destination relevance and illustration quality are sufficiently clear; otherwise use a local composed scene. Generic fallback art should still feel intentional and lively, not like a blank background with an icon.

Keep text out of the art file. City names must remain selectable, accessible UI text. Maintain a title-safe region in the composition. Where artwork is generic, use alt text such as “Illustrated cityscape of Tokyo”; only name a specific landmark in alt text when it is verified.

## External lookup, caching, and resilience

- Make external lookups server-side, sequential, and tightly bounded by timeout and retry limits. Use a descriptive User-Agent, cache reusable results, respect provider retry/backoff instructions, and never spin in a retry loop.
- Cache successful matches long-term with an explicit art/resolver version. Cache “no acceptable match” outcomes for a shorter period. Track provider errors/backoff separately.
- Deduplicate by canonical destination identity, including country/region or geocoder ID; city name alone is insufficient.
- Never search on every page view. Resolve when a trip is generated or when a legacy trip lacks artwork, then persist the result.
- Retain source title/page URL, author, license, and attribution for external art. Reject an external result if the necessary attribution information is unavailable.
- No external provider can guarantee zero rate limits or uninterrupted uptime. The product guarantee is that the local illustration fallback always renders.

## Data contract and persistence

Add a compact, serializable optional artwork descriptor to the destination model and snapshot it onto `GeneratedTrip`. It should contain:

- schema/art version and stable destination/artwork ID;
- art kind: curated local, approved external illustration, or generated local scene;
- local asset path or approved image URL, when applicable;
- fallback scene/template ID and deterministic parameters;
- alt text and focal point;
- source page, author, license, and attribution for external assets;
- resolution/version timestamp and optional content hash.

Do not store image binaries or large inline SVG markup in trip records. Render local scenes from bundled components/assets. Keep shared destination artwork separate from user-owned trip data when Supabase is available. Restrict changes to shared artwork/cache records to the server. An existing localStorage trip without artwork metadata must continue to load and use the fallback chain.

## Rendering on each surface

### Trip workspace hero

Preserve the warm peach card and rounded shape. Keep the city title readable on the left; anchor the main illustration to the right with a deliberate safe area. Use a subtle peach fade to protect contrast. Test `mix-blend-multiply` against all curated and generated palettes; do not let it erase linework or distort key colors. At narrow widths, shrink/crop the artwork rather than colliding with the title.

### Dashboard featured journey

Reuse the same artwork beneath the dark card treatment. Preserve the illustration’s recognizability and color. Prefer a controlled dark vignette behind text over relying on a blend mode that can make different illustrations unpredictable. Keep important landmark forms visible.

### My Trips cards

Reuse the same artwork with a consistent thumbnail height and crop. Use the descriptor’s focal point so the landmark is not accidentally cropped out. Keep any overlaid labels legible.

## Loading, errors, and Next.js image safety

- Keep card dimensions/aspect ratios stable to avoid layout shift.
- Render the local vector fallback underneath any optional external asset. Reveal the external image only after it loads; revert to fallback on error.
- Key failure state to the current artwork descriptor and stop retrying after a failure; do not create repeated retries on rerender.
- Use the current Next.js Image API with explicit dimensions or a correctly sized `fill` container and responsive `sizes`.
- Configure narrow `remotePatterns` only for the exact external image host/path in use. Do not permit arbitrary hostnames or URL schemes.
- Prefer bundled vector art for SVG. Do not enable unrestricted remote SVG rendering. Reject external SVG or sanitize/transform it safely before use, with appropriate content-security handling.
- Make source attribution discoverable but unobtrusive, such as a small artwork-credit detail.

## Implementation sequence

1. Audit the current app’s destination/trip contracts, aliases, generation flow, persistence, and banner surfaces. Record the actual framework version and identify the existing Jaipur asset and any current image configuration.
2. Define canonical destination normalization and a versioned, serializable artwork descriptor. Add backward-compatible handling for trips without the descriptor.
3. Build the curated vector artwork and deterministic local scene/fallback system. Ensure it can render without network access.
4. Add the server-side, cache-first optional external illustration lookup and attribution/quality validation. Keep lookup failure non-fatal and keep the fallback available throughout.
5. Persist the selected descriptor with generated/saved trips and integrate shared cache handling with the backend’s actual persistence design.
6. Replace the Jaipur conditional and generic MapPin fallback with a shared artwork renderer on the trip workspace, dashboard, and trips grid. Apply surface-specific art direction and responsive focal cropping.
7. Add focused tests and manually verify the acceptance checklist below. Do not claim external image coverage or reliability beyond what was actually verified.

## Acceptance criteria

- Each curated city and every listed alias resolves to the correct bundled illustration.
- Two same-name destinations in different countries/regions do not share the wrong cached artwork.
- Tier 2 destinations receive either an approved matching illustration or a polished local vector scene; a photograph is never used.
- Network-offline, provider timeout/rate-limit, no-result, invalid URL, 404, and unsupported asset cases all show local art without a broken-image icon or layout shift.
- The same destination artwork descriptor is used on the workspace, dashboard, and trips grid, with intentional surface-specific cropping/treatment.
- Artwork remains stable across weather, trip date, and time of day.
- Existing trips with no artwork descriptor still render.
- External art attribution/license metadata is retained and discoverable.
- Workspace title contrast, illustration crop, accessibility text, loading behavior, and fallback behavior are checked at desktop and narrow mobile widths.
- No repeated external lookup happens on ordinary page navigation or rerender.
