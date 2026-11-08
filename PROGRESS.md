# Uni Deliver: Progress Tracker

**Group 07 · IS5109 Community Project** · Based on *Uni Deliver Implementation Guide (7 Oct 2026)*

> **Last updated:** 2026-11-08 by T. Saruhasan · **Branch:** `develop` · **Latest commit:** `02ee6d0`
>
> **Branching:** work on `feature/<TASK-ID>-<name>` branches cut from `develop` (e.g. `feature/SAR-3-profiles`), open PRs into `develop`, partner reviews. `main` only receives release merges from `develop`. Details in [SETUP.md](SETUP.md#branching).

This file is the single place to see **what is done, what is next and who owns it**. It mirrors the
36 work packages (6 members × 6 phases) from the implementation guide.

---

## How to use this file

1. **Tick a box** by changing `- [ ]` to `- [x]`. GitHub and VS Code render these as checkboxes, so you can also click them in the GitHub web editor.
2. **Only tick what is verified.** The guide's rule applies: *a screenshot alone does not verify backend behaviour, and unrun tests are not "passed".* If something works only with fixtures or mocks, write `(fixture)` or `(mocked)` next to it.
3. **Add evidence** next to the item: a commit hash, PR link or test command, for example `- [x] Login rejects wrong password (a1b2c3d, `npm test`)`.
4. **Update the task status** in the work-package header and the [Dashboard](#dashboard) when a package moves.
5. **Log it** in the [Change log](#change-log) at the bottom with the date and your name.
6. Change `Last updated` at the top.

**Status legend** (same as the board in the guide):

| Status | Meaning |
| --- | --- |
| ⬜ Backlog | Identified, not ready to start |
| 🟦 Ready | Owner, scope, acceptance criteria and dependency contracts are clear |
| 🟨 In Progress | Being implemented or documented |
| 🟪 Review | Implementation and evidence ready for the partner's review |
| 🟧 Testing | Reviewed work being checked against acceptance criteria |
| ✅ Done | Checks pass, review complete, docs updated, evidence linked |
| 🟥 Blocked | Waiting on a dependency (name the owner and the follow-up) |

---

## Dashboard

### Phase overview

| Phase | Target | Status | Notes |
| --- | --- | --- | --- |
| P1 Design and contracts | Week 7 | 🟨 In Progress | Auth contracts and architecture doc done. Order, delivery, fee/COD, catalogue and admin contracts not yet published. |
| P2 Foundation | Week 8 | 🟨 In Progress | Mobile shell, auth, backend shell and admin login are built. Cart, rider, fee, catalogue and dashboard foundations not started. |
| P3 Core features | Weeks 9-10 | ⬜ Backlog | Blocked until P1 contracts and P2 foundations exist. |
| P4 Integration | Week 11 | ⬜ Backlog | |
| P5 Verification | Weeks 12-13 | ⬜ Backlog | |
| P6 Release and handover | Week 14 | ⬜ Backlog | |

### Work packages by member

| Member | Team | P1 | P2 | P3 | P4 | P5 | P6 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T. Saruhasan | Customer | 🟨 SAR-1 | 🟪 SAR-2 | 🟨 SAR-3 | ⬜ SAR-4 | ⬜ SAR-5 | ⬜ SAR-6 |
| H.K.A. Uthkarsha | Customer | ⬜ UTH-1 | 🟨 UTH-2 | ⬜ UTH-3 | ⬜ UTH-4 | ⬜ UTH-5 | ⬜ UTH-6 |
| H.M.C.B. Subasinghe | Delivery Agent | ⬜ SUB-1 | 🟨 SUB-2 | ⬜ SUB-3 | ⬜ SUB-4 | ⬜ SUB-5 | ⬜ SUB-6 |
| R. Kirisshoban | Delivery Agent | ⬜ KIR-1 | ⬜ KIR-2 | ⬜ KIR-3 | 🟨 KIR-4 | ⬜ KIR-5 | ⬜ KIR-6 |
| L.H.S.H. Dilrukshi | Administrator | ⬜ DIL-1 | 🟨 DIL-2 | 🟨 DIL-3 | ⬜ DIL-4 | ⬜ DIL-5 | ⬜ DIL-6 |
| M. Sharupan | Administrator | ⬜ SHA-1 | ⬜ SHA-2 | ⬜ SHA-3 | ⬜ SHA-4 | ⬜ SHA-5 | ⬜ SHA-6 |

> 🟨 on a later-phase package (for example SAR-3, DIL-3, KIR-4) means some groundwork was laid early as part of the auth work. It does **not** mean the package has started properly. See the ticked items under each package.

### Integration gates

- [ ] **ALL-P1**: all six Phase 1 contracts and shared decisions reviewed
- [ ] **I1**: all Phase 4 work integrated; order → delivery → COD journey can be exercised end to end
- [ ] **R1**: Phase 5 evidence accepted, release-blocking defects fixed, external configuration ready

---

## What has been done so far

Everything below is in the repository today. All commits so far are by T. Saruhasan.

### Documentation

- `README.md`: project overview, features, tech stack, roles, order lifecycle, timeline and team.
- `architecture.md` (839 lines): system design covering data models (§8), REST endpoints (§7.5), order state machine (§9), realtime and notifications (§10), security mapping SR01–SR10 (§12), testing (§15) and requirement traceability (§17).
- `SETUP.md`: how to run backend, admin and mobile locally (added 2026-11-08).

### Shared package (`packages/shared`)

- Enums: `Role`, `AccountStatus`, `OrderStatus` (pending → accepted → preparing → picked_up → out_for_delivery → delivered, plus cancelled), `PaymentMethod`, `PaymentStatus`.
- Campus drop-off points (`DROP_OFF_POINTS`), password and reset-code constants.
- zod schemas used by all three apps: register, login, forgot/reset password, update profile, push token, create rider, update user status.
- Shared types: `UserDto`, `ApiResponse`.

### Backend (`backend/`, Express 5 + TypeScript + MongoDB)

- App shell: env validation with zod (`config/env.ts`), MongoDB connection, CORS, consistent error format (`middleware/errorHandler.ts`, `utils/errors.ts`), request-body validation (`middleware/validate.ts`), in-memory rate limiting (`middleware/rateLimit.ts`), `/health` endpoint.
- **Authentication:**
  - Email or phone + password with scrypt hashing (`utils/password.ts`).
  - Backend-issued JWT; the role is always re-read from MongoDB, never trusted from the token.
  - Password reset with a 6-digit code, 5 attempts per code and rate limits.
  - `POST /auth/session` accepts a Firebase ID token for the admin portal.
  - Development-only `dev:` tokens.
- **Authorization:** `authenticate` and `authorize(...roles)` middleware. Suspended accounts get `403 ACCOUNT_SUSPENDED`. Signup always creates a `customer`; clients cannot choose admin or rider.
- Endpoints (`/api/v1`):
  - Auth: `POST /auth/register`, `/auth/login`, `/auth/password/forgot`, `/auth/password/reset`, `/auth/session`, `GET /auth/me`
  - Users: `PATCH /users/me`, `POST|DELETE /users/me/push-token`
  - Admin: `GET /admin/users`, `POST /admin/riders`, `PATCH /admin/users/:id/status`
- User model with roles, status, drop-off point, saved-address sub-documents, rider details (vehicle, availability) and push tokens.
- `npm run seed:admin` creates or updates the admin account.
- Unit tests: `npx tsx src/test/auth.unit.test.ts` covers user formatting and push-token add/remove. Passed on 2026-11-08.

### Mobile app (`mobile/`, Expo SDK 57 + Expo Router)

- One app for customers and riders. `src/app/index.tsx` routes by the role the **server** returns: customer → `(customer)`, rider → `(rider)`, admin → unsupported-role screen, suspended → account-suspended, incomplete profile → complete-profile.
- **Auth screens:** Welcome (onboarding), Register, Login (email or phone), Forgot password, Reset password (6-digit code), Complete profile, with a drop-off point picker.
- Animated splash that hands off frame-for-frame to the Welcome screen. Brand theme in `src/theme/brand.ts`.
- Session token in SecureStore (Keychain/Keystore) when "Remember me" is ticked, otherwise in memory only. Logout clears it.
- The API URL is resolved automatically from the Metro host in development, so a physical phone can reach the backend (`af3d33e`).
- Customer home and rider "available" tabs exist as **placeholders only**: they show the signed-in user and a sign-out button.

### Admin website (`admin/`, Next.js 16 + Tailwind 4)

- Login page, `AdminAuthContext` with session restore, and an admin-only role guard that signs out non-admins with "Access denied".
- Dashboard layout and overview page. **The KPI numbers are hard-coded sample values**, not real data.

---

## Known issues and decisions to confirm

These are not finished work. Each one names an owner. Move items to the relevant work package when they are picked up.

| # | Issue | Owner | Severity |
| --- | --- | --- | --- |
| 1 | **Identity design differs from the guide.** The guide proposes Firebase Authentication as the single provider. The team implemented backend JWT + password for mobile, with Firebase ID tokens kept for the admin portal. This needs a **recorded team decision** (SAR-1) and partner sign-off. | Saruhasan (all review) | High |
| 2 | **Admin login does not check the password yet.** `admin/src/context/AdminAuthContext.tsx` sends a development `dev:` token instead of signing in with Firebase. This only works while the backend runs in development mode, but it must be replaced before any deployment. | Dilrukshi (DIL-2) with Saruhasan | High |
| 3 | **Password-reset codes are only printed to the backend console.** No SMS or email provider is configured (`auth.service.ts`, TODO). | Kirisshoban (provider setup, KIR-1/KIR-6) with Saruhasan | Medium |
| 4 | Phone-number verification (OTP) at signup is not implemented. Decide whether it is required (SAR-1 decision). | Saruhasan | Medium |
| 5 | No `.env.example` files; the README env section refers to old `apps/api`, `apps/mobile` paths and a `seed:demo` script that does not exist. `SETUP.md` has the correct steps. | Saruhasan / Uthkarsha (UTH-2) | Low |
| 6 | `npm test` in `backend/` only prints an error. Tests run with `npx tsx src/test/auth.unit.test.ts`. A real test runner and an API test database are needed. | Uthkarsha (UTH-2) | Medium |
| 7 | Production build: `npm run build && npm start` in `backend/` needs `@unideliver/shared` built and linked. Development (`tsx`) resolves it from source. | Uthkarsha / Kirisshoban (UTH-6) | Medium (before release) |
| 8 | Rate limiting is in memory: it resets on restart and won't work across multiple server instances. | Uthkarsha (UTH-6) | Low |
| 9 | Admin dashboard KPIs are hard-coded. Replace with report queries. | Sharupan (SHA-2/SHA-3) | Low |
| 10 | Order, catalogue, delivery-zone, settings, feedback and audit-log models from `architecture.md` §8 do not exist in code yet. | Uthkarsha, Dilrukshi, Sharupan | Expected, P2/P3 |

---

## What should be done next

Ordered by what unblocks the most people. Phase 1 contracts come first because every Phase 2 and 3 package lists **ALL-P1** as a prerequisite.

### Immediately (finish Phase 1, target: this week)

| Priority | Task | Owner | Why it matters |
| --- | --- | --- | --- |
| 1 | **UTH-1** Publish the order schema, lifecycle transition matrix (who can make each transition), pricing snapshot and idempotency fields | Uthkarsha (with Subasinghe and Sharupan) | Rider, fee, COD, report and checkout work all depend on the order contract |
| 2 | **DIL-1** Publish catalogue (restaurant/menu) read and write contracts, account-admin rules and fee-rule schema | Dilrukshi (with Kirisshoban and Saruhasan) | Blocks SAR-3 browsing, KIR-2 fees and UTH-3 checkout |
| 3 | **KIR-1** Fee inputs and rounding, COD record states, audited correction rules, Socket.IO/FCM event payloads, rider earnings meaning | Kirisshoban | Blocks checkout totals and every notification |
| 4 | **SUB-1** Atomic assignment contract, accept/reject rules, data visible before and after assignment | Subasinghe | Blocks rider screens and the admin assignment UI |
| 5 | **SHA-1** Report metric definitions, timezone, feedback contract, reconciliation/correction UI needs | Sharupan | Blocks UTH-4 feedback form and the dashboard |
| 6 | **SAR-1** Record the identity decision (issue #1), OTP/recovery decision (#3, #4); publish profile/address contracts; review DIL-1 | Saruhasan | Closes the auth contract formally |
| 7 | **Team** Agree and write down the shared decisions from page 3 of the guide: cancellation policy, assignment behaviour, delivery zones and fees, earnings formula, complaint handling, COD corrections, image storage, timezone (suggest `Asia/Colombo`), supported Android devices | Everyone; Sharupan takes notes | Required for ALL-P1 |

### Then (Phase 2 foundations)

- **Saruhasan:** close SAR-2 (partner review by Uthkarsha, add `.env.example` files, token-rejection tests), then start SAR-3 profile and saved-address screens.
- **Uthkarsha:** UTH-2 order model, cart screen, fee and catalogue adapters, real test runner.
- **Subasinghe:** SUB-2 rider tabs (profile, request list, delivery detail) inside the existing `(rider)` route group, assignment model.
- **Kirisshoban:** KIR-2 fee calculator, COD record schema, Socket.IO/FCM adapter interfaces with test doubles.
- **Dilrukshi:** DIL-2 replace the admin `dev:` login with real Firebase sign-in (issue #2); catalogue models, read endpoints and seed data.
- **Sharupan:** SHA-2 dashboard, order list and report layouts inside the admin shell; feedback model.

---

## Detailed work packages

Each package lists the work steps and the completion checks from the guide. Tick work steps as they are
finished; tick completion checks only when they are verified with evidence.

<!-- ───────────────────────────── CUSTOMER TEAM ───────────────────────────── -->

## Customer team

### T. Saruhasan · Reviewer: H.K.A. Uthkarsha

#### SAR-1 Authentication and customer contracts · Week 7 · 10 units · 🟨 In Progress

Prerequisites: none

**Work steps**
- [x] Inspect the project and proposal
- [x] Design authentication, profiles, saved addresses, delivery instructions and customer browsing (`architecture.md` §5, §7.5, §8.1)
- [ ] Record the team decision on the identity provider. Implemented: backend JWT for mobile, Firebase for admin. The guide proposed Firebase only. See issue #1.
- [ ] Define phone verification and recovery flows. Recovery uses a 6-digit code (implemented); delivery provider and OTP are undecided (issues #3, #4).
- [x] Specify access rules, sample payloads and failure states for auth (`architecture.md` §7.3–7.4; error codes in `utils/errors.ts`)
- [ ] Coordinate contracts with all members

**Completion checks**
- [ ] Document customer, rider and admin identity/role rules; agree OTP and recovery behaviour (rules documented; OTP/recovery agreement pending)
- [ ] Publish profile/address contracts and browsing needs; review the DIL-1 catalogue contract

#### SAR-2 Shared mobile shell and authentication · Week 8 · 15 units · 🟪 Review

Prerequisites: ALL-P1 (started early)

**Work steps**
- [x] Create the shared Expo mobile shell and authentication screens (`15508c6`, `e2bcb12`, `59c6e45`)
- [x] Implement sign-in, customer registration and recovery
- [ ] Phone-verification flow (pending decision, issue #4)
- [x] Reusable Express `authenticate` / `authorize` guards and `GET /auth/me` contract (`93a3dac`)
- [x] Persist profile and role data in MongoDB; passwords stored only as scrypt hashes
- [x] Prevent client-selected admin/rider roles: `registerSchema` has no role field; register always creates `customer`
- [ ] Configuration placeholders for secrets: add `backend/.env.example`, `admin/.env.local.example`, `mobile/.env.example`
- [ ] Coordinate server bootstrapping with Uthkarsha
- [x] Reserve rider navigation for Subasinghe (`src/app/(rider)/` route group exists with a placeholder tab)

**Completion checks**
- [x] One Expo app routes customers and approved riders to their screens (`mobile/src/app/index.tsx`). Verified manually on Android; rider screens are placeholders.
- [ ] Backend token verification rejects invalid/expired tokens and disabled accounts; signup cannot set privileged roles. Implemented in `authenticate.ts` and `authorize.ts`; **needs automated tests and Uthkarsha's review** before ticking.

#### SAR-3 Profiles, addresses and catalogue browsing · Weeks 9-10 · 25 units · 🟨 Groundwork only

Prerequisites: SAR-2; DIL-2 catalogue contract

**Work steps**
- [ ] Profile editing screen. Backend `PATCH /users/me` exists (name, email, drop-off point).
- [ ] Saved locations and hostel/building/room delivery instructions with ownership checks. The address sub-schema exists on the user model; no API or screens yet.
- [ ] Outlet and menu lists, item detail, search and filters using Dilrukshi's read APIs
- [x] Secure session persistence and logout (SecureStore + "Remember me")
- [ ] Contract fixtures for the catalogue until DIL-2 is live (label them clearly)
- [ ] Profile-access and browsing tests

**Completion checks**
- [ ] Users can maintain only their own profile and saved addresses
- [ ] Outlet/menu search, filters, availability and loading/empty/error states work against the catalogue API

#### SAR-4 Customer navigation and checkout handoff · Week 11 · 20 units · ⬜ Backlog

Prerequisites: SAR-3; UTH-3; DIL-3

**Work steps**
- [ ] Connect menu selection to Uthkarsha's cart and saved-address selection to checkout
- [ ] Replace catalogue fixtures with the live API
- [ ] Verify role routing, session expiry, logout, loading states and connectivity recovery on Android
- [ ] Coordinate Expo configuration and push-token registration with Kirisshoban
- [ ] Fix owned integration defects; document agreed shared changes

**Completion checks**
- [ ] Selected items and address reach Uthkarsha's checkout correctly
- [ ] Approved riders and customers see the correct screens after login; retry and logout paths verified

#### SAR-5 Authentication and customer usability verification · Weeks 12-13 · 20 units · ⬜ Backlog

Prerequisites: SAR-4; gate I1

**Work steps**
- [ ] Automated tests and Android checks for auth and profile boundaries
- [ ] Exercise expired tokens, deactivation, unauthorized role changes, another user's address, failed network calls and recovery
- [ ] Customer usability walkthrough (with permission); fix owned defects
- [ ] Cross-review Subasinghe's delivery access tests
- [ ] Record test commands, actual results and unresolved issues

**Completion checks**
- [ ] Invalid tokens, role escalation, cross-user profile access and disabled accounts are rejected
- [ ] A representative customer completes sign-in, browsing and address selection; findings and fixes recorded

#### SAR-6 Mobile release and customer handover · Week 14 · 10 units · ⬜ Backlog

Prerequisites: SAR-5; gate R1

**Work steps**
- [ ] Android release build with Subasinghe
- [ ] Customer navigation, sign-in/provider settings and customer smoke tests
- [ ] Reproducible build/config instructions and customer guide (registration, addresses, browsing)
- [ ] Verify the installed build against the release backend; capture evidence; document rollback
- [ ] Prepare the individual demo segment
- [ ] Record store publication only after it succeeds

**Completion checks**
- [ ] Android build includes verified customer and rider navigation; no secrets embedded
- [ ] Customer guide, environment checklist and demo segment ready

---

### H.K.A. Uthkarsha · Reviewer: T. Saruhasan

#### UTH-1 Orders, pricing snapshots and lifecycle contract · Week 7 · 10 units · ⬜ Backlog

Prerequisites: none. **This is the most-blocking open contract.**

**Work steps**
- [ ] Design the cart, checkout, order, cancellation and history contract (draft exists in `architecture.md` §8.4 and §9; review and publish it)
- [ ] Integer minor-unit LKR amounts, server-validated item prices, delivery-fee snapshots, customer-scoped idempotency key
- [ ] Order lifecycle and allowed actor per transition, agreed with Subasinghe and Sharupan (`OrderStatus` enum already exists in `packages/shared`)
- [ ] Read contracts for customer tracking, admin reports and rider requests
- [ ] Record unresolved business decisions and example valid/invalid requests

**Completion checks**
- [ ] Shared order schema, cancellation rule proposal, idempotency and pricing snapshot fields published
- [ ] Lifecycle agreed with Subasinghe/Sharupan; fee/payment interfaces agreed with Kirisshoban

#### UTH-2 Shared backend shell and cart foundation · Week 8 · 15 units · 🟨 In Progress

Prerequisites: ALL-P1

**Work steps**
- [x] Shared Express TypeScript backend, MongoDB connection, validation and error conventions (built during the auth work, `93a3dac`)
- [ ] Test entrypoint: real runner (for example Vitest or Jest + supertest) and a test database; make `npm test` work (issue #6)
- [x] Use Saruhasan's auth middleware (`authenticate`, `authorize`). Nothing to recreate.
- [ ] Order model and mobile cart flow (quantity validation, item removal, totals placeholders)
- [ ] Adapters for Kirisshoban's fee calculation and Dilrukshi's catalogue
- [ ] Contract fixtures for other teams

**Completion checks**
- [ ] Shared Express/MongoDB app runs with validation, consistent errors and documented setup (runs and is documented in `SETUP.md`; tick after Uthkarsha reviews)
- [ ] Cart screen supports adding/removing items and valid quantities; checkout not falsely marked integrated

#### UTH-3 Checkout and reliable order placement · Weeks 9-10 · 25 units · ⬜ Backlog

Prerequisites: UTH-2; SAR-2; DIL-2; KIR-2

**Work steps**
- [ ] Checkout and order creation against live catalogue, address and fee services
- [ ] Reject unavailable items and invalid quantities; calculate totals on the server; store item/fee snapshots and a clear bill
- [ ] Idempotency with a unique DB constraint and request-payload check
- [ ] Enforce customer ownership
- [ ] Tests: success, price tampering, unavailable item, concurrent duplicate requests
- [ ] Keep cart data until the outcome is known; usable retry state

**Completion checks**
- [ ] Server recalculates prices/fees and stores immutable order cost snapshots
- [ ] Repeated submission creates one order; changed payload with a reused key is rejected

#### UTH-4 Tracking, cancellation, history and customer feedback · Week 11 · 20 units · ⬜ Backlog

Prerequisites: UTH-3; SUB-3; KIR-3; SHA-3

**Work steps**
- [ ] Order-progress timeline, history, bill/payment detail and cancellation using the agreed lifecycle
- [ ] Consume delivery updates and notifications; refetch order state on reconnect
- [ ] Show COD collection separately from delivery completion
- [ ] Complaint/feedback form using Sharupan's contract
- [ ] Validate cancellation races with rider acceptance; preserve price snapshots
- [ ] No live map tracking, no online payment gateway

**Completion checks**
- [ ] Tracking shows status progress without GPS; permitted cancellation enforced server-side
- [ ] Order/payment history and feedback reach the authoritative services

#### UTH-5 Order reliability and end-to-end verification · Weeks 12-13 · 20 units · ⬜ Backlog

Prerequisites: UTH-4; gate I1

**Work steps**
- [ ] Test retries, concurrent duplicates, changed catalogue prices, invalid addresses, forbidden cancellations, another customer's order ID
- [ ] Verify progress/history and feedback against the integrated system
- [ ] Backup/restore rehearsal with Kirisshoban (own backup config, restore procedure, order-record checks)
- [ ] Cross-review Kirisshoban's COD integrity tests
- [ ] Fix defects; document results and release blockers

**Completion checks**
- [ ] Duplicate requests, price changes, cancellation races and cross-customer access tested
- [ ] Complete order journey and database-restore smoke test have recorded outcomes

#### UTH-6 Backend release and order documentation · Week 14 · 10 units · ⬜ Backlog

Prerequisites: UTH-5; gate R1

**Work steps**
- [ ] Coordinate backend release with Kirisshoban
- [ ] Server startup, DB indexes, configuration docs, backup/restore steps, order API smoke tests (includes issues #7, #8)
- [ ] Verify validation, auth wiring and restart persistence in the release environment
- [ ] Order-flow guide, API examples, individual checkout/tracking demo
- [ ] Environment secrets documented (names only)
- [ ] Record what was actually deployed and operational limits

**Completion checks**
- [ ] Backend release, environment setup and rollback instructions verified
- [ ] Orders survive a restart; restored sample records match saved totals

<!-- ───────────────────────────── DELIVERY AGENT TEAM ───────────────────────────── -->

## Delivery Agent team

### H.M.C.B. Subasinghe · Reviewer: R. Kirisshoban

#### SUB-1 Rider assignment and delivery contract · Week 7 · 10 units · ⬜ Backlog

Prerequisites: none

**Work steps**
- [ ] Design rider profile, available requests, assigned delivery details, accept/reject, pickup/delivery updates
- [ ] Atomic assignment contract: no two riders take one order; admin assignment is consistent
- [ ] Unassigned requests show minimal non-sensitive data; address/contact only for the assigned rider
- [ ] Agree lifecycle and cancellation-race behaviour with Uthkarsha; admin actions with Sharupan
- [ ] Publish sample requests, responses and transition tests

**Completion checks**
- [ ] Available requests, admin assignment, accept/reject and access boundaries specified
- [ ] Transition matrix and race behaviour agreed with Uthkarsha and Sharupan

#### SUB-2 Rider shell and assignment foundation · Week 8 · 15 units · 🟨 Groundwork only

Prerequisites: ALL-P1; SAR-2 auth contract; UTH-2 order contract

**Work steps**
- [ ] Rider navigation, profile view, request list and delivery detail screens. The `(rider)` route group and an `available` tab placeholder already exist and use shared auth.
- [x] Reuse Saruhasan's identity/profile service (riders sign in through the same `/auth/login`; `rider.vehicleNo` / `isAvailable` on the user model)
- [ ] Reuse Uthkarsha's order model
- [ ] Assignment persistence and service interfaces
- [ ] Contract fixtures for assignment controls for Sharupan
- [ ] Role guards, minimal available-request fields, loading/empty/error states
- [ ] Separate fixture mode from live mode; list incomplete dependencies

**Completion checks**
- [ ] Rider navigation lives in the shared Expo app and uses shared authentication (route group exists; real screens pending)
- [ ] Assignment model and request/detail screens compile against documented fixtures

#### SUB-3 Accept, reject, assign and delivery progress · Weeks 9-10 · 25 units · ⬜ Backlog

Prerequisites: SUB-2; SAR-2; UTH-3

**Work steps**
- [ ] Rider accept/reject, admin assignment service, pickup/out-for-delivery/delivered actions
- [ ] Atomic DB conditions and expected state/version to prevent double assignment and stale updates
- [ ] Enforce active-rider eligibility and assigned-rider ownership on every mutation
- [ ] Reuse the shared lifecycle; no second order model
- [ ] Concurrency, forbidden-transition and cancellation-race tests

**Completion checks**
- [ ] Concurrent acceptance has exactly one winning rider; unauthorized status changes fail
- [ ] Assigned rider can view required details and make only allowed transitions

#### SUB-4 Assignment dashboard, alerts and COD handoff · Week 11 · 20 units · ⬜ Backlog

Prerequisites: SUB-3; SHA-3; KIR-3

**Work steps**
- [ ] Connect assignment services to Sharupan's dashboard; consume Kirisshoban's alerts
- [ ] COD screen handoff; delivered is not automatically paid
- [ ] Refetch assignment state on reconnect; handle reassignment/deactivation
- [ ] Shared mobile navigation and device config with Saruhasan
- [ ] Remove fixtures; test one full delivery; document admin/rider state disagreements

**Completion checks**
- [ ] Admin assignment and rider acceptance use the same service
- [ ] Rider receives alerts, sees authoritative progress and reaches the COD collection screen

#### SUB-5 Delivery concurrency, permissions and usability · Weeks 12-13 · 20 units · ⬜ Backlog

Prerequisites: SUB-4; gate I1

**Work steps**
- [ ] Tests: two riders accepting together, repeated status updates, cancelled orders, stale reassignment, customer data before assignment
- [ ] Poor-network recovery and rider usability on Android
- [ ] Cross-review Dilrukshi's catalogue/account permission tests
- [ ] Fix owned issues; update delivery workflow docs; record evidence and defects
- [ ] No real customer details in test logs

**Completion checks**
- [ ] Two-rider races, duplicate updates, unauthorized details and stale reassignment tested
- [ ] Rider trial completes pickup, delivery and COD handoff on an Android device

#### SUB-6 Rider Android release and field handover · Week 14 · 10 units · ⬜ Backlog

Prerequisites: SUB-5; gate R1

**Work steps**
- [ ] Co-own the Android release with Saruhasan
- [ ] Verify rider routes, permissions, alerts, acceptance, progress and COD handoff on supported devices
- [ ] Record build identifier, backend config and smoke-test evidence
- [ ] Rider guide and delivery demo, including how to report failed updates
- [ ] Confirm one build supports both roles
- [ ] Record failed provider/device checks honestly

**Completion checks**
- [ ] Installed release build passes rider login, request, progress and COD handoff checks
- [ ] Rider guide and supported-device test record included in handover

---

### R. Kirisshoban · Reviewer: H.M.C.B. Subasinghe

#### KIR-1 Fees, COD, notifications and earnings contracts · Week 7 · 10 units · ⬜ Backlog

Prerequisites: none

**Work steps**
- [ ] Fee calculation using Dilrukshi's zone/rule config; COD records, invoice summaries, rider history
- [ ] Integer minor-unit amounts; preserve order snapshots
- [ ] Duplicate-collection protection; privileged audited correction interface for Sharupan
- [ ] FCM/Socket.IO events and recipient authorization (draft in `architecture.md` §10)
- [ ] Confirm rider earnings semantics (collected food cash is not rider income)
- [ ] Record provider setup and phone/push feasibility separately (includes SMS/email for password-reset codes, issue #3)

**Completion checks**
- [ ] Fee inputs/rounding, COD state, invoice fields and audited correction rules specified
- [ ] Event payloads, recipients and the meaning of rider earnings agreed with the service provider

#### KIR-2 Fee service, payment model and event interfaces · Week 8 · 15 units · ⬜ Backlog

Prerequisites: ALL-P1; DIL-2 fee contract; UTH-2 order contract

**Work steps**
- [ ] Server-side fee calculator and COD record schema referencing orders
- [ ] Fee and payment summary APIs for checkout/history/admin
- [ ] Event contracts and FCM/Socket.IO adapter interfaces with env config and test doubles (`socket.io` is already a backend dependency but not wired)
- [ ] Exact amount validation and unique collection identifiers
- [ ] Tests for fee boundaries, invalid config and rounding
- [ ] Fee-rule CRUD stays with Dilrukshi; screen integration with each owner

**Completion checks**
- [ ] Fee calculator passes agreed examples and rejects unsupported zones
- [ ] Payment model and notification adapters expose documented contracts without real credentials

#### KIR-3 COD collection, invoice and rider history · Weeks 9-10 · 25 units · ⬜ Backlog

Prerequisites: KIR-2; UTH-3; SUB-2

**Work steps**
- [ ] Rider COD collection UI and service (assigned-rider/admin checks, atomic duplicate protection, time and amount)
- [ ] Consistent handling of invalid and repeated requests
- [ ] Bill/payment history and rider earnings (gross cash ≠ earnings)
- [ ] Privileged correction/reversal that preserves originals and audit info
- [ ] Tests: duplicate collections, amount tampering, cross-rider access, payment/order consistency

**Completion checks**
- [ ] Authorized assigned rider records COD once for the correct frozen total
- [ ] Invoice/history matches order snapshots; admin correction preserves an audit trail

#### KIR-4 Push, realtime notifications and consumer integration · Week 11 · 20 units · 🟨 Groundwork only

Prerequisites: KIR-3; SAR-2; UTH-3; SUB-3; SHA-3

**Work steps**
- [ ] Shared FCM push and authenticated Socket.IO delivery using agreed events
- [ ] Register, refresh and remove device tokens securely. Register and remove endpoints exist (`POST|DELETE /users/me/push-token`); refresh and the mobile-side registration do not.
- [ ] Authorize subscriptions/rooms from verified roles
- [ ] Rider alert UI; help owners connect their screens
- [ ] Emit only after successful state changes; provider failures don't undo orders/payments
- [ ] Deduplicate events; refetch on reconnect
- [ ] Real-device delivery tests separate from mocked transport tests

**Completion checks**
- [ ] Authenticated sockets and push tokens deliver only to authorized recipients
- [ ] Foreground/background notification checks and reconnect/refetch behaviour recorded

#### KIR-5 Payment, notification and recovery verification · Weeks 12-13 · 20 units · ⬜ Backlog

Prerequisites: KIR-4; gate I1

**Work steps**
- [ ] Concurrent COD collection, retry, admin corrections, fee changes after checkout, report totals
- [ ] Unauthorized socket subscriptions fail; push failures don't corrupt transactions
- [ ] Token expiry/logout and offline reconnection
- [ ] Join Uthkarsha's restore rehearsal; check restored payments against orders and audit entries
- [ ] Cross-review Sharupan's report and reconciliation tests
- [ ] Record real provider/device evidence or mark provider config as blocked

**Completion checks**
- [ ] COD retries/corrections and fee snapshot consistency verified
- [ ] Notification permission isolation, provider failure and restored-payment consistency tested

#### KIR-6 Payment and notification production setup · Week 14 · 10 units · ⬜ Backlog

Prerequisites: KIR-5; gate R1

**Work steps**
- [ ] Co-own backend release with Uthkarsha
- [ ] Fee/COD and notification config, runtime credential checks, provider/device smoke tests, payment consistency after deploy
- [ ] Document notification troubleshooting, COD correction procedure, earnings formula, operational limits
- [ ] Verify secrets are excluded from source and logs
- [ ] Individual payment/notification demo; report real success or blocked setup

**Completion checks**
- [ ] Release fee/COD smoke tests pass; push/socket config and actual delivery result documented
- [ ] Recovery checks, provider limits and operational handover instructions recorded

<!-- ───────────────────────────── ADMINISTRATOR TEAM ───────────────────────────── -->

## Administrator team

### L.H.S.H. Dilrukshi · Reviewer: M. Sharupan

#### DIL-1 Catalogue, account and settings contracts · Week 7 · 10 units · ⬜ Backlog

Prerequisites: none

**Work steps**
- [ ] Restaurant/menu records and read APIs for Saruhasan; admin CRUD, images, categories, availability, account management, fees and settings (drafts in `architecture.md` §8.2, §8.3, §8.5)
- [ ] Validation, admin authorization, audit records, safe deactivation that preserves historical orders
- [ ] Agree image-storage approach and upload limits
- [ ] Fee rules with Kirisshoban; account activation/role-change contracts with Saruhasan
- [ ] Publish sample payloads and acceptance cases

**Completion checks**
- [ ] Catalogue read/write, account administration and fee-rule schemas published
- [ ] Availability/deactivation rules, image handling and active-account enforcement agreed with Saruhasan

#### DIL-2 Admin shell, catalogue and settings foundation · Week 8 · 15 units · 🟨 In Progress

Prerequisites: ALL-P1; SAR-2 auth contract

**Work steps**
- [x] Shared Next.js admin shell, navigation and login integration with the identity service (`219730a`)
- [ ] Replace the development `dev:` token login with real Firebase sign-in (issue #2)
- [ ] Reserve dashboard/report sections for Sharupan
- [ ] Catalogue models, read endpoints, seed fixtures, fee-rule/settings schemas in the backend
- [ ] Catalogue reads for Saruhasan; fee config access for Kirisshoban
- [ ] Admin-only write validation and loading/error conventions
- [ ] Coordinate shared layout changes with Sharupan

**Completion checks**
- [ ] Next.js admin shell and login guard work with the agreed identity service (guard works; real sign-in pending, issue #2)
- [ ] Catalogue/fee APIs and models expose stable contracts and seeded non-sensitive data

#### DIL-3 Catalogue CRUD, accounts and fee settings · Weeks 9-10 · 25 units · 🟨 Groundwork only

Prerequisites: DIL-2; SAR-2

**Work steps**
- [ ] Restaurant/menu CRUD, image handling, category/price/availability controls, validated config forms/APIs
- [ ] Account activation/deactivation and rider management. Backend endpoints exist (`GET /admin/users`, `POST /admin/riders`, `PATCH /admin/users/:id/status`); the admin UI does not.
- [ ] Soft deactivation that preserves historical records
- [ ] Zone/fee/service settings for Kirisshoban's calculator, with audit entries
- [ ] API validation and admin-access tests; no client-set prices or roles

**Completion checks**
- [ ] Admin can manage restaurants/items/images/availability and approved rider accounts
- [ ] Customers cannot change roles or fees; deactivation enforced; historical orders intact

#### DIL-4 Catalogue, checkout and admin navigation integration · Week 11 · 20 units · ⬜ Backlog

Prerequisites: DIL-3; SAR-3; UTH-3; KIR-3; SHA-3

**Work steps**
- [ ] Live catalogue with Saruhasan's browsing and Uthkarsha's checkout (availability rechecked; snapshots preserved)
- [ ] Fee settings connected to Kirisshoban's service; check new vs existing orders
- [ ] Merge admin navigation and account controls with Sharupan's dashboard
- [ ] Verify deactivation on later requests, config errors, image upload failures

**Completion checks**
- [ ] Menu availability changes reach browsing and are rechecked at checkout
- [ ] Fee changes affect new orders only; admin sections share navigation and permissions

#### DIL-5 Admin data validation and cross-team verification · Weeks 12-13 · 20 units · ⬜ Backlog

Prerequisites: DIL-4; gate I1

**Work steps**
- [ ] Verify admin-only writes, invalid prices, unsupported uploads, unavailable items, deactivation, audited role changes
- [ ] Check historical order amounts after catalogue/fee edits
- [ ] Service-provider walkthrough for catalogue and settings; fix defects
- [ ] Cross-review Saruhasan's auth/profile tests
- [ ] Admin configuration docs and evidence; keep unresolved defects visible as blockers

**Completion checks**
- [ ] Catalogue validation, malicious uploads, role/account changes and historical retention verified
- [ ] Service provider can update a menu and fee rule; feedback and fixes recorded

#### DIL-6 Admin deployment and configuration handover · Week 14 · 10 units · ⬜ Backlog

Prerequisites: DIL-5; gate R1

**Work steps**
- [ ] Co-own admin deployment and handover with Sharupan
- [ ] Environment setup, admin auth, catalogue/settings/account smoke tests, deployment/rollback instructions
- [ ] Browser build talks to the intended backend without server secrets
- [ ] Assemble technical setup contributions from all members (start from `SETUP.md`)
- [ ] Individual admin demo; record actual deployment status

**Completion checks**
- [ ] Admin release uses the correct backend/auth config and passes catalogue/account smoke tests
- [ ] Environment/setup guide and assembled member documentation complete

---

### M. Sharupan · Reviewer: L.H.S.H. Dilrukshi

#### SHA-1 Admin operations, reports, feedback and reconciliation contracts · Week 7 · 10 units · ⬜ Backlog

Prerequisites: none

**Work steps**
- [ ] Admin order monitoring, assignment UI and operational status controls using Uthkarsha's and Subasinghe's services
- [ ] Separate metrics: daily order count, gross food value, collected COD, delivery fees, delivery performance; agree timezone and report boundaries
- [ ] Feedback submission/read/admin-resolution contracts for Uthkarsha (draft model in `architecture.md` §8.6)
- [ ] Reconciliation and corrections using Kirisshoban's payment service
- [ ] Publish dashboard wireframes, permissions and example report calculations

**Completion checks**
- [ ] Monitoring, assignment actions and report metric definitions specified
- [ ] Feedback submission/admin handling and audited payment-correction UI needs defined

#### SHA-2 Dashboard shell and report query foundations · Week 8 · 15 units · ⬜ Backlog

Prerequisites: ALL-P1; DIL-2 admin layout contract; UTH-2; KIR-2

**Work steps**
- [ ] Dashboard, order list/detail, report and feedback layouts in the admin shell (an overview page exists with **hard-coded** KPIs, issue #9)
- [ ] Read/query interfaces over shared order/payment models; labelled fixtures until live
- [ ] Feedback model and submission/admin handling contract with ownership checks
- [ ] Pagination, date filters, timezone treatment
- [ ] Assignment/correction UI adapters for Subasinghe and Kirisshoban (no duplicated mutation logic)

**Completion checks**
- [ ] Dashboard/order list layouts and report interfaces use shared models and agreed contracts
- [ ] Feedback backend scaffold has ownership rules and a stable contract for Uthkarsha

#### SHA-3 Operations dashboard, reports and feedback handling · Weeks 9-10 · 25 units · ⬜ Backlog

Prerequisites: SHA-2; SAR-2; UTH-3; SUB-2; KIR-2

**Work steps**
- [ ] Live order monitoring, preparing/acceptance controls, rider assignment UI, daily summaries, delivery-performance reports
- [ ] Invoke agreed order/delivery services and authorize every action
- [ ] Feedback API, admin queue, responses/status changes, audit entries
- [ ] Metrics from authoritative records with pagination and date boundaries
- [ ] Tests: seeded totals, empty periods, access rules; never count all collected food cash as platform revenue

**Completion checks**
- [ ] Admin can monitor orders and invoke only allowed operational actions
- [ ] Reports reconcile against known sample data; feedback submission and resolution persist with permissions

#### SHA-4 Realtime dashboard and payment reconciliation · Week 11 · 20 units · ⬜ Backlog

Prerequisites: SHA-3; SUB-3; KIR-3; KIR-4 event contract; UTH-4

**Work steps**
- [ ] Dashboard alerts via Kirisshoban's transport; refetch affected records
- [ ] Wire Subasinghe's assignment APIs; reconciliation/correction screens via Kirisshoban's audited service
- [ ] Show delivered and paid states separately; handle stale conflicting actions
- [ ] Integrate Uthkarsha's feedback form with admin handling
- [ ] Verify reports after payment correction, cancellation and reassignment

**Completion checks**
- [ ] Dashboard refreshes from authoritative data after alerts; assignment and COD corrections audited
- [ ] Customer feedback reaches admin; status changes respect the common lifecycle

#### SHA-5 Report reconciliation and admin acceptance testing · Weeks 12-13 · 20 units · ⬜ Backlog

Prerequisites: SHA-4; gate I1

**Work steps**
- [ ] Verify report totals against a known dataset (timezone boundaries, cancelled orders, unpaid delivered orders, reversals)
- [ ] Test role permissions, stale actions, feedback ownership
- [ ] Service-provider walkthrough; fix defects
- [ ] Cross-review Uthkarsha's order/idempotency tests
- [ ] Assemble acceptance evidence; list open blockers; admin operations guide

**Completion checks**
- [ ] Report totals match source records across dates, cancellations and payment corrections
- [ ] Service provider verifies monitoring, assignment, feedback and reconciliation workflows

#### SHA-6 Admin release verification and final presentation · Week 14 · 10 units · ⬜ Backlog

Prerequisites: SHA-5; gate R1

**Work steps**
- [ ] Co-own admin release and handover with Dilrukshi
- [ ] Live dashboard/report/assignment/feedback/reconciliation smoke tests; assemble all six members' guides, evidence and demo segments
- [ ] Rehearse the full journey: published menu → order → rider delivery → COD → matching reports
- [ ] Individual operations demo, release checklist, known-issues register
- [ ] Every member's contribution documented; nothing unverified described as complete

**Completion checks**
- [ ] Deployed dashboard reports match backend records; role restrictions hold
- [ ] All six guides/test records/demo segments assembled with a verified full-system demo

---

## Final acceptance and handover

### Full service journey (run after gate I1)

- [ ] 1. Dilrukshi publishes a restaurant/menu and delivery-fee rule; Sharupan verifies admin monitoring
- [ ] 2. Saruhasan verifies customer registration, browsing and address selection; Uthkarsha places an order and confirms retries create one order
- [ ] 3. Sharupan and Subasinghe exercise assignment; only the assigned rider sees customer details and updates progress
- [ ] 4. Uthkarsha verifies the customer timeline matches delivery updates; Kirisshoban verifies authorized alerts and reconnect
- [ ] 5. Kirisshoban records the correct COD amount exactly once; delivery and collection states stay distinct
- [ ] 6. Sharupan verifies reports and reconciliation against saved records; Uthkarsha verifies history and complaint submission

### Failure and access scenarios

Record expected result, actual result, pass/fail, evidence and defect owner for each.

- [ ] Unavailable menu items
- [ ] Price tampering
- [ ] Cancellation races
- [ ] Duplicate rider acceptance
- [ ] Duplicate payment attempts
- [ ] Account deactivation
- [ ] Invalid/expired sessions
- [ ] Access to another customer's records
- [ ] Unauthorized socket subscriptions
- [ ] Provider failures
- [ ] Interrupted network connections
- [ ] Backup restoration preserves orders, payments and audit records

### Release responsibilities

| Pair | Contribution |
| --- | --- |
| Saruhasan + Subasinghe | Android build, installed-build checks for customer/rider flows, mobile config and user guides |
| Uthkarsha + Kirisshoban | Backend/database config, fee/COD/notification checks, backup restoration, recovery guidance |
| Dilrukshi + Sharupan | Admin deployment, config/operations checks, assembling documentation and final demo material |

### Handover checklist

- [ ] All six members supply their feature guide, technical notes, test evidence and demo segment
- [ ] Release version, environment settings, setup steps, backup/recovery procedure, known issues and support responsibilities recorded
- [ ] Credentials kept in the agreed secure config; docs show names/examples only
- [ ] Deployed backend, installed mobile build and admin website verified together; rollback instructions available
- [ ] Service provider's acceptance feedback obtained; deferred features recorded; each member presents their contribution

---

## Change log

Newest first. One line per update: date · who · what changed.

| Date | Who | Change |
| --- | --- | --- |
| 2026-11-08 | T. Saruhasan | Created `develop` branch from `main` (after PR #2 merged `feature/auth`); docs now point to `develop` and describe the feature-branch workflow. |
| 2026-11-08 | T. Saruhasan | Created tracker from the implementation guide and recorded current repository state (auth, mobile shell, admin login, onboarding UI). Added `SETUP.md`. |
