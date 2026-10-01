# Tripcraft — Staged Engineering Execution Plan for Antigravity

## Mission

Harden Tripcraft from a deterministic itinerary *selector* into a trustworthy, maintainable travel-planning product. Work through the stages below in order. Complete, verify, commit, push, deploy, and verify the deployed result for **one stage at a time**. After a stage passes its release gate, stop and ask Japjit for explicit permission before beginning the next stage.

This is an execution brief, not permission to redesign the product, replace its stack, or skip release gates. The user intends to work stage by stage and review each deployed increment.

## Product constraints and source of truth

- Product: Tripcraft (Roamwise engine), a Next.js App Router + strict TypeScript + Tailwind + Supabase application. Confirm the checked-out branch, deployed version, installed Next.js documentation, repository instructions, and current state before changing anything; this project has Next.js-specific agent rules in `AGENTS.md`.
- Core requirement: itinerary decisions remain deterministic and explainable. **Do not introduce an LLM, generative model, paid Places API, or paid routing/weather dependency into the scheduling engine.** If a proposed dependency, service, product behavior, or cost changes this constraint, stop and ask Japjit first.
- Preserve the existing personas, worldwide destination intent, 1–7 day limit, audit log, auth, current visual direction, and users’ existing itineraries unless the active stage explicitly requires a compatible change.
- Treat current code and deployed behavior as potentially inconsistent. The audit snapshot was clean `main` at `87afb9b8017a91153b9b7c7dfa77a3a869049129`; independently verify the current branch and actual deployed commit before relying on that snapshot.
- Never expose secrets, add service-role credentials to client code, overwrite user data, run destructive migrations, force-push, or bypass branch protection. Use additive/versioned migrations and preserve legacy trip readability.
- Do not make unrelated cleanup or start a later stage early. If a later-stage dependency blocks the active stage, document it and ask rather than silently expanding scope.

## Mandatory operating protocol

### Before each stage

1. Confirm which stage Japjit authorized. If this is the initial run, work on Stage 1 only. If no stage is authorized, ask before editing.
2. Read `AGENTS.md` and relevant project guidance; for Next.js changes, follow the repository rule to read the relevant installed Next.js docs under `node_modules/next/dist/docs/` before implementation.
3. Check `git status`, current branch, latest commit, remotes, deployment workflow, environment, and whether local changes belong to the user. Preserve unrelated edits; do not discard or overwrite them.
4. State a short scope, risks, and acceptance checklist to Japjit. If a decision materially changes the product, data model, security posture, user data, cost, or deployment target, ask first. For routine reversible implementation details inside this brief, proceed using sound engineering judgment and record the decision.

### Implement and verify the active stage

1. Make only changes needed for the active stage, including its tests, migration notes, and user-facing behavior. Keep deterministic scheduling separate from provider I/O and presentation.
2. Add or update automated tests for each fixed behavior. Use mocked/fixed fixtures for external services so tests do not depend on live Overpass, Open-Meteo, Wikimedia, Google Maps, Supabase, or network availability.
3. Run and report the relevant unit tests, `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Do not report a check as passing if it did not execute. If an existing environment issue prevents a check, retry safely, report the exact limitation, and ask Japjit whether to proceed; do not disguise a failed or skipped check.
4. Run focused browser verification in a safe test/staging context, including desktop and approximately 390px mobile layout for UI-affecting stages. Validate failure states as well as the happy path. Do not create, delete, or alter trips/notes in Japjit’s live account unless he explicitly authorizes those exact mutations.
5. Review the final diff for accidental files, secrets, generated artifacts, unrelated edits, compatibility breaks, and undocumented schema changes.

### Stage release gate — required after every stage

Do not call a stage complete until all applicable items below are satisfied:

1. Provide a concise stage summary and evidence that the acceptance criteria passed.
2. Commit the stage’s changes with a clear, stage-specific message. Do not bundle later-stage work or unrelated modifications.
3. Push the commit to GitHub using the repository’s established branch/PR conventions. Never force-push or bypass protection. If the only available path requires a protected-branch bypass, an unapproved merge, or a materially different release process, pause and ask Japjit.
4. Deploy through the project’s configured deployment workflow to the intended environment. Do not change production configuration, secrets, domains, or billing settings without approval. If only a preview environment is safe/available, identify it as a preview; do not claim production deployment.
5. Verify the deployment actually completed and serves the intended commit (deployment metadata/build SHA where available). Smoke-test the changed feature on the deployed URL and verify a critical unaffected path. A pushed commit alone is **not** proof of deployment.
6. Report commit/branch, deployment URL and environment, deployed commit/build identifier, checks run and results, browser smoke-test evidence, known limitations, and any follow-up needed.
7. End by asking exactly whether Japjit authorizes starting the next numbered stage. Then stop. Do not begin it until he replies affirmatively.

If a check, push, deployment, or live verification is blocked, report what passed, what did not, and why. Do not label the stage complete or request approval for the next stage as if the release gate passed. Ask for the decision or access needed.

## Stage 1 — Replace slot heuristics with a real temporal itinerary model

**Objective and rationale:** Fix the foundational domain flaw first. Morning/Afternoon/Evening may remain as visual groupings, but they must not be the engine’s scheduling units or evidence that a plan is physically feasible.

**Scope:**

- Define a typed, versionable event model with destination-local date/time, start/end, duration, event kind, source/candidate identity, and explainable scheduling status. Represent activities that span multiple time windows and continue across midnight or multiple trip days without duplicating the excursion as separate invented venues.
- Model explicit travel/transfer, arrival/check-in, meal, rest, overnight, and recovery blocks as distinct event types where they consume time. Use deterministic, testable inputs/adapters for travel duration until Stage 2 supplies better spatial estimates; do not invent precise real-world drive times.
- Apply arrival constraints to every allocation, including anchors. An event must never occupy a blocked or pre-arrival interval. Check event duration against available time and the candidate’s actual opening windows when known. Preserve unknown-hours status rather than silently claiming a venue is open.
- Ensure long activities can reserve consecutive intervals and, when supported by verified data, create a linked multi-day expedition with ascent/camp/descent or equivalent day-boundary phases. Do not imply that a generic “rest buffer” is a trek continuation.
- Make fatigue cumulative across the itinerary: duration and intensity must influence later allocations and recovery days. Handle fatigue conservatively when necessary data (elevation, intensity, or duration confidence) is missing.
- Update itinerary rendering and audit entries so the user can see actual event times, durations, continuity, buffers, and why an event was rejected/degraded. Keep a clear, honest representation for legacy slot-only trips.
- Version the serialized trip shape. Existing local trips must remain readable; avoid a destructive localStorage/database reset.

**Acceptance criteria:**

- Deterministic fixtures prove exact repeatability for identical input.
- Tests cover morning/afternoon/evening arrivals, including late arrival and the known case where an anchor was allocated into a blocked evening; no blocked activity is emitted.
- Tests prove that a long activity consumes continuous time, cannot overlap another event, and can continue across a day boundary without being duplicated or replaced with a fictitious stop.
- Tests cover opening/closing time fit, overnight boundaries, meal/rest/transfer reservations, cumulative fatigue/recovery, and insufficient schedule capacity with an explicit infeasible/degraded result.
- UI displays computed intervals without representing the old fixed labels as guaranteed appointment times.
- User-facing claims are calibrated: do not claim route/traffic or precise physical feasibility beyond the constraints actually evaluated.

## Stage 2 — Make destination and candidate geography trustworthy

**Objective and rationale:** A valid schedule built from the wrong city or fabricated/irrelevant places is not a valid itinerary. Resolve identity and candidate quality before optimizing route order.

**Scope:**

- Make ambiguous geocoding explicit. Preserve selected coordinates and administrative context; do not silently accept the first same-name result when materially different destinations exist. Validate coordinate ranges and consistency at the API boundary, not only in the browser.
- Remove synthetic fallback records that look like real venues and have offset-from-center coordinates. If real provider data is unavailable, return an honest unavailable/limited-data state or clearly labeled, non-bookable generic planning suggestions that cannot be mistaken for verified venues. Ask Japjit before changing this product behavior if there is ambiguity.
- Improve stable identity/deduplication across OSM and Wikipedia; distinguish verified source records from weak name-derived classification. Keep provider/source attribution and useful uncertainty metadata.
- Add a real geographic planning layer: distance/travel-time estimates, day-region clusters, and a deterministic order that avoids obvious backtracking. Use a free/no-key solution or transparent conservative estimate. Ask before adding a paid service or external dependency.
- Define geographically appropriate search coverage so dense cities, large metro areas, islands, and mountain regions do not all inherit the same unsuitable radius. Do not label straight-line distance as transit or travel time.

**Acceptance criteria:**

- Tests cover same-name cities, region/country selection, invalid/out-of-range coordinates, provider mismatch, duplicate POIs, and empty/thin data without silently fabricating verified attractions.
- Route fixtures cover close urban venues, venues 50m apart, city-scale distances, rivers/barriers where data supports them, and mountain/trek routes; audit explanations identify estimates and uncertainty.
- Live provider calls remain outside deterministic engine tests; attribution/source metadata survives into the UI and stored trip.
- The map and itinerary agree about selected candidate identity and coordinates.

## Stage 3 — Make weather and uncertainty destination-local and safety-aware

**Objective and rationale:** Whole-day weather labels and optimistic defaults cannot safely drive time-specific outdoor decisions, particularly for exposed or multi-day activities.

**Scope:**

- Use the selected destination’s IANA time zone consistently for trip dates, forecast days, arrival times, opening hours, and displayed event times. Prevent browser timezone from shifting a trip date.
- Represent weather by the temporal resolution available from the provider and define how conditions affect exposed events by time window. Where only daily data is available, label the limitation instead of implying hourly precision.
- Handle trips that straddle the forecast horizon per day: distinguish forecast from estimate rather than failing the entire trip or silently treating it as one uniform source.
- Replace the previous-year-single-week/fixed-clear certainty with appropriately qualified historical estimates. Any ultimate fallback must remain visibly low-confidence and must not classify unknown weather as confirmed safe/clear.
- Ensure weather constraints apply to anchors, multi-day events, and every segment of an excursion; a worsening day cannot leave later segments falsely feasible.

**Acceptance criteria:**

- Tests cover timezone date edges, DST changes, different destination/browser zones, mixed forecast/estimate trips, malformed/missing weather fields, hourly/day transitions, storm/heat/wind exposure, and provider outage.
- Incomplete or estimated weather is visible in the itinerary and decision log and has a deliberate safety policy.
- Dates and daily forecast records align exactly across engine output, UI, and persisted trip.

## Stage 4 — Bound provider latency, degradation, and public API load

**Objective and rationale:** Independent per-fetch timeouts do not bound the total generation request. Users need predictable waits and honest partial-data behavior; providers need protection from unbounded public fan-out.

**Scope:**

- Set a single end-to-end request budget compatible with the deployment platform. Add cancellation/deadline propagation and ensure the frontend exits loading state with a useful message when the request fails or is abandoned.
- Rework provider failover so slow mirrors do not multiply worst-case latency; define bounded retries, backoff, concurrency limits, circuit breaking, and cache behavior. Keep requests identifiable in logs without logging secrets or unnecessary user data.
- Define typed provider outcomes (fresh, cached, partial, estimated, unavailable) and make each stage’s fallback policy explicit. No silent transformation of a provider outage into false certainty or invented POIs.
- Add abuse controls appropriate to public geocoding/generation endpoints: input and payload limits, rate/concurrency limits where deployment supports them, and safe error responses. Do not expose internal stack/provider errors to clients.
- Check cache TTL, key correctness, eviction, and sharing across serverless instances. Do not claim that the Supabase weather-cache table is active unless the implementation actually uses it.

**Acceptance criteria:**

- Controlled tests simulate 8+ second responses, timeouts, 429/5xx, malformed JSON, one/all Overpass mirrors failing, Wikimedia failure, and cancellation; total request duration remains within the defined budget.
- The UI distinguishes retryable provider failure, limited-data result, and genuine no-results.
- Public endpoint validation, rate/concurrency behavior, and provider attribution are tested without calling paid APIs.

## Stage 5 — Make persistence complete, atomic, and understandable

**Objective and rationale:** A trip that loses weather, duration, decision, or notes state after reload is not truly persisted. A silent local fallback must not masquerade as an account-backed save.

**Scope:**

- Align TypeScript domain types, serialized trip version, Supabase schema/migrations, and all save/read mappings. Preserve event times, multi-day links, weather state/confidence, candidate identity/source, intensity, duration, scores, audit data, and any new Stage 1–3 domain fields.
- Use versioned, additive database migrations. Provide safe compatibility for existing rows and a rollback/forward-recovery note. Do not drop or rewrite existing user data without explicit approval.
- Make trip plus nested days/items persistence atomic (for example, one transaction/RPC boundary). Check and propagate every database error; do not leave partial trips or quietly turn read failures into empty lists.
- Define local-only, pending-sync, synced, and conflict states. Handle session expiration/account switching and a deliberate local-trip migration path without duplicate or cross-account data.
- Complete Day Notes persistence, including correct per-trip/day identity, delete/update support where offered, and consistency between server state and local cache.

**Acceptance criteria:**

- A generated trip round-trips through Supabase with every decision-relevant field intact; schema and mapping tests prevent regressions.
- Simulated mid-save failures leave no partial itinerary. Read/query errors are visible and distinguishable from no trips.
- Tests cover offline save, expired session, sign-in after local planning, two accounts in one browser, duplicate sync attempts, local/server conflicts, notes create/read/delete, and legacy trip loading.
- RLS remains effective for nested rows; no service-role key is used in client code.

## Stage 6 — Harden API input validation and Supabase authorization

**Objective and rationale:** Row-level security on user itineraries is not sufficient if public shared data is writable or API code trusts client-supplied identity and coordinates.

**Scope:**

- Restrict shared destination and cache writes to a trusted server path or appropriately scoped policies; public clients should not be able to poison shared reference/weather records.
- Validate all public request bodies and query parameters server-side: schema, lengths, date validity, allowed enums, coordinate bounds, city/coordinate relationship, arrival-time range, content limits, and safe output errors.
- Audit ownership checks for trips, days, items, and notes, including ID substitution and cross-user access. Exercise actual Supabase roles/RLS rather than assuming policies work because SQL exists.
- Make `schema.sql`/migration process repeatable and version-controlled; address non-idempotent policy setup without creating duplicate or broader policies.
- Load feasibility rules from their intended source and apply them in the actual generation path, or clearly retire the unused table/claim through a reviewed migration.

**Acceptance criteria:**

- Automated authorization tests prove anon cannot mutate shared data, user A cannot read/write/delete user B’s trip descendants, and valid owners retain intended access.
- Invalid and hostile input receives bounded 4xx responses without external calls or internal error leakage.
- A clean database setup and migration from the current schema both succeed in a safe test project; production data remains untouched unless Japjit explicitly authorizes a migration window.

## Stage 7 — Make workspace state, map, and responsive behavior reliable

**Objective and rationale:** Surface the actual schedule faithfully and ensure the workspace remains usable when data is dense, asynchronous, local-only, or viewed on a phone.

**Scope:**

- Make autocomplete and quick-pick requests race-safe; stale results must not replace the user’s latest city choice. Keep URL-prefill behavior synchronized and deterministic.
- Replace the single-focus “Spatial Radar” experience with a clear itinerary map for all scheduled stops. Handle overlapping/nearby markers, selected-stop state, map loading/errors, route order, and fallback when coordinates are missing. Do not imply transit routes that are not available.
- Resolve local/server state precedence and expose sync status, permission failures, empty states, and retries. Ensure notes cannot leak across local trips and database note deletion is reflected after reload.
- Make calendar, itinerary selection, and other interactive controls keyboard accessible with correct button semantics, focus states, and screen-reader labels.
- Verify mobile layout and navigation at 390–412px, including bottom-nav safe area, scroll boundaries, calendar/notes access, and no horizontal overflow.
- Define share and print behavior honestly: a share link must have an authorized, durable read-only access model or be labeled as a local URL; print/PDF should include the intended full trip, not only the selected day. Do not expose private trips publicly by default.

**Acceptance criteria:**

- Browser tests cover stale search responses, rapid selection changes, session expiry while saving notes/trips, map overlap and missing coordinates, and local-only status.
- Keyboard-only and mobile checks pass; no horizontal overflow or inaccessible click-only controls remain in the audited flows.
- Share access respects privacy/authorization. Print output includes all intended days, dates, event times, notes (if intended), and page breaks without clipping.

## Stage 8 — End-to-end evidence and release readiness

**Objective and rationale:** Validate the integrated system against the scenarios a reviewer or traveler will actually try, and make the deployed artifact match the reviewed code and product claims.

**Scope:**

- Build a deterministic E2E matrix across Manali/Himalayan trekking, Jaipur/heritage, Tokyo/dense urban, and Cape Town/coastal contexts; all four personas; 1, 3, and 7 days; and early, midday, late, and night arrivals.
- Include provider slow/failure cases, ambiguous cities, cross-timezone dates, weather changes, multi-slot and multi-day activities, thin candidate sets, clustered map stops, auth expiration, RLS isolation, notes, local sync, mobile, share, and print.
- Run the suite using safe fixtures/test accounts/staging data. Do not rely on Japjit’s live account or alter its data as test cleanup.
- Reconcile README, UI marketing claims, architecture docs, and decision-log explanations with behavior actually verified. Remove claims such as “physically validated,” “live synchronized,” “zero hallucinated venues,” or “shareable” if the implementation does not meet them.
- Verify deployment commit, build metadata, health, key user journeys, and rollback path. Capture concise recruiter-demo evidence only after correctness gates pass.

**Acceptance criteria:**

- The full automated suite, strict TypeScript check, lint, production build, and E2E matrix pass or have explicitly approved, documented exceptions.
- No known critical/high-severity defects remain in scheduling safety, ownership/RLS, data loss, or mobile usability.
- Production smoke tests confirm the deployed build is the intended commit and all changed flows work using a safe test identity.
- Finish with a concise readiness report, remaining risks, and demo script/evidence. Do not start new features under this stage.

## Required Antigravity handoff format after each stage

Use this structure and then stop:

1. **Stage completed:** stage number and one-sentence outcome.
2. **What changed:** concise user-facing and architectural summary.
3. **Verification:** each test/check and explicit pass/fail/not-run result; include browser scenarios.
4. **GitHub:** branch, commit hash, push/PR status.
5. **Deployment:** environment, URL, deployment/build ID or commit SHA, and live smoke-test result. Clearly say “not deployed” if verification is unavailable.
6. **Known limitations:** only remaining issues, not a promise to fix them later.
7. **Approval gate:** “May I begin Stage N?” Do not proceed until Japjit explicitly approves.

