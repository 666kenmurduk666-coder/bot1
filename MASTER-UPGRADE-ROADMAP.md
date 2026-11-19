# Cyborg Cheebee Office — Top 100 Upgrade Roadmap

This roadmap turns the 10 agreed categories into 100 concrete work items. Implementation is staged so that each batch can be tested before the next one is merged. A feature is marked **DONE** only when it exists in this package and has a relevant test; otherwise it remains **PLANNED**.

## 1. AI Brain & Intelligence
1. **DONE** — Public health/version endpoint for basic system self-reporting.
2. **PLANNED** — Provider health checks with safe timeout and model capability probes.
3. **PLANNED** — Per-provider latency, success, failure, and token/cost estimates.
4. **PLANNED** — Configurable model routing by task type and quality/cost preference.
5. **PLANNED** — Automatic failover with bounded retries and circuit breakers.
6. **PLANNED** — Prompt library with versioning, approval, and rollback.
7. **PLANNED** — Context/memory summaries with explicit size and retention limits.
8. **PLANNED** — Source-grounded research mode with citations and provenance.
9. **PLANNED** — Output quality checks and structured response validation.
10. **PLANNED** — AI usage budgets and per-agent spending limits.

## 2. AI Employees & Bot Personalities
11. **PLANNED** — Employee directory with stable roles, skills, and status.
12. **PLANNED** — Bot onboarding, offboarding, and role-change workflow.
13. **PLANNED** — Workload and availability view per bot.
14. **PLANNED** — Skills matrix and task-to-skill matching.
15. **PLANNED** — Bot performance history based on completed, approved work.
16. **PLANNED** — Personality and language settings with safe defaults.
17. **PLANNED** — Bot-to-bot handoff with explicit ownership.
18. **PLANNED** — Employee activity timeline and task provenance.
19. **PLANNED** — Human approval for external/public-facing actions.
20. **PLANNED** — Bot simulation mode that cannot mutate production data.

## 3. Virtual Office & 3D Environment
21. **PLANNED** — Layout validation before saving room and object changes.
22. **PLANNED** — Zoom controls with fit-to-office and reset view.
23. **PLANNED** — Smooth horizontal/vertical scrolling and pan support.
24. **PLANNED** — Room navigation map and current-room indicator.
25. **PLANNED** — Accessible 2D fallback when WebGL is unavailable.
26. **PLANNED** — Adaptive quality settings for low/high-end PCs.
27. **PLANNED** — Bot state animations tied to real task states, not decorative loops.
28. **PLANNED** — Clickable workstations linked to assigned agents and tasks.
29. **PLANNED** — Saveable office camera presets and CEO overview view.
30. **PLANNED** — Performance diagnostics for FPS, memory, and rendering errors.

## 4. Task Automation & Workflow
31. **PLANNED** — Durable task queue with unique task IDs and retry metadata.
32. **PLANNED** — Task dependencies and ordered workflows.
33. **PLANNED** — Priority levels, due dates, and deadlines.
34. **PLANNED** — Queue concurrency limits and back-pressure.
35. **PLANNED** — Retry policy with exponential backoff and dead-letter queue.
36. **PLANNED** — Pause/resume per agent and per workflow.
37. **PLANNED** — Task cancellation with safe cleanup.
38. **PLANNED** — Scheduled jobs with timezone-aware execution.
39. **PLANNED** — Human approval gates for risky actions.
40. **PLANNED** — Workflow templates with dry-run preview.

## 5. CEO Dashboard & Admin Controls
41. **DONE** — CEO-only operations status panel with system counts and uptime.
42. **DONE** — CEO-only manual data backup action.
43. **DONE** — CEO audit trail viewer for recorded administrative/security events.
44. **PLANNED** — CEO role separation (owner, admin, finance, moderator, read-only).
45. **PLANNED** — Session management and logout/revoke controls.
46. **PLANNED** — True multi-factor authentication.
47. **PLANNED** — Admin action confirmation for destructive operations.
48. **PLANNED** — Configuration change history and rollback.
49. **PLANNED** — Admin dashboard filters and exportable reports.
50. **PLANNED** — Emergency-stop authorization and signed resume approval.

## 6. Security & Anti-Manipulation
51. **DONE** — Atomic JSON writes to reduce corruption during interrupted saves.
52. **DONE** — Append-only administrative/security audit log with bounded rotation.
53. **PLANNED** — CSRF protection and origin validation for browser admin actions.
54. **PLANNED** — Secure server-side CEO sessions instead of password-in-every-request.
55. **PLANNED** — Strong password hashing and password-change workflow.
56. **PLANNED** — Input schema validation for every API route.
57. **PLANNED** — Per-route rate limits and distributed-store support.
58. **PLANNED** — Content Security Policy and stricter production headers.
59. **PLANNED** — Secrets manager/environment validation and rotation guide.
60. **PLANNED** — Security event alerts and anomaly detection.

## 7. Bazaar, Orders & Accounting
61. **PLANNED** — Double-entry ledger for every token and peso movement.
62. **PLANNED** — Immutable order status history and actor attribution.
63. **PLANNED** — Refund and partial-refund workflow with ledger reversal.
64. **PLANNED** — Product stock and availability tracking.
65. **PLANNED** — Order fulfilment checklist and delivery proof records.
66. **PLANNED** — Reconciliation report for verified payments, orders, and refunds.
67. **PLANNED** — Separate gross sales, affiliate estimates, actual commissions, and net income.
68. **PLANNED** — Campaign budget reservation and settlement ledger.
69. **PLANNED** — Fraud review queue for unusual orders and referrals.
70. **PLANNED** — Payment-provider integration only after official credentials/webhooks are supplied.

## 8. Coins, XP, Rewards & Economy
71. **PLANNED** — Central ledger-backed coin/XP transaction service.
72. **PLANNED** — Idempotency keys for all reward claims.
73. **PLANNED** — Daily reward caps and anti-farming limits.
74. **PLANNED** — Server-verified task completion evidence.
75. **PLANNED** — Reward approval and reversal workflow.
76. **PLANNED** — Economy simulator to test inflation and sponsor funding.
77. **PLANNED** — Clear visitor wallet statement and transaction history.
78. **PLANNED** — Expiry and policy rules for promotional rewards.
79. **PLANNED** — Referral attribution rules and duplicate/self-referral checks.
80. **PLANNED** — Reward liability and sponsor-fund coverage dashboard.

## 9. Analytics, Reports & Monitoring
81. **PLANNED** — Daily/weekly business KPI summaries.
82. **PLANNED** — Revenue and expense breakdown with accounting definitions.
83. **PLANNED** — Agent productivity and queue throughput charts.
84. **PLANNED** — Error-rate and API-latency monitoring.
85. **PLANNED** — Bazaar funnel from visit to product click to order.
86. **PLANNED** — Campaign ROI report based on verified data only.
87. **PLANNED** — Visitor cohort and retention analytics with privacy limits.
88. **PLANNED** — CSV exports for orders, ledger, and reports.
89. **PLANNED** — Configurable alert thresholds.
90. **PLANNED** — Status page and incident history.

## 10. Backup, Recovery & Performance
91. **DONE** — Timestamped data backups with a manifest.
92. **DONE** — Backup retention capped at the newest 20 snapshots.
93. **PLANNED** — CEO-controlled restore with pre-restore safety snapshot and validation.
94. **PLANNED** — Scheduled automatic backups with retention policy.
95. **PLANNED** — Backup integrity hashes and restore drills.
96. **PLANNED** — SQLite migration with transactional writes and schema migrations.
97. **PLANNED** — PostgreSQL option for multi-user production deployments.
98. **PLANNED** — Background job persistence and restart recovery.
99. **PLANNED** — Load testing and resource-based adaptive throttling.
100. **PLANNED** — Production deployment checklist, monitoring, and disaster-recovery runbook.

## Current batch
The v7 Operations Foundation implements atomic JSON persistence, a basic health endpoint, a CEO-only operations panel, timestamped data backups with retention, and a CEO audit trail. These foundations do not mean the other 95 items are already implemented. Continue in tested batches, prioritizing ledger/accounting, task queue durability, session security, and virtual-office fidelity.

## Safety notes
- Backups include private settings and API credentials. Keep them private and outside public web roots.
- The current application still uses JSON-file storage. Atomic replacement reduces partial-write risk but does not provide multi-process transactions or full database guarantees.
- Payment verification remains manual. No payment gateway or trusted social-share callback is connected.
- Never mark a feature done until it has code, tests, and an installation/rollback note.

---

## Strategic direction addendum — 2026-11-19

The original 100 items above are retained; this addendum does not silently mark any of them complete or replace their categories. The company now has two equally important pillars: (1) AI business operations for affiliate research, original content production, rules-based Facebook/YouTube publishing through authorized integrations, and analytics; and (2) an MMORPG/community experience within one seamless connected Mega World, linking the social office, public districts, and adventure regions. Publishing is set to **RULES**: only pre-approved routine content that passes deterministic checks may auto-publish; uncertain content is held for review; prohibited content is blocked. See `MASTER-ARCHITECTURE.md` and `IMPLEMENTATION-ROADMAP.md` for module boundaries, policy gates, data separation, and staged dependencies. No new runtime feature is claimed as implemented by this documentation update.
