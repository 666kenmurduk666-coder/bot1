# Cyborg Cheebee Office — MMORPG Game Design & Safe Implementation Plan

**Design status:** APPROVED DIRECTION / NOT YET IMPLEMENTED  
**Compatibility target:** Existing Phase D v8 office and the separate Multiplayer Batch 0 safety baseline.
**World layout decision:** Seamless Mega World (approved 2026-11-19).

## 1. Confirmed player decisions

- **World style:** Open world.
- **Combat:** Action combat; players directly move, aim/attack, dodge, and use skills.
- **World integration:** Seamless connected geography. The Company Campus, social districts, training grounds, and Adventure Regions are part of one continuous player-facing world.
- **CEO identity:** The owner is Cyborg Cheebee, the unique CEO avatar. Do not replace this identity with a generic CEO avatar or a second unrelated CEO robot.
- **Core idea:** One seamless social/company/adventure world using the same player account/avatar identity, while business, social, and adventure code/data remain separate modules.

## 2. Product vision

The Company Campus remains the social and business anchor of the Mega World. Players can work with or watch AI employees, meet friends, chat, join events, and then travel by connected roads, paths, gates, transit routes, or natural terrain into training and adventure districts. Normal travel should not require a separate game-launch menu or visible portal-loading screen.

The connected Adventure Regions form a 3D third-person open-world action RPG. Players explore, fight fictional pest monsters and fantasy beasts, complete quests, collect equipment, level up, and form parties to fight stronger enemies and bosses.

**Important separation:** Adventure gameplay must live in its own module, routes, world state, and data namespace. It must not replace or rewrite the existing office scene, office bots, office tasks, Bazaar, CEO operations, or Phase D v8 interface.

## 3. Shared identity and characters

- Use one account/player identity across Office and Adventure when the account system is implemented.
- Office player presence and Adventure character state are different world states; being in one world must not create a duplicate player in the other.
- The CEO's office avatar remains the official Cyborg Cheebee design. In the Adventure World, the CEO may use a recognizable Cyborg Cheebee hero/combat loadout; it remains the same owner identity and is not a second account.
- Other players create customizable adventurer characters. Suggested starter classes (proposed, not yet locked): Vanguard/Warrior, Ranger, Mage, and Engineer.
- Guest players may try a temporary character, but persistent level, inventory, and rewards require a properly linked account before public progression is enabled.

## 4. Open-world structure

Open world means players can freely roam and discover routes across connected districts. Seamless describes the player experience, not one unlimited scene or one monolithic server. Use background asset streaming, level-of-detail, natural gates, paths, caves, bridges, tunnels, and invisible server handoffs as needed for performance. If a device requires a short transition, preserve player/party state and present it as an in-world passage.

Suggested first world map:

| Zone | Suggested level | Purpose |
|---|---:|---|
| Cheebee Training Grounds | 1–3 | Safe tutorial, movement, attacks, dodge, first quest |
| Infested Greenway | 3–6 | First open hunting area; giant ants and mutant mosquitoes |
| Abandoned Scrap District | 6–10 | Ruined industrial area; cockroaches and mechanical pests |
| Toxic Marsh | 10–15 | Stronger poisonous insects and environmental hazards |
| Queen's Underground Nest | 15–20 | Dungeon-like open cavern and first major insect queen boss |
| Future regions | 20+ | Expand only after the first regions pass performance and gameplay tests |

Players should see other players who are in the same Adventure World zone/instance. Use interest management so clients receive nearby player and monster updates, not every entity in the whole world.

## 5. Action combat design

### Desktop controls (initial proposal)
- WASD: move.
- Mouse: camera/look direction and aiming.
- Left click: basic attack.
- Right click: aim or secondary action, depending on class.
- Space: dodge/evade; jump may use a separate key if needed.
- 1–4: equipped skills.
- E: interact, collect, or talk to NPC.
- Esc: settings and leave/return controls.

### Mobile controls
- Left virtual joystick: movement.
- Right-side buttons: basic attack, dodge, and equipped skills.
- Tap target or use a target-lock control; provide a camera sensitivity option.
- UI buttons must be large enough for touch and must not cover essential combat visibility.

### Combat rules
- Movement, hit validation, cooldowns, monster health, damage, XP, drops, and rewards are server-authoritative.
- The client sends input/attack intents; it cannot decide that a monster died or award itself XP, coins, or rare items.
- Attacks need readable animations, hit feedback, cooldown indicators, and clear enemy telegraphs so players can dodge fairly.
- Keep combat non-graphic and suitable for a broad audience: impact effects, sparks, slime/energy effects, and defeat animations rather than gore.
- Avoid pay-to-win power. Monetization, if ever considered, should be cosmetic-only and reviewed separately.

## 6. Monsters and enemies

Enemies are fictional game creatures, not instructions for harming real pests or animals. Use stylized mutant insects and fantasy beasts. Ordinary pets and familiar domestic animals should not become targets.

Suggested first enemy roster:

| Enemy | Role | Difficulty |
|---|---|---|
| Giant Ant Scout | Basic melee enemy; teaches attack timing | Easy |
| Mutant Mosquito | Fast, evasive enemy; teaches dodge | Easy |
| Armored Cockroach | Defensive enemy; teaches skill use | Medium |
| Venom Spider | Area/poison warning enemy | Medium |
| Scrap Scorpion | Heavy attack enemy | Hard |
| Mutant Hornet | Fast flying enemy | Hard |
| Termite Queen | First major boss with phases and summoned minions | Boss |

Future fantasy-beast enemies may include mutant boars, wolves, and other fictional creatures, with clear fantasy designs. Do not use real-world animal cruelty imagery.

### Boss design
- Bosses have readable attack patterns and warning zones.
- Boss rewards are granted once per eligible player/party completion, with server-side anti-repeat and anti-exploit checks.
- Boss encounters support solo play where reasonable and party play for higher difficulty.

## 7. Progression and rewards

- XP comes from server-verified monster defeats, quests, exploration milestones, and party objectives.
- Level-ups unlock skill points or skill upgrades and controlled stat increases.
- Equipment has clear rarity tiers: Common, Uncommon, Rare, Epic, and Legendary.
- Drops are generated and awarded by the server. Clients cannot submit their own drop results.
- Include quest rewards and crafting materials so players have alternatives to repetitive monster farming.
- Add anti-farming limits, duplicate event protection, and reward logs before public progression.
- Keep Adventure XP/items separate from the existing Bazaar wallet and business accounting. Do not merge game coins with real money, affiliate balances, or Bazaar payments.
- No real-money trading, cash-out, paid random loot, or player-to-player currency transfers in the first playable release.

## 8. Multiplayer activities

- Solo exploration and hunting.
- Party size target: up to 5 players for the first group content.
- Shared party quests and boss encounters.
- Friends list, party invite, party leader, and leave/kick controls.
- Guilds and large raids are later features, after presence, persistence, moderation, and load tests are stable.
- Player-versus-player combat is disabled in the initial release. It can be considered later as an optional, separate mode with safety controls.

## 9. Seamless travel across the Mega World

1. Player enters the Mega World at the Company Campus or Central Plaza.
2. The player walks or uses in-world transport along connected routes to the Social District, Event Arena, Training Grounds, and Adventure Regions.
3. The world client streams nearby district assets in the background; the player does not choose a separate game from a launch menu.
4. The server validates district access and performs any required invisible server/region handoff.
5. Player identity, avatar appearance, party membership, safe checkpoint, and valid quest state persist across district boundaries.
6. Friends/presence show the player's current public district/area without exposing private data.
7. If Adventure services fail, the player is returned to a safe public district; the Company Campus and business services remain available.

A visible portal may exist as an optional in-world landmark or fast-travel feature later, but it is not the required boundary between Office and Adventure and must not create a separate game-launch flow.

## 10. First playable vertical slice

Do not build all regions, classes, bosses, trading, and guilds at once. The first playable test should contain only:

- One compact continuous map connecting a Company Campus section, Central Plaza, Training Grounds, and a starter wilderness zone, with background streaming and no separate game-launch flow.
- One small open starter zone.
- One player character with third-person movement, camera, basic attack, dodge, and one skill.
- Three enemy types: Giant Ant Scout, Mutant Mosquito, and Armored Cockroach.
- One short quest and one small boss encounter after the basic combat is stable.
- Server-validated enemy health, damage, XP, and drops.
- Two-browser test showing two human players in the same zone and seeing each other's movement and combat outcomes.
- Desktop controls first, then mobile touch controls before public beta.

Only expand the world after this slice passes repeatable tests.

## 11. Implementation phases and dependency gates

The existing office multiplayer roadmap remains the prerequisite. Do not skip its transport, remote avatar, and server-authoritative movement gates.

### MMO Phase 0 — Design baseline (this document)
- Confirm open world, action combat, seamless connected geography, modular implementation boundaries, and CEO identity.
- Define world boundaries, starter enemies, progression, controls, and safe reward rules.
- No runtime files changed by this design phase.

### MMO Phase 1 — Isolated Adventure module shell
- Add the world shell and separately testable district modules behind a feature flag; integrate the Company Campus through an explicit adapter without rewriting Phase D v8.
- Keep office code paths and office scene intact.
- Add feature flag/configuration so Adventure can be disabled without affecting the office.
- Add route and module-load tests; no combat rewards yet.

### MMO Phase 2 — Adventure world and character state
- Add Adventure world/zone identity to the multiplayer server model.
- Add district spawn/checkpoints, player presence by district, background streaming, and safe invisible server handoffs.
- Keep Office and Adventure state separated while reusing authenticated player identity.

### MMO Phase 3 — Action movement and combat foundation
- Add third-person camera and desktop controls, then touch controls.
- Add server-validated input, attack range, cooldown, dodge, and collision checks.
- Add client prediction/interpolation only after server movement is authoritative.

### MMO Phase 4 — Monsters and encounter simulation
- Add server-owned monster spawning, AI states, health, attacks, respawn rules, and boss phases.
- Add client animation/telegraph presentation.
- Add tests for forged damage, impossible attack speed, and unauthorized rewards.

### MMO Phase 5 — XP, quests, inventory, and drops
- Add persistent character progression and inventory in a transactional data store.
- Add server-side reward ledger, idempotency, daily limits, and audit trail.
- Keep all Adventure balances separate from Bazaar and business balances.

### MMO Phase 6 — Parties, friends, dungeons, and events
- Add party invitations, shared quest objectives, boss eligibility, and moderation tools.
- Add guilds/raids only after party stability and capacity tests.

### MMO Phase 7 — Performance and closed beta
- Test desktop and mobile devices.
- Load-test players and monsters by zone; measure tick time, latency, memory, and disconnects.
- Start with a limited pilot (initial target 20–30 concurrent users only if measured tests support it).
- Expand capacity only after measured results.

## 12. Non-negotiable v8 safety rules

- Treat the supplied Phase D v8 ZIP as the rollback baseline.
- Do not replace `server.js`, `public/index.html`, Phase B/C/D scripts, or the service worker just to add an early MMORPG mock-up.
- Do not overwrite or delete the user's private `data/` directory, settings, passwords, API keys, Bazaar orders, or backups.
- Keep all Adventure files in a separate module/folder and integrate through explicit, tested entry points.
- Every implementation batch must include a backup/rollback note, syntax checks, regression tests, and a clear list of changed files.
- Do not claim a feature is live until code, tests, and two-browser acceptance checks prove it.

## 13. Acceptance checklist before public Adventure beta

- Office opens and all existing v8 office features still work when Adventure is disabled.
- District travel/handoff does not duplicate a player or corrupt office state; the player experiences continuous travel.
- Two browsers can enter the same zone and see each other.
- Movement and combat are server-authoritative.
- Forged damage, speed, XP, item, and drop packets are rejected.
- Players cannot attack or loot outside valid range/encounter eligibility.
- Reconnect does not duplicate XP, items, quest rewards, or boss rewards.
- Chat moderation, report, mute, and block controls work across worlds.
- Adventure inventory and XP are not mixed with Bazaar/business balances.
- Desktop and mobile controls are tested before public release.
- Capacity claims match measured load-test results.

## Current implementation status

**Design only.** This document records the selected MMORPG direction and a staged plan. It does not add live seamless travel, world streaming, district handoffs, combat, monsters, XP, or multiplayer transport. The Phase D v8 runtime files remain unchanged in this design package.
