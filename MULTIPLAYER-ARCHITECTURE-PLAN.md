# Cyborg Cheebee Multiplayer Office — Architecture & Implementation Plan

## Product decisions (confirmed)
- World: **one shared office world** (not per-player private offices).
- Access: **open/public entry**. Open does not mean anonymous trusted privileges; guests receive restricted identities and permissions.
- Movement: **free movement** using keyboard/mouse and touch controls.
- Core experience: human players and existing AI bots coexist in the same 3D office.
- CEO avatar: the owner appears as **Cyborg Cheebee** in the shared world; do not substitute a generic avatar or a separate CEO robot.

## Current project findings (Phase D v8 source inspection)
- Backend is a single Node.js `http.createServer` in `server.js`, using built-in modules; no WebSocket server or multiplayer transport is currently implemented.
- `public/index.html` already contains a Three.js 3D office, a local client-side `spawnPlayer()` avatar, WASD-style game controls, an in-world chat panel, and AI bot movement.
- Current chat (`mmoSend`) writes to the local browser chat log and chooses a nearby local bot reply. It does not deliver messages to other human players.
- Current player avatar and movement state are local browser variables; they are not authenticated, persisted, or synchronized with a server.
- Existing Bazaar visitor identity is a separate feature and must not be reused as the multiplayer account/session system without a deliberate security review.
- Data persistence is JSON-file based (`data/state.json`, atomic writes). This is suitable for the existing single-instance app but not a robust transactional store for a public concurrent multiplayer economy.

## Target architecture

```text
Browser clients (Three.js / native WebSocket)
  | HTTPS + WSS
  v
Node.js HTTP server + WebSocket gateway
  |-- Guest/session authentication
  |-- World/room coordinator (one shared world)
  |-- Authoritative movement simulation
  |-- Presence + avatar state
  |-- World chat + moderation
  |-- Interaction/permission validation
  |-- Rate limits / abuse detection
  |
  +--> Persistent database (players, profiles, inventory, moderation, audit)
  +--> Existing AI office simulation (bots remain server-owned entities)
```

### Authority and synchronization
- Server is authoritative for player identity, position, movement speed, collision/room boundaries, interactions, rewards, inventory, and moderation.
- Clients send **input intents** (pressed directions, jump/interact intent), not trusted coordinates, coins, XP, or completed-task claims.
- Server simulates movement at a fixed tick (initial target 20 ticks/second), validates bounds and speed, and broadcasts snapshots/deltas to connected players (initial target 10–15 updates/second).
- Clients interpolate remote players between snapshots; local player uses client-side prediction with server reconciliation to keep controls responsive.
- Reconnect uses a short-lived resume token; expired/invalid sessions return to guest entry. Never place secrets in browser storage or public state.
- AI bots remain distinct server-owned entities. The server may publish their position/activity updates through the same world snapshot stream.

## Open access and player safety
- First visit creates a restricted guest session with a random server-issued player ID and display name; no CEO access or economy privileges by default.
- Optional account registration/verification can be added later for persistent identity and recovery. Public entry must not bypass authentication for privileged actions.
- Default chat controls: per-player rate limit, message length limit, server-side sanitization, profanity/spam filtering, mute, block, report, and moderator review tools.
- Provide visible community rules, privacy notice, player reporting, and a quick way to leave/disable chat.
- Do not expose email, IP, session tokens, private account data, API keys, or internal admin data to other players.
- CEO/admin actions remain behind a separate authenticated admin session and must never be granted by a player role or client flag.

## Initial capacity and performance targets
- First public pilot: load-test and launch conservatively (e.g. 20–30 concurrent players); do not promise unlimited capacity.
- Use interest management: send high-frequency movement only for players in the same visible area/zone, while maintaining one shared world identity.
- Limit chat history and packet sizes; send only changed state where possible.
- Add connection heartbeat, idle disconnect, reconnect grace period, and per-IP/per-session rate limits.
- Monitor active connections, message rate, tick duration, memory, CPU, disconnects, and rejected movement.
- Scale only after load testing. If one process becomes insufficient, partition simulation into coordinated instances/areas while preserving a shared world concept; this is a later phase, not a first release assumption.

## Persistence and deployment decisions
- Replace JSON as the source of truth for multiplayer player accounts and transactions with SQLite for a small single-host pilot or PostgreSQL for a public production service.
- Keep JSON for static office configuration if desired, but do not use it for concurrent player movement or wallet transactions.
- Use transactions for wallet/inventory/reward changes and an append-only ledger for every balance change.
- Deploy behind HTTPS; WebSocket must use WSS. Configure trusted proxy headers correctly.
- Add database backups, restore drills, schema migrations, and operational health metrics before public launch.
- Keep all API keys and signing secrets server-side in environment variables or a secret manager. Rotate any key accidentally exposed in chat/source history.

## Implementation roadmap (gated batches)

### Batch 0 — Design and safety baseline
- Freeze shared/open/free decisions.
- Define player states, packet schema, permissions, abuse policy, and initial concurrency target.
- Keep current v8 build as rollback baseline; never overwrite the user's `data/` folder.
- Add multiplayer architecture tests and a local test harness.

### Batch 1 — Server transport foundation
- Add a maintained WebSocket package (`ws`) and explicit dependency/lockfile.
- Add WSS-compatible upgrade handling on the existing HTTP server.
- Add guest session creation, resume token, heartbeat, connection lifecycle, and per-session rate limits.
- Add server-side player registry and a read-only online-player count.
- No wallet/rewards/trading in this batch.

### Batch 2 — Shared avatar presence
- Define versioned packets: `hello`, `welcome`, `input`, `snapshot`, `player_joined`, `player_left`, `ping`, `pong`, `error`.
- Spawn server-approved avatars into the existing 3D office.
- Broadcast join/leave and player snapshots; render remote avatars and nameplates.
- Add interpolation and reconnect behavior.

### Batch 3 — Authoritative free movement
- Move simulation authority to server; validate speed, bounds, collision, jump cooldown, and movement tick.
- Client sends WASD/touch input; server broadcasts confirmed positions.
- Preserve existing local single-player camera and movement as offline/degraded fallback only.
- Test multi-client collisions, latency, packet loss, reconnect, and malicious coordinate injection.

### Batch 4 — Real world chat and social basics
- Replace local-only chat send with server broadcast.
- Add area/world channels, message history limits, rate limiting, mute/block/report, and moderation log.
- Add player profile card with safe public fields only.

### Batch 5 — Human + AI interaction
- Publish bot presence/activity through server world state.
- Add validated player-to-bot interaction requests; server checks distance and permissions.
- Ensure bots do not trust client-supplied identity or task completion.

### Batch 6 — Accounts and persistence
- Add persistent player accounts, profiles, avatar outfits, inventory, and moderation records in a transactional database.
- Add guest-to-account linking without losing legitimate progress.
- Keep CEO/admin identity separate from ordinary player identity.

### Batch 7 — Activities and economy (only after ledger)
- Add events, mini-games, achievements, and player-owned cosmetics.
- Add wallet and item transactions only through server-side transactional ledger.
- No paid random loot, manipulative streak penalties, or rewards for unverified social actions.

### Batch 8 — Public beta and operations
- Load test at increasing concurrency; publish measured limits.
- Add admin moderation panel, abuse alerts, backup/restore, metrics, and incident runbook.
- Run browser/device tests on desktop and mobile; verify HTTPS/WSS on the actual deployment host.

## Acceptance tests before public launch
- Two or more browsers see each other's joins, movement, and disconnects in the same world.
- A forged client position/speed/coin/reward packet is rejected and logged.
- Guest cannot call CEO/admin endpoints or access another player's private data.
- Chat is broadcast to other clients, rate-limited, sanitized, and can be muted/reported.
- Reconnect does not duplicate player identity or transactions.
- Server restart preserves registered profiles and ledger history.
- 20–30 concurrent-client pilot load test meets measured tick/latency/memory targets before opening wider.
- WSS works behind the production reverse proxy; no mixed-content WebSocket connection.

## Explicit non-goals for the first multiplayer release
- No unlimited-player promise.
- No peer-to-peer authority for movement or economy.
- No real-money marketplace until legal/payment/security review and transactional ledger are complete.
- No assumption that existing local chat, local avatar movement, or Bazaar visitor tracking is already multiplayer.

## Current status
**Batch 0 safety baseline completed in the accompanying implementation package.** The supplied Phase D v8 runtime files remain unchanged. Batch 1 transport is still pending because the build environment could not reach the npm registry to install and lock the maintained `ws` dependency. Continue in gated batches with backups and tests; do not claim live multiplayer until the two-browser acceptance tests pass.


## Seamless Mega World layout decision (2026-11-19)

The owner selected **SEAMLESS** for the overall player experience. The shared Company Campus/Office connects geographically to the Central Plaza, social/market district, event arena, training grounds, and adventure regions. Normal travel should not require a separate game-launch flow.

This does not change the multiplayer foundation requirements: shared identity, server-authoritative movement, presence, chat, moderation, and load testing remain prerequisites. Implement the seamless geography through separately testable district modules, background asset streaming, and invisible server handoffs. Do not rewrite the Phase D v8 office to create a monolithic world. See `SEAMLESS-MEGA-WORLD-ARCHITECTURE.md`.
