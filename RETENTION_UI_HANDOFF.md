# Handoff: trainee retention review page (smart-ui)

Working note across Claude Code sessions - **do not commit it**.
The backend lives in `../smart-api` (on its own branch, not yet merged). The UI is now built and
tested locally against it; this file records where things stand.

## Start here (next session, from 8 Oct 2026)

**Where we are:** the feature is built, deployed to dev, and the client is very happy with it. We're now on
**page-load performance** - see "Performance work" below for the full plan and what's done.

**Being deployed by Eddie when this was written:** performance steps 1 and 2 - the faster view (smart-api 072)
and the single summary query with `needsReviewDueAtNextRun` (smart-api + smart-ui, must go out together), plus
the full-trainee-page link (smart-ui). Eddie also needs to delete the unused
`../smart-api/src/main/java/uk/mcga/smart/api/repository/RetentionReviewStatusCountProjection.java`.

**Next step - measure on dev in Chrome DevTools (Network tab):**
1. Open `/trainee-retention-review` with DevTools → Network, tick "Disable cache", filter to "Doc".
2. Click the document request `trainee-retention-review?...` → **Timing** tab. "Waiting for server response"
   (TTFB) is the server time: smart-ui + its API calls + DB. Everything after is download/render.
3. Record TTFB for: Needs review tab, Reviewed tab, Retained tab (these two also do the Okta name lookup), All tab,
   a page 2, and with a filter applied. Do each 2-3 times (first hit can be slower).
4. If useful, smart-api's own timings are in its logs; and `explain (analyze) select count(*) from
   vw_trainee_retention_candidates;` on dev's DB shows one view read (was 583 ms locally before step 1, 199 ms after).
5. Then decide with Eddie how much of the Redis plan (performance step 4) is worth doing.

**How to work with Eddie on the database:** give him SQL to run in DBeaver and he pastes results - don't
connect to databases (local or otherwise) from the session.

## How Eddie works - follow these

- **Git:** read-only commands only (`status`, `diff`, `log`, ...). Never commit, push, stage,
  checkout, stash etc., and never offer to. Leave changes in the working tree and list the files changed.
- **Tests:** Eddie runs the tests and builds himself and pastes the results. Write the code and the
  tests; don't run them unless asked.
- **Conventions:** mirror the existing code exactly - same template, layout, naming, controller
  and view patterns as the other pages. Match the surrounding file's style even where it differs from lint.
- **UKSR residue:** SMarT shares heritage with UKSR (UK Ship Register). Flag UKSR leftovers
  but verify before calling something residue; don't "clean up" intentional cross-system guards.
- Discuss design questions before coding when Eddie asks to.

## What the feature is

A monthly lambda (`smart-lambda-remove-trainee-over-ten-years-from-last-claim`, 05:00 UTC on the
1st) permanently deletes trainees 10 years after their last claim or enrolment (GDPR). Admins see
who is coming up for deletion and either **retain** them (an override the lambda respects) or
**mark them reviewed** (no action - they'll be deleted). Full rules: `../smart-api/ADR/002-trainee-retention-review.md`.

## Status

**Deployed to dev and working** (6 Oct 2026). Eddie tested every retain/extend/review/undo/remove flow and
the success and error messages on dev; `npm test` and the WDIO journey pass locally. Committed on branch
`trainee-review-interface` (`ed279ae`, `57fe243`, then the reviewer-name change).

**Client feedback (7 Oct): very impressed.** Their one change - the trainee name should open the full trainee
page, not the summary - is done (see List page). The PR comes after the performance work. Redeploying the same image tag on dev needs
`kubectl rollout restart deployment/smart-ui` (pull policy is `Always`).

**"Retained by" on the Retained tab and the strict retain-date check - deployed to dev and working (7 Oct 2026).**
smart-api change is `3877c2d update: trainee retention view adds retained user info` (plus the Postman
collection update). Liquibase recreates the view on API start (072 is `runOnChange`).
To redeploy dev: `aws eks update-kubeconfig --region eu-west-2 --name mcauk-smart-dev-eks` (once per machine /
when switching clusters), then `kubectl rollout restart deployment/<smart-ui|smart-api>` - only needed when
reusing an image tag.

- **Where:** Admin → sub-nav "Trainee Retention" → `/trainee-retention-review`. Admin (AB) only (`isAb` on the mount).
- **List page:**
  - Tabs `Needs review` · `Reviewed` · `Retained` · `All` (no counts - see decisions). Opens on Needs review.
  - Bold line "N trainees need review." (global, from the summary endpoint).
  - Warning only when trainees due at the next run still need review:
    "N trainees due for deletion on 1 November 2026 have not been reviewed. View trainees"
    (global, ignores filters; link opens Needs review with the due filter ticked).
  - Filters: name, training provider, "Only trainees due for deletion on <next run>". Kept across tabs and paging.
  - Name links to the **full trainee page** `/training-providers/{trainingProviderId}/trainees/{id}` (client's
    request, 7 Oct - was the `/trainees/{id}` summary, still used as a fallback if a row has no provider id),
    with a "Retention ends <date>" hint (own line) when an override lapses before the next run.
    `src/views/tptrainees/trainee.html`'s admin Back link honours `?return=` ("Back" to the retention list as
    left; otherwise unchanged "Back to <TP>"). The trainee page's own sub-nav tabs don't carry `?return=` on.
  - Columns per tab:
    - Needs review: Name · Training provider · Last active · Deletion date · Actions
    - Reviewed: Name · Training provider · Last active · Deletion date · Note · Reviewed by · Actions
    - Retained: Name · Training provider · Retained until · Reason · Retained by · Actions
      (no Last active / Deletion date - see decisions)
    - All: Name · Training provider · Last active · Deletion date · Status tag · Actions; retained rows show
      "Retained until <date>" in the Deletion date cell.
  - "Reviewed by" / "Retained by" show the person's name ("First Last") with the date on the line below.
    "Retained by" shows whoever last extended the retention ("Extended <date>") if it has been extended,
    otherwise who retained it. The API stores logins (token `sub`); the controller resolves names with
    `getAllByLogin` (Okta `profile.login`, local `profile.email`), falling back to the raw login if not found
    or the lookup fails. Lookups happen only on the Reviewed and Retained tabs and the action pages (≤1 Okta call).
  - Extend / Remove pages' summary shows "Retained by" (name, date) and, once extended, "Last extended by".
  - 10 rows a page. Default sort `lastActiveDate` ascending; the Retained tab defaults to `extendedUntil`
    ascending (retentions ending soonest first), as it no longer shows last active.
- **Actions** (separate GET page + POST each, redirect back to the same tab/filters/page with a green success banner):
  - Needs review: **Retain** (or **Extend** if a lapsing override exists) and **Mark reviewed**.
  - Reviewed: **Undo review**. Retained: **Extend** and **Remove**.
  - Retain/Extend form: reason (required) and "Retain until:" date (bold, colon kept on purpose).
    Defaults to today + 1 year, or for an extension a year past the current override end.
    The date must be on or after the next run date - stricter than the API, because an earlier date
    wouldn't protect the trainee. POST vs PUT is decided server-side by looking up the override.
    The date is read strictly by `readRetainUntil` (controller; used by both the route validator and the save):
    whole-number day and month, a four digit year, and a real date - so `abc`, `1a`, a 2-digit year, 31/02 or
    29/02 in a non-leap year are all rejected ("Enter a real date to retain the trainee until"); leading zeros
    and surrounding spaces are fine. The shared lenient `readDate` (used by absences) is left alone - absences
    already guards each part with `isInt` range checks in `src/routes/absences.js`, so it isn't affected.
- **Trainee overview Back link** now honours `?return=`, so it returns to the retention list.

## Performance work (in progress, 7 Oct 2026)

Agreed order: (1) speed up the view, (2) fewer view reads per page, (3) measure on dev (browser Network tab),
(4) only then Redis caching in smart-ui.

1. **Done - view (smart-api 072, uncommitted).** `latest_claims` no longer reads `vw_all_claims_for_trainee`
   (its `UNION` sorted/de-duplicated all ~242k claims and joined unused columns; then `DISTINCT ON` sorted them
   again - both spilled to disk). It now takes `max()` claim date per trainee straight from `trainee_claim` and
   `trainee_balancing_claim` with `UNION ALL`. Verified identical last claim dates (0 differences), count still
   761, smart-api tests pass. One read: **583 ms → 199 ms** locally (Postgres under Rosetta, so dev is likely faster).
   The deletion lambda still reads `vw_all_claims_for_trainee` - a comment in 072 says to add any new claim type
   in both places. Deliberately **didn't** comment migration 035 - it's `runOnChange` with `drop view ... cascade`.
2. **Written, not yet tested - fewer reads (6 → 3 per page).** Summary is one native query with
   `count(*) FILTER (...)` (`TraineeRetentionCandidateViewRepository.getSummaryCounts()` →
   `RetentionSummaryCountsProjection`), and returns `needsReviewDueAtNextRun`; smart-ui drops its third call.
   Replaces `getReviewStatusCounts()` / `countByDueAtNextRunTrue()`; `RetentionReviewStatusCountProjection.java`
   is now unused - **Eddie to delete it** (sandbox couldn't). Integration test, Cucumber summary keys and Postman 01
   (`have.all.keys`) updated. smart-ui and smart-api must deploy together (the UI reads the new field).
3. **Measured on dev (8 Oct 2026), after 1 and 2 deployed** - TTFB in ms, 4 runs each, page 1, no filters:
   Needs review 329/313/528/310 (median ~321) · Reviewed 298/449/387/380 (~384) · Retained 438/455/375/365 (~406)
   · All 342/328/331/342 (~336). Baseline ~310-340 ms is the parallel candidates + summary calls; the Okta name
   lookup adds ~50-80 ms (median) on Reviewed/Retained, and more spread.
   `explain analyze` count on dev: **~131 ms execution + 3.5 ms planning** (local: 143 + 39). ~95 ms of it is the
   per-trainee max over all ~200k claim rows, before the 9.5-year filter drops ~90% of trainees. The candidates
   call is Spring paging (count query, then page query, one after the other) = ~270 ms of the ~320 ms TTFB; the
   summary runs alongside, so caching it wouldn't shorten the page. Leaning: candidates in one read
   (`count(*) over ()`, smart-api) + Okta names cache; skip summary cache and materialized view.
   Page 2: 523/319/370/331 (~351, same as page 1). Filtered: 201/207/208/193 (~204, ~120 ms faster) - likely
   because Spring skips the count query when page 1 holds the whole result (< 10 rows), i.e. one view read.
   **Confirmed:** that provider had 0 trainees; a provider with 100+ trainees was back to ~370 ms. So one read
   ≈ 200 ms per page - what the one-read change should give everywhere.
   **Chosen and written, not yet tested (8 Oct): parallel count** in `TraineeRetentionCandidateServiceImpl.findCandidates`
   (smart-api) - the page via a Criteria query (`QueryUtils.toOrders` keeps the sort) on the request thread, the
   `repository.count(spec)` on a virtual thread at the same time, joined into a `PageImpl`. Same response, no
   smart-ui change. New Cucumber scenario in `TraineeRetentionReviewAB.feature` (limit 5, page 2 → 3 rows, total 8).
   The count runs outside the X-Ray trace (no segment on that thread; the missing-context log is already silenced).
   **Deployed to dev (8 Oct): TTFB only ~300 ms, not ~200.** X-Ray shows the single page SELECT taking ~342 ms,
   but the same query alone in DBeaver on dev is **~140 ms** (136 exec + 4 plan; the extra joins/sort add ~10 ms
   over the count). So it's **CPU contention on the DB**: summary + count + page now run at once, each on 3
   processes (2 parallel workers), all buffer hits, so pure CPU - overlapping them doesn't cut the total work.
   Matches the 0-trainee provider page (~200 ms) with only 2 overlapping reads. Dev RDS vCPU count not yet known.
   Leaning: keep the parallel count; cache the summary in smart-ui (Redis, version counter + short TTL) so a page
   does 2 reads (~200 ms expected); the real fix if more is needed is storing last-active per trainee.
   Kept the parallel count (2 reads together ~200 ms vs one after the other ~300 ms).
   **Summary cache written, tests pass, being deployed to dev (8 Oct):** `src/services/trainee-retention.mjs` caches `summary()` in
   Redis (`TraineeRetention::summary`, 5 min) via `cache` from `app.js` (same as payment-schedules); `create`/`put`/
   `del`/`createReview`/`deleteReview` clear it after the API call succeeds. Redis errors are logged and fall back to
   the API. Plain delete, not a version counter: an in-flight read from another pod could re-store a pre-change
   summary for up to 5 min - accepted. `src/services/cache.mjs` gains `del` (additive, shared file - call out in PR).
   Test: `test/services/trainee-retention.spec.js`. Controller unchanged (its test mocks the service).
   Next: deploy smart-ui, re-measure (expect ~200 ms on Needs review/All, first load after an action ~300 ms);
   then the Okta names cache.
   **WDIO retention journey now fails (CI 3x + locally) since `efe5297`** (which also moved compose to smart-api
   `1.0.9-trainee-retention-backend`, i.e. the rewritten 072 view). Its `before` hook's direct SQL
   (`... review_status = 'NeedsReview' and extended_until is null and reviewed is null order by last_active_date, id
   limit 2`) runs for **minutes** on the local DB - `pg_stat_activity` shows it active, no lock wait (parallel workers
   busy), so it's a bad plan, not a lock. A plain count of the view is ~0.4 s. Suspect the extra `is null` filters
   make the planner expect ~1 row and choose a nested loop that recomputes the claims aggregate per row.
   **Confirmed by `explain`:** outer side estimated at 1 row (`trr.reviewed IS NULL`, `tro.extended_until IS NULL`
   after left joins), so a Nested Loop re-runs the claims GroupAggregate per trainee (~11k × ~150 ms).
   **Fix written in smart-api 072, not yet tested:** `candidates as materialized (...)` (with a comment) - the
   ~761-row last-activity result is computed once per query, so even a nested loop only rescans that. Plain reads
   unchanged. **Verified locally in DBeaver: hook query minutes → 185 ms** (CTE Scan on candidates, computed once).
   Page query 173 ms + 4 ms plan (was 207 + 37 locally) - no cost. **Local WDIO re-run: hook now passes**; later
   steps failed only because port 2997 was served by a Podman smart-ui container (gvproxy) running an old build
   with no "Trainee Retention" sub-nav link (screenshot) - not a code problem. CI builds smart-ui from source, so
   CI just needs the new smart-api test image with the 072 fix. **Local WDIO spec passes (8 Oct)** with the UI run
   from source; Eddie is pushing the new smart-api test container via Jenkins (then bump the tag in
   `docker-compose.yaml` and re-run the pipeline). The 072 fix is already deployed to dev and working. Test: run 072's create view as `create or replace view` in DBeaver locally, `explain analyze` the hook
   query + the page query, re-run the WDIO spec; then a new smart-api test image and bump `docker-compose.yaml`.
   **Re-measured on dev (8 Oct) with parallel count + summary cache + materialized 072:** All / Needs review a
   consistent ~230 ms (was ~336 / ~321), Reviewed ~300 ms (was ~384). Remaining gap on Reviewed/Retained is the
   Okta name lookup (~70 ms) - the names cache is the last optional step.
4. **Redis plan (summary cache done - see above; Okta names cache not started):** use smart-ui's existing `src/services/cache.mjs` (already caches payment schedules,
   shares the sessions Redis). First Okta names (login → name, ~24 h). Then summary/count keyed by a
   `retention::version` counter (bumped on every retain/review/undo/remove in smart-ui) plus today's date, ~5 min
   expiry for changes made outside smart-ui. List pages only if still slow.

## Decisions made (and why)

- **No counts on tabs** - the summary endpoint takes no filters, so counts disagreed with the
  filtered list. Pagination already shows the filtered total ("Showing 1 to 10 of N results";
  hidden when there's only one page - accepted).
- **Warning only for due-and-not-reviewed** - `summary.dueAtNextRun` includes Reviewed trainees, so a
  warning based on it never cleared. Count comes from `/candidates?reviewStatus=NeedsReview&dueAtNextRun=true&limit=1`.
- **"Due <date>" tag removed** from the Deletion date column - too busy; the due filter and sort cover it.
- **MATSU number and date of birth dropped** from the table (they're on the action pages' summary).
- **Reviewed rows offer Undo only**, not Retain (undo first). The API would allow Retain directly.
- **Success message** is a one-off value in `req.session.retentionReviewSuccess`, set on POST, read and
  cleared by the list. New pattern - smart-ui had no flash/success banner before.
- **Names, not emails, for who did what** - matches comments, which show "First Last". Emails were too long
  and wrapped badly. The DB still stores the login; only the display changes.
- **Retained tab drops Last active and Deletion date** - to fit "Retained by" (8 columns was too cramped,
  Reason wrapped into a tall block), and because for a retained trainee the original deletion date won't
  happen - "Retained until" is what decides when they could be deleted (they return to Needs review the month
  before it ends, and are deleted at the first run after it if not extended).
- **The stored `deletion_date` is not changed by retaining** - it's 10 years after last activity and drives the
  due-at-next-run logic; only the display changes (Retained tab, and "Retained until" on the All tab).
- **Return URLs** go through `safeReturnUrl` (`src/utils.js`) - only same-site relative paths, so
  `?return=//evil.com` or `javascript:` falls back to the list.

## Files

- New: `src/services/trainee-retention.mjs`, `src/controllers/trainee-retention-review.mjs`,
  `src/routes/trainee-retention-review.mjs`, `src/views/trainee-retention-review/`
  (`list`, `retain`, `review`, `remove-retention`, `undo-review`, `trainee-summary` include),
  `src/views/components/retention-review-nav/`, `test/web/trainee-retention-review-controller.spec.js`.
- Shared files touched (call out in the PR): `src/app.js` (mount), `src/views/components/admin-nav/template.njk`,
  `src/views/trainees/overview.html` (Back link), `src/utils.js` + `src/nunjucks.js` (`safeReturnUrl` / `returnUrl` filter),
  `src/views/components/smart-date/template.njk` (optional `legendClasses`),
  `src/local-oidc.js` (bug fix below), `src/services/okta.users.js` (new `getAllByLogin`; the shared `_users`
  mapper now also returns `profile.login` - additive), `src/services/local.users.js` (new `getAllByLogin`).
- Tests: `test/web/trainee-retention-review-controller.spec.js` (mocks both user services),
  `test/browser/journeys/admin-trainee-retention-review.spec.js`, `test/browser/pages/trainee-retention.js`,
  `test/browser/pages/sub-menu.js`, `test/base.conf.js` (admin suite).
- smart-api (this feature's later additions): migration `072-trainee-retention-candidates.sql` (view adds
  `retained_by`, `retained`, `extended_by`, `extended`), `TraineeRetentionCandidateView.java`,
  `TraineeRetentionCandidateIntegrationTest.java`, `before_trainee_retention_candidates.sql` (one fixture override
  extended by `mca.su@...`), `TraineeRetentionReviewAB.feature`, and the Postman collection (request 10 tests the
  new fields; request 02's description lists them).

## Bug fixed along the way

`src/local-oidc.js` set the local token's `sub` from `user.email`, which doesn't exist (local users keep it in
`user.profile.email`), so local tokens had no `sub`. Present since the initial commit; harmless until now because
nothing persisted it. The API sets `createdBy`/`reviewedBy` from `sub`, so retain/review failed locally with
a not-null violation. Fixed to `user.profile.email`. **After pulling this, sign out and back in** - the old token
lives in the session. Real Okta tokens always had `sub`, so dev/prod were never affected.

This also answers the old open question: `createdBy` / `reviewedBy` hold the user's **email**.

## Local testing setup

- smart-api needs the branch build: `docker-compose.yaml:50` is pinned (committed in `ed279ae`) to
  `smart-api:1.0.4-trainee-retention-backend`, the test container pushed by the smart-api Jenkins job
  (`PUSH_TEST_CONTAINER`). CI uses the same compose file, so it gets this image too.
  **Switch to the released smart-api version once smart-api merges**, so master doesn't depend on a branch build.
- `smart-api-test-db` can stay at `1.0.179`: smart-api runs Liquibase on start and migrations 070-072 are idempotent.
- `COMPOSE_PROFILES=default,api` (not `full`, which starts a `smart-ui` container on port 2997 and makes
  `npm start` crash while the old container keeps serving).
- `podman compose down` + `up` resets the DB (data is baked into the image) - clears all overrides/reviews.
- Older (10+ year) trainees in the seed data don't appear unless they have an override. Don't run the
  deletion lambda against the local DB while testing.
- `OKTA_SCOPE_AB` in `.env` must include `trainees:read:all` and `trainees:write:all`.

## API contract (for reference)

Base path `/v1/trainee-retention-overrides`. Scopes: `trainees:read:all` for GETs, `trainees:write:all` otherwise.
Nulls are omitted from JSON. Errors are `{code, status, message, timestamp}`; validation/rule failures are 400.
Paging: `page` (1-based), `limit`, `sort`, `order`; response `{ data, meta: { totalPages, thisPage, pageSize, totalItems, sort, order } }`.

- `GET /candidates` - filters `reviewStatus` (`NeedsReview`|`Reviewed`|`Retained`), `trainingProviderId`,
  `contactName` (contains), `dueAtNextRun`. Row: `id, trainingProviderId, companyName, contactName, matsuNumber,
  dateOfBirth, status, lastActiveDate, deletionDate, deletionRunDate, dueAtNextRun, reviewStatus`, plus
  `extendedUntil, reason, retainedBy, retained` (if override), `extendedBy, extended` (once the override has
  been extended - `extended` is null until then, as the table's `updated` is also set on create) and
  `reviewNote, reviewedBy, reviewed` (if review).
- Override response (`GET /{traineeId}` etc.): `{ id, trainee, extendedUntil, reason, createdBy, created, updatedBy, updated }`.
- `GET /candidates/summary` - `{ needsReview, reviewed, retained, total, dueAtNextRun, needsReviewDueAtNextRun,
  nextRunDate }`, no filters, all counted in one query. `needsReviewDueAtNextRun` (due and still needing a
  decision) drives the warning; the UI no longer makes its own count call.
- Overrides: `POST /` `{traineeId, extendedUntil, reason}` (400 if one already exists - use PUT),
  `PUT /{traineeId}`, `DELETE /{traineeId}`, `GET /{traineeId}` (404 if none). Retaining deletes any review.
- Reviews: `POST /reviews` `{traineeId, note?}` (400 if not listed, Retained or already Reviewed),
  `DELETE /reviews/{traineeId}`, `GET /reviews/{traineeId}`.

## Still open

- **Before merging:** smart-api must merge first; then replace the pinned branch build
  (`1.0.4-trainee-retention-backend`) with the released smart-api tag in `docker-compose.yaml`.
  Eddie will handle the PR separately.
- **WDIO journey done and passing locally:** `test/browser/journeys/admin-trainee-retention-review.spec.js`
  (page object `test/browser/pages/trainee-retention.js`, in the `admin` suite). Retains one trainee (incl. the
  empty-reason error) and marks another reviewed, picking candidates from `vw_trainee_retention_candidates` and
  cleaning up after itself. CI uses the pinned branch build of smart-api, so it has the view and endpoints.
  It relies on the seed data having trainees 9.5-10 years old, a window that moves monthly.
  If chromedriver fails with "folder exists but the executable is missing", delete that cached folder and re-run.
- **Optional later:** an "All overrides" link using `GET /` for an override whose trainee isn't on the list.

## Questions for the client

1. Keep the deletion warning, the "N trainees need review" line, or slim the page down? (Eddie finds it a bit busy.)
2. Bring back MATSU number / date of birth as table columns?
3. Should Reviewed rows offer Retain directly instead of Undo first?

## Separate tickets (not this work)

- `handleRedirect` (`src/controllers/common.js:37`) follows any `?return=` URL - open redirect after form posts.
  `safeReturnUrl` is there to fix it.
- `src/okta-oidc.js:131` and `:144` log the refresh token and full token response at debug level - remove.
- `../smart-api/Jenkinsfile:48` has `OKTA_CLIENT_SECRET` in plain text - move to Jenkins credentials and rotate.
- Lint is broken: `eslint.config.js` uses old `.eslintrc` keys in a flat config (fails since the initial commit);
  `npm run lint` needs `standard`, which isn't in `devDependencies`, and its `src/**/*.js` glob skips every `.mjs` file.
  The retention files pass `eslint-config-standard` cleanly.
