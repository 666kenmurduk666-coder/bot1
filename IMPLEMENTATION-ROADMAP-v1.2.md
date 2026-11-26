# Cyborg Cheebee Company — Master Implementation Roadmap

Version: Strategic Direction 1.2 — Seamless Mega World + Hybrid Game Rewards  
Rule: preserve Phase D v8; implement in small, independently testable batches.  
Status labels: **DONE** only when code, tests, and acceptance checks exist; otherwise **PLANNED** or **BLOCKED**.

## Confirmed direction

- Business direction: **BOTH** — AI affiliate/content business and MMORPG/community are equally important pillars.
- Publishing control: **RULES** — routine approved content can auto-publish only after deterministic checks; exceptions are held for review; prohibited content is blocked.
- Office: existing Phase D v8 remains the protected company hub.
- CEO: owner appears as Cyborg Cheebee.
- Multiplayer office: shared world, public guest entry with restricted privileges, free movement.
- World layout: **SEAMLESS** — one continuous Mega World connects Company Campus, Central Plaza, Social/Market District, Event Arena, Training Grounds, and Adventure Regions. No separate game-launch flow for normal travel.
- MMORPG: open-world action combat geographically connected to the city; implementation remains a separately testable module with background streaming and server handoff.

## Phase 0 — Protect and document baseline
**Status: DONE for documentation baseline only.**
- Preserve the Phase D v8 ZIP and current runtime files as rollback baseline.
- Record business + MMORPG dual direction and rules-based publishing choice.
- Define module boundaries, data boundaries, permissions and release gates.
- Compare protected runtime hashes; no runtime files changed in this strategy update.

## Phase 1 — Shared company foundation
**Status: PLANNED.**
- Establish secure account/session and role model without reusing Bazaar visitor IDs as trusted accounts.
- Add durable task queue, agent registry, task ownership, retries, idempotency and audit records.
- Add configuration/versioning for feature flags and policy rules.
- Select transactional persistence (SQLite for a controlled single-host pilot; PostgreSQL for public scale) after backup and migration tests.
- Add company-wide kill switches for publishing, agent execution and game services.

## Phase 2 — AI business operations
**Status: PLANNED.**
- Research department: permitted source capture, timestamp, source URL, confidence and product fact records.
- Affiliate department: approved products, verified links, campaign metadata and commission terms.
- Content studio: original content briefs, scripts, captions, image/video tasks and reusable channel templates.
- Quality department: claim verification, originality checks, rights checklist, affiliate disclosure validation and channel-specific formatting.
- CEO dashboard: queues, agent status, content calendar, approvals/exceptions, campaigns and cost controls.

## Phase 3 — Rules-based publishing engine
**Status: PLANNED.**
- Implement policy outcomes: AUTO-PUBLISH, HOLD FOR REVIEW, BLOCK.
- Validate supported channel, authorized account, OAuth scope, destination, source facts, affiliate disclosure, rights, originality, platform constraints and duplicate/idempotency key.
- Use official authorized platform APIs/integrations only; do not automate fake engagement or mass unsolicited messaging.
- Add scheduled queue, rate limits, bounded retries, platform error handling and audit trail.
- Add CEO controls to pause a channel, campaign, agent or all publishing.
- Start in draft/sandbox mode; enable automatic publishing only after test posts and platform permission checks pass.
- Keep estimates separate from actual clicks, orders and confirmed commissions.

## Phase 4 — Business analytics and finance integrity
**Status: PLANNED.**
- Track impressions/views, link clicks, conversions, confirmed affiliate commissions, spend and net results where supported by trusted sources.
- Separate estimated commission from confirmed/payout amounts.
- Keep affiliate balances, Bazaar orders, game coins and Adventure rewards in separate ledgers.
- Add fraud review, duplicate/self-referral checks and reconciliation reports.

## Phase 5 — Real-time multiplayer office foundation
**Status: BLOCKED on dependency availability; not implemented.**
- Install maintained WebSocket package and generate lockfile in a network-enabled build environment.
- Add guest session/resume, heartbeat, connection limits and online count.
- Add remote avatars and join/leave events.
- Add server-authoritative movement, shared chat, moderation and player-to-AI interactions.
- Pass two-browser tests before claiming live multiplayer.

## Phase 6 — Social office and community activities
**Status: PLANNED; depends on Phase 5.**
- Friends, profiles, proximity/world chat, emotes, lounge/cafeteria and guided tours.
- Events, mini-games, team missions and community announcements.
- Reporting, mute/block, moderation queue, privacy settings and age-appropriate safety defaults.

## Phase 7 — Seamless Mega World shell and district streaming
**Status: PLANNED; design exists, runtime not implemented.**
- Add a separately testable world shell and district modules behind feature flags; do not replace the Phase D v8 office.
- Define connected geography: Company Campus → Central Plaza → Social/Market District → Event Arena/Training Grounds → starter wilderness.
- Add background asset streaming, distance-based detail, safe checkpoints, reconnect handling, and invisible district/server handoff.
- Preserve one account/avatar identity across districts while enforcing private company-room permissions.
- The office must remain usable when Adventure services are disabled.

## Phase 8 — First playable seamless Adventure vertical slice
**Status: PLANNED; depends on multiplayer server foundation and isolated district modules.**
- One compact connected map: protected office/campus section, central plaza, training route, and one starter wilderness zone.
- One playable character/class for the first prototype.
- Third-person manual movement, camera, basic attack, dodge and one skill.
- Three fictional insect enemies: Giant Ant Scout, Mutant Mosquito and Armored Cockroach.
- One short quest and one small boss after basic combat is stable.
- Server validates positions, collision, attack range, cooldown, enemy health, XP, inventory and drops.
- Two-browser test proves players see one another and share encounter results while moving between districts without a separate game-launch flow.

## Phase 9 — Progression, parties and world expansion
**Status: PLANNED.**
- Transactional XP/inventory/reward ledger, skill upgrades, equipment rarity and quest records.
- Anti-farming limits, idempotent rewards, audit and exploit tests.
- Parties up to five for first group content; friends/invites and shared objectives.
- Add new zones, dungeons, bosses, events and guilds only after load/performance tests.
- No PvP, real-money trading, cash-out or paid random loot in first playable release.

## Phase 10 — Closed beta, monitoring and scale
**Status: PLANNED.**
- Load tests for office presence, chat, business queues and Adventure zones.
- Monitor latency, tick duration, CPU/memory, errors, disconnects, queue backlog and publishing outcomes.
- Start with a limited pilot only at a concurrency level supported by measured results.
- Verify desktop and mobile, backups/restore, moderation, incident response and production HTTPS/WSS.

## Release gates

A phase cannot be marked DONE until:
1. Existing Phase D v8 regression tests pass.
2. Protected runtime files are unchanged unless an explicitly approved implementation batch modifies them.
3. New module tests pass, including negative/security cases.
4. Installation and rollback instructions are included.
5. Real acceptance tests pass (two browsers for multiplayer; connected authorized test account for publishing; two clients for shared game encounters).
6. Documentation clearly distinguishes implemented, tested, blocked and planned capabilities.

## What must never happen

- Never let an AI agent bypass publishing rules, create fake engagement, invent product claims, or publish with missing affiliate disclosure.
- Never store platform secrets in browser code or expose private company/player data.
- Never mix game XP/coins/items with real money, affiliate commissions, or Bazaar accounting.
- Never trust client-submitted coordinates, damage, XP, item drops, payment status or social-share claims.
- Never overwrite the user's private `data/` folder during an update.
- Never represent a design-only package as a live implementation.

## Current implementation snapshot

- Phase D v8 office: existing baseline; retained in the supplied package.
- Original 100-item office upgrade roadmap: retained as its own roadmap; statuses must continue to be verified item by item.
- Multiplayer Batch 0: preparation/specification only; real-time transport is not yet installed.
- MMORPG: open-world/action-combat/seamless-connected-world design only; no world streaming, district handoff, synchronized multiplayer, combat, monsters or XP runtime is live.
- AI affiliate/content automation: this document defines the approved direction and publishing rules; no new end-to-end social publishing engine is implemented here.


## Phase 11 — Player jobs, quests, and progression economy
**Status: PLANNED; depends on account persistence, server authority, and Adventure vertical slice.**
- Add player profession profiles: Farmer, Miner, Crafter, Merchant, Explorer, Monster Hunter, Guild Member, and Company Mission Contributor.
- Add daily quests, main/story quests, achievements, and cooperative objectives.
- Validate all quest completion and rewards server-side; use idempotency keys, daily caps, repeat-action diminishing returns, and audit records.
- Keep ordinary XP, Game Coins, items, materials, and Company Reward Credits in separate ledgers.
- Gameplay quests grant gameplay rewards by default; they do not automatically create eligibility for company-funded rewards.
- Define clear eligibility stages: New Player → Trainee → Active Player → Qualified Contributor → Reward Eligible. Thresholds remain CEO-configurable and must be transparent.
- Do not use game grinding to disguise unpaid commercial labor. Real business deliverables require separate authorization, scope, and appropriate real-world terms.

## Phase 12 — Affiliate marketplace and attribution
**Status: PLANNED; depends on Phase 2 and Phase 4.**
- Build separate in-game shops and real-product affiliate listings.
- Add product categories, approved product facts, affiliate disclosures, valid tracking links, and availability/price freshness controls where supported.
- Track clicks and conversions only through authorized affiliate reporting/attribution mechanisms.
- Separate estimated, pending, confirmed, reversed, and paid commissions.
- Verify affiliate-program and platform terms before enabling player-specific referral attribution or any player incentive; disable unsupported incentive paths.
- Ensure gameplay equipment and progression remain achievable without real-product purchases.

## Phase 13 — Hybrid game-reward engine
**Status: PLANNED; depends on Phase 4, Phase 9, Phase 11, and Phase 12.**
- Implement two reward calculations: shared company-funded game reward pool and individual verified-contribution game rewards.
- Individual “commission” means game-only reward credits, not cash commission, wages, or withdrawable earnings.
- Fund reward batches only from CEO-approved budgets based on confirmed, reconciled company revenue; exclude estimates, pending orders, reversals, and unvalidated commissions.
- Keep Company Reward Credits non-withdrawable, non-cash-convertible, and separate from Game Coins, XP, affiliate balances, and Bazaar money.
- Add budget caps, eligibility rules, anti-fraud review, manual approval, reversal handling, and immutable audit logs.
- If no approved budget exists, issue no company-funded reward.
- AI Director can recommend but cannot independently change reward policy or approve financial allocation.

## Phase 14 — CEO economy dashboard and controlled beta
**Status: PLANNED; depends on Phase 13.**
- Show confirmed revenue, pending/reversed commissions, approved reward budget, pool balance, contribution rankings, reward batches, and audit history.
- Provide CEO controls for policy versions, caps, eligibility, schedule, pause, approve/reject, and documented reversal.
- Test forged quest completions, repeated actions, duplicate referrals, self-referrals, replayed reward requests, race conditions, and budget over-issuance.
- Run a closed beta with test accounts and synthetic transactions before any live affiliate-funded reward distribution.
- Publish clear player rules: no cash-out, no guaranteed income, reward eligibility, caps, and dispute/reporting process.

## New economy release gates
A player-economy phase cannot be marked DONE until:
1. Server-authoritative quest and contribution validation passes negative/security tests.
2. All reward issuance is transactional, idempotent, budget-bounded, and auditable.
3. Game XP, Game Coins, Company Reward Credits, affiliate commissions, and Bazaar balances are demonstrably separate.
4. Reward funding uses only confirmed and reconciled revenue under a CEO-approved policy.
5. Affiliate program/platform terms have been checked for the exact traffic and incentive model.
6. Commercial work is not disguised as unpaid gameplay.
7. No cash-out, cash conversion, paid random loot, or unapproved player-to-player currency transfer is present.
8. CEO pause and rollback controls have been tested.

