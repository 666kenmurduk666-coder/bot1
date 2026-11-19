# Cyborg Cheebee Office — Multiplayer & Company Implementation Status

## Confirmed company decisions
- Business direction: **BOTH** — AI business and MMORPG/community are equally important.
- Publishing control: **RULES** — auto-publish only after deterministic policy checks; hold exceptions for review; block prohibited content.
- CEO avatar: owner appears as **Cyborg Cheebee**.
- Office: one shared world, public guest access with restricted privileges, free movement.
- World layout: **SEAMLESS** — continuous Company Campus, social districts, and connected Adventure Regions.
- MMORPG: open-world action combat; Adventure code/data remain a separate module behind the seamless player experience.

## Current status

### Phase D v8 office
- Existing office runtime remains the protected baseline.
- The office contains its existing local 3D scene, bot simulation and local player/chat behavior.
- Do not infer real-time human multiplayer from the existing local player/chat features.

### Multiplayer
- Batch 0: **DONE — preparation/specification only**.
- Batch 1 WebSocket transport: **NOT STARTED / BLOCKED** until maintained dependency installation and lockfile generation can be completed safely.
- Remote avatars, synchronized movement, shared human chat and human-to-AI interaction: **NOT IMPLEMENTED**.

### MMORPG
- Open world, action combat and seamless connected Mega World: **DESIGN CONFIRMED**.
- World streaming, district handoff, combat runtime, monsters, XP, inventory, parties and bosses: **NOT IMPLEMENTED**.

### AI business and publishing
- Dual business + MMORPG direction: **DESIGN CONFIRMED**.
- Rules-based publishing policy and workflow: **SPECIFIED, NOT IMPLEMENTED**.
- End-to-end Facebook/YouTube publishing integration: **NOT IMPLEMENTED**.
- No platform credentials or posting permissions are assumed to exist.

## v8 safety commitments
- This update changes documentation and tests only; it does not modify `server.js`, `public/index.html`, Phase B/C/D scripts, or the service worker.
- Do not overwrite or delete the user's private `data/` directory, settings, passwords, API keys, orders, audit logs or backups.
- Keep business financial records, Bazaar balances, player accounts and Adventure rewards in separate data domains.
- Keep the original Phase D v8 package as the rollback baseline.

## Required gates
1. Run existing v8 regression tests after every future implementation batch.
2. Install and lock maintained multiplayer transport before implementing real-time player synchronization.
3. Implement publishing through official authorized platform integrations only, with server-side secrets, scoped permissions, policy outcomes, audit logs and a global pause switch.
4. Test two browsers for multiplayer and connected authorized test accounts for publishing.
5. Mark features DONE only when code and relevant acceptance tests pass.

See `MASTER-ARCHITECTURE.md` for the system design and `IMPLEMENTATION-ROADMAP.md` for the staged build plan.


## Seamless Mega World — official layout decision (2026-11-19)

The owner selected **SEAMLESS**. The target player experience is one continuous geography connecting the Company Campus, Central Plaza, Social/Market District, Event Arena, Training Grounds, and Adventure Regions. Normal travel should not require launching a separate game or selecting a portal menu.

Implementation remains modular: world shell, district assets, business services, multiplayer services, and adventure simulation stay independently testable. Background asset streaming and server handoff should preserve player identity, position/checkpoint, and party state. This is design-only; no runtime world streaming, seamless travel, or server handoff is implemented. See `SEAMLESS-MEGA-WORLD-ARCHITECTURE.md`.
