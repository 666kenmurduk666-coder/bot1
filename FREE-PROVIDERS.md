# Free LLM Providers — cheat sheet

Hango sa `awesome-free-llm-apis` (`docs\free-llm-apis\data.json`, lastUpdated: 2026-11-15).
Reference lang ito — hindi binabago ang app. Para sa setup steps: `docs\free-llm-apis\SKILL.md` at `references\*.md`.

## Quick pick

| Kung kailangan mo | Gamitin |
|---|---|
| Pinakamabilis, may key na tayo | **Groq** — `qwen/qwen3.8-27b` |
| Private / offline / walang token limit | **Ollama (local)** — `qwen2.5:3b` |
| **bot1 actual order** | **Groq → Ollama → OVHcloud** (walang key) |
| Walang signup, pang-test lang | **OVHcloud** (2 RPM/IP, naka-set na), **Kilo Code**, **LLM7.io** |
| Maraming libreng model, pang-emergency | **OpenRouter** `:free` (50 RPD) |
| EU hosting | **OVHcloud**, **AxForge** |

## Provider APIs (may sariling modelo)

| Provider | Base URL | Free tier / notes | Sample models |
|---|---|---|---|
| **Aion Labs** (IL) | `https://api.aionlabs.ai/v1` | Permanent free tier, no credit card required. 15 RPM, 20K tokens/day. Specialized for roleplay and storytelling. | aion-labs/aion-2.0<br>aion-labs/aion-rp-llama-3.1-8b<br>aion-labs/aion-3.0<br>+1 more |
| **Cohere** (CA) | `https://api.cohere.com/v2` | Free "Trial" API key, no credit card. 1,000 API calls/month. Non-commercial use only. | command-a-plus-05-2026<br>command-a-03-2025<br>command-r-plus-08-2024<br>+8 more |
| **Google Gemini** (US) | `https://generativelanguage.googleapis.com/v1beta` | Free tier, no credit card. Free-tier prompts may be used by Google to improve products. | gemini-3.8-flash<br>gemini-3.6-flash<br>gemini-3.5-flash-lite<br>+5 more |
| **Z AI (Zhipu AI)** (CN) | `https://open.bigmodel.cn/api/paas/v4` | Permanent free models, no credit card required. | glm-4.7-flash<br>glm-4.5-flash<br>glm-4.6v-flash |

## Inference providers (host ng open models)

| Provider | Base URL | Free tier / notes | Sample models |
|---|---|---|---|
| **AxForge** (IE) | `https://api.axforge.ai/v1` | Permanent free tier, no credit card required: 3M tokens every 30 days, shared across models. Open models hosted in the EU (Stockholm, Sweden). OpenAI… | qwen3.8-27b<br>qwen3.8-flash-next<br>glm-5.3-flash<br>+1 more |
| **Cloudflare Workers AI** (US) | `https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run` | 10,000 Neurons/day free, no credit card required. 60+ models available on the free tier. | @cf/meta/llama-3.3-70b-instruct-fp8-fast<br>@cf/meta/llama-4-scout-17b-16e-instruct<br>@cf/openai/gpt-oss-120b<br>+4 more |
| **Gonka Broker** (US) | `https://proxy.gonkabroker.com/v1` | Permanent free tier, no credit card required; phone verification required. ~1M tokens/month (shared, varies by model), resets monthly. Model lineup ro… | MiniMaxAI/MiniMax-M2.7<br>deepseek-ai/DeepSeek-V4-Flash-0731<br>zai-org/GLM-5.3-Flash<br>+1 more |
| **Groq** (US) | `https://api.groq.com/openai/v1` | Free tier, no credit card. Ultra-fast LPU inference. | openai/gpt-oss-120b<br>openai/gpt-oss-20b<br>qwen/qwen3.8-27b |
| **Kilo Code** (US) | `https://api.kilo.ai/api/gateway` | Free models with no credit card and no API key required. `kilo-auto/free` auto-router dynamically routes to models in the free pool. | nvidia/nemotron-3-ultra-550b-a55b:free<br>nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free<br>cohere/north-mini-code:free<br>+6 more |
| **LLM7.io** (GB) | `https://api.llm7.io/v1` | API gateway with a free tier. Anonymous access needs no key and reaches the `turbo` models; a free token from token.llm7.io raises the rate and token… | gpt-oss:20b<br>mistral-Nemo-Instruct-2407<br>codestral-latest |
| **ModelScope** (CN) | `https://api-inference.modelscope.cn/v1` | Free API-Inference for registered users. Requires Alibaba Cloud account binding + real-name verification. | Qwen/Qwen3.5-35B-A3B<br>Qwen/Qwen3.5-27B |
| **NVIDIA NIM** (US) | `https://integrate.api.nvidia.com/v1` | Free with NVIDIA Developer Program membership. 100+ models. Rate-limited per model. | nvidia/nemotron-3-ultra-550b-a55b<br>openai/gpt-oss-20b |
| **OpenRouter** (US) | `https://openrouter.ai/api/v1` | 17 free models (marked with `:free` suffix). OpenAI SDK-compatible. | cohere/north-mini-code:free<br>google/gemma-4-26b-a4b-it:free<br>google/gemma-4-31b-it:free<br>+6 more |
| **OVHcloud AI Endpoints** (FR) | `https://oai.endpoints.kepler.ai.cloud.ovh.net/v1` | Free anonymous tier (no API key, no signup): 2 RPM per IP per model. 20+ open-weight models hosted in EU. OpenAI SDK-compatible. | Qwen3.5-397B-A17B<br>gpt-oss-120b<br>gpt-oss-20b<br>+6 more |
| **SiliconFlow** (CN) | `https://api.siliconflow.cn/v1` | Permanently free models, no credit card required. Identity verification required. 100+ models in the catalog, most of them paid. | tencent/Hunyuan-MT-7B<br>XingChenAGI/Xing4.0-29B |

## Glossary

| Term | Ibig sabihin |
|---|---|
| RPM | Requests per minute |
| RPD | Requests per day |
| TPM | Tokens per minute |
| TPD | Tokens per day |
| RPS | Requests per second |

## Paalala para sa bot1

- Ang app ay nakaconfigure na sa **Groq → Ollama → OVHcloud**; huwag baguhin nang sabay-sabay.
- Ang OVHcloud ay anonymous (walang key) pero **2 RPM/IP lang** — emergency lang, at kailangan ng mas malaking `max_tokens` para sa reasoning models.
- Nagbabago ang free tiers — i-verify muna sa provider bago mag-depend.
- Sensitibong CEO/customer data: **Ollama lang**. Tingnan ang `PRIVACY-PROVIDER-RULES.md`.
- May provider na nangangailangan ng phone/real-name verification; **non-commercial** ang Cohere trial.
