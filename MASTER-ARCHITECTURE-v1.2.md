# Cyborg Cheebee Company — Master Architecture

Version: Strategic Direction 1.2 — Seamless Mega World + Hybrid Game Rewards  
Baseline: Phase D v8 (protected)  
Status: Architecture/documentation only; no new runtime feature is claimed as implemented.

## 1. Confirmed company direction

- **Business direction: BOTH.** The AI business and the MMORPG/community experience are equally important pillars.
- **Publishing control: RULES.** AI agents may publish automatically only when a deterministic publishing policy passes. Content that is uncertain, high-risk, or outside an approved format is held for human review; prohibited content is blocked.
- **Office:** retain the existing Phase D v8 office as the company hub.
- **CEO identity:** the owner appears as **Cyborg Cheebee**, not a generic avatar or a separate CEO robot.
- **Multiplayer office:** one shared office world, public guest entry with restricted permissions, and free movement.
- **World layout: SEAMLESS.** One continuous 3D Mega World connects the company campus, central plaza, social/market district, event arena, training grounds, and adventure regions. No separate game-launch menu is required for normal travel.
- **Adventure:** open-world MMORPG with third-person action combat, connected geographically to the city. Its code, server authority, and game data remain isolated modules.

## 2. Product structure: one company, one seamless world, connected services

```text
CYBORG CHEEBEE MEGA WORLD — ONE CONTINUOUS PLAYER EXPERIENCE
|
+-- COMPANY CAMPUS (Phase D v8 protected baseline)
|   +-- AI departments, CEO area, meetings, work dashboards
|   +-- Human players and AI office employees
|
+-- CENTRAL PLAZA / SOCIAL DISTRICT
|   +-- Friends, chat, events, cafeteria, marketplace, orientation
|
+-- EVENT ARENA / TRAINING GROUNDS
|   +-- Community events, tutorials, competitions, safe practice
|
+-- CONNECTED ADVENTURE REGIONS
    +-- Open-world exploration and third-person action combat
    +-- Fictional pest/monster encounters, quests, XP, skills, gear, parties

SHARED COMPANY PLATFORM (identity, roles, task orchestration, policy, audit)
+-- AI BUSINESS SERVICES (research, affiliate, content, publishing, analytics)
+-- SOCIAL / MULTIPLAYER SERVICES (presence, chat, moderation, parties)
+-- ADVENTURE SERVICES (world simulation, combat, progression)
+-- DATA SERVICES (separate transactional domains and ledgers)
```

The player's experience is one continuous geography. The implementation is still modular: districts can stream assets and hand off server ownership behind the scenes without becoming separate games in the interface. The company campus begins from the protected Phase D v8 baseline. The office remains usable if Adventure services are disabled. Business publishing never depends on the game being online.

See `SEAMLESS-MEGA-WORLD-ARCHITECTURE.md` for district layout, streaming, server handoff, recovery, performance, and first-playable acceptance criteria.

## 3. AI business operating model

### Departments

1. **Research & Trends:** collect product and topic candidates from permitted sources; record source, date checked, and confidence.
2. **Affiliate & Campaigns:** maintain product facts, approved affiliate links, campaign goals, and commission terms. Never invent a price, discount, stock status, review, or personal product experience.
3. **Content Studio:** create original scripts, captions, thumbnails, images, and video briefs tailored to the selected channel.
4. **Quality & Rights:** verify factual claims, source support, originality, image/music/video usage rights, and required affiliate disclosures.
5. **Publishing Operations:** schedule and publish only through official, authorized platform integrations and within each platform's limits and terms.
6. **Analytics:** report measured reach, views, clicks, conversions, confirmed commissions, costs, and ROI. Clearly distinguish estimates from verified results.

### Rules-based publishing gate

Every outbound post must pass the policy engine before it can be scheduled or published.

- **AUTO-PUBLISH:** approved content type and channel; verified source data; required affiliate disclosure present; originality and rights checks passed; no unsupported claims; valid destination/link; platform permission and rate limit available; duplicate/idempotency check passed.
- **HOLD FOR REVIEW:** uncertain product facts, health/financial/legal claims, comparative or superlative claims without strong evidence, sensitive topics, unclear rights, unusual engagement patterns, new templates, or policy-check disagreement.
- **BLOCK:** fake likes/views/comments/follows; mass unsolicited messaging; fabricated testimonials or product use; deceptive links; undisclosed affiliate promotion; impersonation; prohibited products or content; stolen/copyright-infringing media; attempts to bypass platform restrictions.

The rules are configurable by the CEO, versioned, tested before activation, and recorded in an audit log. A global publishing pause/kill switch must stop queued outbound posts. The system must not simulate human engagement or create fake accounts. Use official platform APIs/integrations and only the permissions actually granted to the connected account. If an official API does not support an action, the bot must prepare a draft rather than imitate a person through browser automation.

### Human oversight without blocking routine work

Routine, pre-approved content can publish automatically after all checks pass. A review queue is required for exceptions and policy uncertainty. The CEO can pause a campaign, channel, agent, or all publishing. Every post records the agent, content version, sources, policy version, destination, scheduled/published time, platform response, and any later edit/removal.

## 4. MMORPG and community operating model

- The company campus, social districts, event spaces, and adventure regions form one seamless connected geography. The Adventure runtime remains an isolated module; district/server handoffs should happen behind the scenes without a separate game-launch flow.
- The initial Adventure slice is intentionally small: one starter zone, one playable class/character, manual movement, basic attack, dodge, one skill, three fictional insect enemies, one short quest, and a small boss encounter after combat is stable.
- First group target: parties of up to five players. Do not promise capacity until measured load tests support it.
- Server authority validates movement, collisions, attack range, cooldowns, enemy health, XP, inventory, drops, and quest completion.
- Use fictional pest/monster designs. Do not depict cruelty toward ordinary real-world animals.
- No player-versus-player combat, real-money trading, cash-out, paid random loot, or player-to-player currency transfer in the first playable release.
- Adventure XP, items, and game-only rewards are separate from affiliate commissions, Bazaar balances, orders, and real-money accounting.

## 5. Shared identity, roles, and permissions

- **Owner/CEO:** Cyborg Cheebee avatar; full company administration and explicit publishing emergency controls.
- **Admin/Moderator:** scoped operational and community moderation permissions; no automatic access to secrets or finance.
- **AI Agent:** service identity with only the permissions needed for assigned tasks; no self-granting privileges.
- **Registered Player:** social and game permissions according to account status.
- **Guest:** restricted public access; no privileged company, publishing, finance, or persistent-economy actions.

Business credentials, API tokens, private analytics, affiliate account details, player private data, and admin endpoints are never exposed to other players or browser-visible public state.

## 6. Data boundaries

Keep separate transactional domains for:

- Company tasks, agent runs, content assets, publishing records and business analytics.
- Player accounts, presence, moderation and social relationships.
- Adventure character progression, XP, skills, equipment, drops and quest records.
- Bazaar orders, real-money records, affiliate commissions and financial ledgers.

Do not merge game coins/XP with real money, affiliate commissions, Bazaar wallets, or campaign budgets. Use transactional storage for concurrent accounts and financial/economy records; JSON files remain only for existing single-instance configuration until a deliberate, tested migration is approved.

## 7. Technical architecture principles

- Preserve the existing Node.js v8 application as the baseline; add new modules behind explicit routes/feature flags. Build the seamless world shell and district modules separately before integrating them with the protected office.
- Use a maintained WebSocket transport for real-time multiplayer only after dependency installation and lockfile generation are available.
- Server-authoritative simulation for player movement and game rewards; clients send input intents, not trusted state. Use region streaming and server handoff behind the scenes so the player experiences continuous travel.
- Durable task queues with idempotency, bounded retries, dead-letter handling, and explicit task ownership.
- Official authorized social platform APIs/integrations; server-side secrets; OAuth scopes limited to required actions.
- Transactional database for public multi-user identity, inventory, and ledgers; backups, migrations, restore drills, rate limits, monitoring and moderation before public launch.
- Every batch must have changed-file list, tests, install notes, backup/rollback instructions, and explicit limitations.

## 8. Non-negotiable Phase D v8 protection

1. Treat the supplied Phase D v8 ZIP as immutable rollback baseline.
2. Do not casually replace `server.js`, `public/index.html`, Phase B/C/D scripts, or service worker to add new experiences.
3. Do not overwrite/delete the user's `data/`, settings, passwords, API keys, Bazaar orders, audit logs, or backups.
4. Add business, social multiplayer, and MMORPG features as isolated modules with explicit integration points and feature flags.
5. Keep a known-good copy and compare hashes of protected runtime files after each documentation/design batch.
6. Never mark a feature DONE until code, relevant automated tests, installation/rollback notes, and acceptance checks pass.
7. A design package is not a live feature. Do not claim social publishing, multiplayer, or MMORPG gameplay is active until tested against the real connected services/clients.

## 9. Current truth

The current package documents the chosen direction. The Phase D v8 office has a local 3D scene, local player movement/chat behavior, and AI office simulation, but it does not yet provide synchronized human multiplayer. The seamless Mega World and MMORPG are design-only. No world streaming, district handoff, real-time multiplayer, combat, or automated Facebook/YouTube publishing pipeline is implemented by this architecture document.


## 10. Player economy — approved direction (2026-11-19)

### 10.1 Product decision

- Player earnings mode: **GAME REWARDS ONLY**. There is no player cash-out, withdrawal, cash conversion, or real-money transfer in the initial architecture.
- Revenue-sharing model: **HYBRID** — (A) a shared, company-funded game reward pool for qualified contributors, plus (B) individual contribution rewards for verified, attributable contributions.
- “Individual commission” is a game-reward calculation label, not a cash commission or legal promise of income. It is credited only as non-withdrawable Company Reward Credits / game-only rewards.
- The CEO controls the approved allocation policy, eligibility rules, caps, distribution schedule, and emergency pause. Percentages remain configurable and are not fixed in this version.

### 10.2 Revenue and reward flow

1. Affiliate/business systems record estimated, pending, confirmed, reversed, and paid commission states separately.
2. Only confirmed, reconciled company revenue may be considered for a reward budget; pending estimates and unvalidated orders are excluded.
3. The CEO-approved policy determines whether and how much of eligible net company revenue is budgeted for game rewards, after applicable fees, refunds, reversals, operating costs, and reserves.
4. The reward engine calculates shared-pool allocations from eligible contribution points and separately calculates individual contribution rewards from validated attribution.
5. The server posts approved rewards to the game-only ledger using unique idempotency keys and an auditable batch record.
6. If the approved budget is zero, unavailable, paused, or under reconciliation, no company-funded reward batch is issued.

No percentage or reward amount is promised until the CEO configures it and the relevant revenue, program terms, and operational controls are verified.

### 10.3 Ledgers and currency boundaries

Maintain distinct ledgers and transaction types for:
- Adventure XP and progression.
- Game Coins and ordinary gameplay currency.
- Items, equipment, crafting materials, pets, and summon tickets.
- Company Reward Credits (game-only, non-withdrawable).
- Affiliate commission and company financial records.
- Bazaar orders, real-money payments, refunds, and balances.

Company Reward Credits:
- cannot be withdrawn, redeemed for cash, converted to affiliate commissions, or transferred outside the game;
- cannot be represented as guaranteed income, wages, or cash commissions;
- may be spent only on explicitly eligible in-game goods/services under published game rules;
- must have a complete append-only transaction history, budget source, rule version, reason code, and reversal/adjustment record.

Do not silently merge Company Reward Credits with Game Coins. They are separate game-only instruments with separate issuance rules and permitted uses.

### 10.4 Player jobs, quests, and contribution

Initial in-world professions may include Farmer, Miner, Crafter, Merchant, Explorer, Monster Hunter, Guild Member, and Company Mission Contributor. These are game roles and progression paths.

Daily quests, main quests, exploration, combat, crafting, gathering, cooperative events, and achievements may grant ordinary gameplay rewards. A quest completion alone does not guarantee a company-funded reward.

Contribution points must be based on server-verified, meaningful, non-duplicated actions. Anti-abuse controls include account-age/verification gates where appropriate, rate limits, daily caps, repeat-action diminishing returns, bot/fraud detection, attribution validation, and manual review for anomalies.

**Commercial-work boundary:** gameplay grinding must not be used to disguise unpaid real-world labor. Any task that creates a real commercial deliverable for the company (for example, content production, customer support, marketing work, or operational work) must be separately authorized, clearly scoped, and handled under appropriate real-world terms and applicable law. It must not be required as a condition for ordinary game access or ordinary gameplay progression.

### 10.5 Affiliate marketplace and attribution

- Separate in-game shops from real-product affiliate listings.
- Affiliate product cards must disclose affiliate relationships clearly and use valid, approved tracking links.
- Do not promise a commission for every click or order. Attribution, commission eligibility, reversals, program restrictions, and payout confirmation are controlled by the affiliate program.
- Before launching player-specific affiliate attribution or incentives, verify the applicable affiliate program terms and platform policies. If player incentives, sub-affiliate attribution, or traffic sources are not permitted, disable that reward path.
- Never fabricate sales, self-referrals, clicks, reviews, or purchases. Keep raw attribution evidence and reconciliation outcomes.

### 10.6 Crafting, marketplace, and summoning

- Players may obtain useful equipment through gameplay, crafting, quests, and permitted in-game trading; real-product purchases must not be required to remain competitive.
- Initial summon tickets should be gameplay-earned. Publish summon probabilities, use server-side RNG, record outcomes, and provide duplicate handling.
- Do not sell paid random loot in the first release. Summoning must not be funded by cash-convertible reward balances.
- Any future player-to-player item trading requires fraud controls, transaction logs, moderation, and separate approval; player-to-player currency transfers remain out of scope for the first release.

### 10.7 CEO controls and audit

CEO dashboard controls:
- configure reward budget policy and percentages;
- set eligibility thresholds, caps, and distribution schedule;
- inspect confirmed revenue and reconciliation status;
- review shared-pool and individual-contribution calculations;
- approve, reject, pause, or reverse a reward batch with reason;
- inspect attribution evidence, anomalies, and immutable audit history.

AI agents may prepare reports and recommendations but cannot independently alter reward policy, approve financial allocations, or issue reward batches outside the signed-off policy.

### 10.8 Initial release exclusions

- No player cash-out, withdrawals, cash conversion, or real-money trading.
- No paid random loot.
- No player-to-player currency transfer.
- No guaranteed real-world income or guaranteed reward per quest.
- No rewards for fake engagement, spam, self-referrals, or unverified social actions.
- No player-specific affiliate incentive until affiliate-program and platform terms are checked.
- No treating commercial work as ordinary unpaid gameplay.

