# Cyborg Cheebee Office — Phase D v8 Layout Upgrade

This package contains the supplied `server.js` and `index.html`, the Phase B/C/D browser add-ons, and the server-side security/order corrections described below.

## Project layout

- `server.js` — Node.js backend (built-in Node modules only)
- `MASTER-UPGRADE-ROADMAP.md` — 100-item implementation roadmap and status
- `public/index.html` — office interface
- `public/phaseB.js`, `public/phaseC.js`, `public/phaseD.js` — browser add-ons
- `public/sw.js` — service worker cache `cheebee-v8`
- `data/` — created by the server at runtime; existing data is not included or overwritten by this ZIP

## Install carefully

1. Stop the running Node server.
2. Back up your entire existing project folder, especially `server.js`, `public/index.html`, and `data/`.
3. Extract this ZIP into the project root (the folder containing `server.js`) and allow overwrite of `server.js` and `public/index.html`.
4. Keep your existing `data/` folder. Do not delete or replace `data/state.json` or `data/settings.json`.
5. Confirm that a CEO password is configured in `data/settings.json` as `password`, or set the environment variable `CEO_PASSWORD`. The patched server deliberately has no built-in `cyborg` password. If no CEO password exists, CEO/admin routes remain locked.
6. Double-click `APPLY-PHASE-D.bat` to install/update the browser add-on script tags.
7. Start the server with `node server.js`, then reload the site.

The first start rotates the old hard-coded Bazaar cookie signing key and stores a random replacement in `data/state.json`. Existing Bazaar visitor cookies will need to log in again once. The random key then survives normal restarts as long as `data/state.json` is preserved.

## Order and Bazaar changes

- Public checkout creates an order with `status: pending` and `paymentStatus: unverified`.
- Product IDs and prices are checked against the server catalog. Client-supplied names and prices are not trusted.
- Checkout request IDs are idempotent, so a network retry does not create a second copy of the same order.
- The public `/api/orders` GET route is disabled; order history is returned only through the CEO-authenticated `/api/ceo/orders` route.
- In the CEO **AD PROJECTS & GOODS** dialog, a **MALL ORDERS — PAYMENT REVIEW** section lists orders. Verify only after personally checking the real payment receipt/reference. The app has no payment gateway integration; verification is manual, not automatic.
- Referral commissions and the buyer's order-task reward are processed only after the CEO manually verifies payment, and duplicate verification does not pay twice.
- The generic Bazaar task endpoint cannot grant check-in, order, share, or content rewards. Those require their dedicated routes; order reward waits for verified payment.
- Demo visitor IDs are random per session, not derived from a display name.
- Bazaar cookie signatures use a random persisted key and constant-time comparison. HTTPS deployments receive `Secure` cookies.
- Saving AI provider settings preserves the CEO password, Facebook OAuth values, Shopee affiliate values, and other existing settings. The previous code replaced the whole settings object and could erase them.
- CEO passwords are no longer accepted in account/provider GET query strings; those GET routes are disabled.
- Added baseline response security headers and per-IP order throttling.

## v7 operations foundation (retained)

- JSON files are now written via temporary file + fsync + atomic rename.
- `/api/health` exposes a minimal non-secret health/version summary.
- CEO **AD PROJECTS & GOODS** now includes an **OFFICE OPERATIONS** panel with live counts, audit preview, and manual backup creation.
- CEO-only `/api/ceo/ops` supports `status`, `backup`, and `audit` actions.
- Backups are timestamped under `data/backups/`, include a manifest, and retain up to 20 snapshots. They include private settings and credentials; never publish them.
- Administrative/security events are appended to `data/audit.jsonl` and rotated when the active log exceeds 2 MB.

See `MASTER-UPGRADE-ROADMAP.md` for the full 100-item plan. Only items explicitly marked DONE are implemented in this build.


## v8 virtual office layout upgrades

- Expanded the 3D campus viewport to scale with desktop height, with a responsive mobile layout.
- Added visible camera controls: zoom in/out, fit entire campus, reset camera, save/load a camera view, and toggle the clickable minimap.
- Expanded mouse-wheel and two-finger pinch zoom-out limits to 150 camera units (up from 70), so the wider campus can be viewed from farther away.
- Added a clickable campus minimap with department/zone markers and a camera-target indicator.
- Added renderer-size synchronization after the 3D host becomes visible, avoiding the hidden-at-startup canvas retaining its small fallback render size.
- Updated camera help text and the service-worker cache to `cheebee-v8`.
- Added a compatibility fallback: the app first tries a local `/three.min.js`; if it is missing, it loads the pinned Three.js r159 classic build from jsDelivr. If both sources are unavailable, the app keeps its 2D fallback. Three.js removed the classic `build/three.min.js` file starting in r160, so r159 is intentionally pinned for this legacy global-`THREE` code path. See `THREE-LICENSE.txt`.

The existing 3D office, department zones, bot models, bot-follow interaction, and task/activity simulation are retained. These changes are a tested camera/navigation foundation, not a claim that every item in the separate 100-item visual roadmap is finished. The CDN fallback requires internet access unless you provide a local compatible `public/three.min.js`.

See `LAYOUT-UPGRADE-ROADMAP.md` for the 100 visual/layout ideas and their implementation status.

## Tests run

The following passed in the build environment:

- `node --check server.js`
- `node tests/layout.js` — 20 passed
- `node tests/fixes.js` — 63 passed
- `node tests/smoke.js` — passed
- `node tests/server-security.js` — passed (live local Node HTTP integration tests, including operations auth, backup, and audit)
- `node tests/office-layout.js` — 20 assertions passed
- All 7 inline JavaScript blocks in `public/index.html` passed `node --check`
- HTML ID check — 351 unique IDs

These are automated Node tests, not a claim of testing on your actual Windows PC, a physical phone, or a live payment provider.

## Important limitations / decisions still needed

- No payment processor is connected. The CEO's manual payment verification is an internal record action, not bank/GCash/Shopee verification.
- True 2FA is not implemented. Do not treat the CEO password gate as 2FA.
- Campaign/share rewards still need a trusted social-network callback or a separate approval policy before they can be considered fraud-proof. Do not treat a client-side share click as proof of a completed social share.
- The existing file-based JSON storage is not a transactional database. For a public multi-user deployment, use persistent storage and consider SQLite/PostgreSQL plus backups and atomic writes.
- This package does not include your private `data/` folder, passwords, or API credentials.

## Rollback

Restore the backed-up `server.js` and `public/index.html` if you need to revert the backend changes. `REMOVE-PHASE-D.bat` removes the Phase D browser add-on only; it does not roll back the server security patch.

## Multiplayer preparation — Batch 0

The multiplayer architecture is being added in separate, tested batches so the Phase D v8 office remains usable. This package records the confirmed shared-world/public-entry/free-movement decisions and the owner-selected **Cyborg Cheebee CEO avatar**. It also adds `tests/multiplayer-baseline.js` as a regression/specification check.

This is **not yet live multiplayer**: the server transport, remote player avatars, server-authoritative movement, and shared chat have not been enabled. Batch 1 requires the maintained `ws` package and a generated lockfile. The build environment could not reach the npm registry, so the existing runnable server was deliberately left untouched rather than shipping an uninstalled dependency or an unsafe custom WebSocket implementation.

## MMORPG design — Open World / Action Combat

The selected direction is a seamless connected Mega World: the Company Campus, social districts, training grounds, and Adventure Regions form one continuous player-facing geography. It is designed as an open-world, third-person action MMORPG with fictional pest monsters, server-validated combat, quests, XP, equipment, parties, and boss encounters. Adventure simulation remains an isolated module, and the owner remains the Cyborg Cheebee CEO avatar.

Read `MMORPG-GAME-DESIGN-PLAN.md` before implementation. This is a design-only addition: it does not add live MMORPG gameplay or multiplayer networking, and it does not modify the Phase D v8 runtime files. The first playable slice and staged implementation gates are documented there.

## Master company direction — Business + MMORPG

The confirmed direction is **BOTH**: AI affiliate/content operations and the MMORPG/community experience are equally important pillars. Publishing control is **RULES**: routine pre-approved content may auto-publish only after deterministic policy checks; uncertain content is held for review; prohibited content is blocked. Use official authorized platform integrations only; fake engagement and mass unsolicited messaging are prohibited.

New planning documents:
- `MASTER-ARCHITECTURE.md` — company structure, departments, publishing gate, account/data boundaries, and v8 protection rules.
- `IMPLEMENTATION-ROADMAP.md` — staged delivery from shared company foundation through AI business, rules-based publishing, multiplayer office, and MMORPG vertical slice.
- `MASTER-UPGRADE-ROADMAP.md` — the original 100-item roadmap is retained, with a strategic direction addendum; existing DONE/PLANNED statuses are not silently changed.

**This strategy update is documentation-only.** No new Facebook/YouTube publishing engine, real-time multiplayer transport, seamless world streaming, district handoff, combat, monsters, or XP runtime has been implemented. The protected runtime files (`server.js`, `public/index.html`, `public/phaseB.js`, `public/phaseC.js`, `public/phaseD.js`, and `public/sw.js`) have been hash-compared against the supplied v8 baseline and are unchanged. You do not need to reinstall the application just to read these planning documents. Keep your private `data/` folder untouched.


## Seamless Mega World — strategic direction 1.1

The selected layout is **SEAMLESS**: one continuous 3D player experience connects the Phase D v8 Company Campus, Central Plaza, Social/Market District, Event Arena, Training Grounds, and Adventure Regions. Players should travel through the world without a separate game-launch flow. The technical implementation remains modular and uses background asset streaming and server handoff; this avoids turning the existing office into one fragile monolithic runtime.

Read `SEAMLESS-MEGA-WORLD-ARCHITECTURE.md` for the official district map, architecture, safety boundaries, first playable slice, and acceptance criteria. This is a design update only: no world streaming, district handoff, multiplayer transport, or MMORPG gameplay has been implemented. The protected Phase D v8 runtime files remain unchanged.
