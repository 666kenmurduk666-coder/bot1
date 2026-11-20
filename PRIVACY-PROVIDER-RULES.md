# Privacy rules para sa AI providers — bot1

Rule ng bahay: **AI recommends, CEO approves.** Hindi lahat ng provider ay ligtas para sa bawat klase ng data.

## Golden rule

| Uri ng data | Saan pwede |
|---|---|
| CEO password, API keys, payment reference, customer PII, pribadong usapan | **Ollama (local) lang. NEVER cloud.** |
| Internal ops / drafts / non-sensitive content | **Groq** → fallback **Ollama** |
| Public captions, research summaries mula sa pampublikong pahina | Groq, Ollama, o (kung kailangan) OpenRouter `:free` |
| Anything na hindi mo ipapaskil sa Facebook | Huwag ipadala sa free cloud routes |

## Bakit

| Provider | Privacy note |
|---|---|
| **Ollama (local)** | Hindi umaalis sa PC; walang third-party logs. **Default para sa sensitibo.** |
| **Groq** | May bayad/free API terms; hindi itinuturing na training data, pero **huwag padalhan ng keys o PII**. |
| **OpenRouter free routes** | Ang docs mismo ay nagbababala: free providers **maaaring mag-log ng prompts/outputs**. Emergency lang. |
| **Kilo Code free pool** | Nagwawarn din na maaaring i-route sa provider na naglo-log. Iwasan sa pribado. |
| **NVIDIA trial endpoints** | "Trial use only — do not submit personal or confidential data. Your use is logged." |
| **Google Gemini free tier** | Sa EEA/UK/CH, prompts ay hindi ginagamit para sa improvement; sa ibang rehiyon **pwede**. |
| **OVHcloud AI Endpoints** | **3rd layer na ng bot1** (walang key). EU data centers, anonymous 2 RPM/IP. Mas maganda sa EU, pero **huwag padalhan ng secrets**. |
| **AxForge** | EU-hosted; ayon sa listahan, prompts/completions **hindi sine-save o ginagamit sa training**. |
| **Cohere free trial** | **Non-commercial use only.** |
| **ModelScope / SiliconFlow** | Kailangan ng real-name verification; hindi ideal para sa anonymous/testing. |

## Praktikal na check bago mag-post

1. May password, key, customer name, o payment detail ba sa text? → **Ollama**.
2. Pampubliko lang at kailangang mabilis? → **Groq**.
3. Patay ang Groq at kailangan talaga? → **Ollama muna**, saka OpenRouter kung may key.
4. Huwag i-save ang API key sa browser/localStorage ng bisita. `data/settings.json` at `.env` lang.

## Kaugnay na files

- `FREE-PROVIDERS.md` — base URL, limits, at sample models
- `docs\free-llm-apis\SKILL.md` — step-by-step na pagkuha ng key
- `check-providers.js` — read-only health check (walang binabago)
