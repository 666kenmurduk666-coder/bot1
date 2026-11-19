# Ollama / local AI notes (2026-11-20)

## Ano ang nangyari (root cause)

Sintomas: "nag-hahang ang PC / walang sagot ang app kapag ginagamit ang Ollama".

Tatlong sabay na problema:

1. **Sobrang laki ng model para sa GPU.**
   `gemma4:12b` = 7.47 GB. Ang Radeon RX 6600 ay 8 GB VRAM lang.
   Kapag na-load na ang model + 4096 context (KV cache) + compute buffers,
   puno ang VRAM at umaasa na sa shared system memory -> umaalog / nag-hahang
   ang buong PC habang nag-iisip ang model.

2. **Reasoning model = empty reply.**
   Ang `gemma4:12b` ay naglalagay ng sagot sa `reasoning` at **walang laman ang
   `content`** kapag naka-on ang thinking. Ang app ay `content` lang ang binabasa,
   kaya "AI returned empty content" -> failover -> paulit-ulit.
   Nasukat: 1m40s bawat request, tapos walang sagot.

3. **Auto-unload + mabagal na reload.**
   Pag walang gamit ng ~5 minuto, ini-unload ng Ollama ang model. Ang susunod na
   request ay naghihintay ng ~30s (minsan mas matagal) para mag-load muli.
   Walang timeout ang app noon, kaya nagmumukhang hang.

Bonus: **down ang Vyce cloud** (HTTP 503), kaya hindi pwedeng doon lumipat.

## Mga fix na inilagay sa `server.js`

- `reasoning_effort: "none"` para sa local endpoints -> lumalabas na agad ang
  sagot sa `content` (1.2s lang sa test, vs 5s na walang sagot).
- `keep_alive: "30m"` -> hindi na nagre-reload tuwing gagamitin.
- 5-minute timeout (`AbortSignal.timeout`) + malinaw na error message.
- Fallback: kung empty pa rin ang `content`, ginagamit ang tail ng `reasoning`
  para may sagot pa rin instead na hard error.
- Log ng "AI replied in Ns" kapag lumampas sa 20s (makikita sa Logs panel).

## System settings na inilagay

User environment variables (kailangan ng restart ng Ollama para gumana):

- `OLLAMA_KEEP_ALIVE=30m`  -> model stays loaded for 30 minutes
- `OLLAMA_NUM_PARALLEL=1`  -> isang request lang, mas maliit ang KV cache

## Ano ang nangyari pagkatapos (resulta)

- Na-download at na-install ang `qwen2.5:3b` (1.9 GB).
- Pinalitan ang model sa `data/settings.json` mula `gemma4:12b` -> `qwen2.5:3b`.
- Loaded footprint: **2.2 GB VRAM, 100% GPU** (dating 7.5 GB na sumasabog sa 8 GB).
- Test sa app: **unang sagot 17s** (kasama ang model load), **warm reply 2.5s**,
  at may laman na ang `content`. Dati: **1m40s at walang sagot**.

Kung gusto mong bumalik sa 12B (hindi recommended sa 8 GB GPU):

```json
"model": "gemma4:12b"
```

## Rekomendasyon (kapag ready ka)

Ang 12B ay talagang mabigat para sa 8 GB GPU. Mas magaan at mas mabilis:

```powershell
ollama pull qwen2.5:3b     # ~1.9 GB, mabilis at maayos sa Taglish
ollama run qwen2.5:3b
```

Tapos palitan ang model sa app (Setup o `data/settings.json`):

```json
"model": "qwen2.5:3b"
```

Mga mas magaan na opsyon: `llama3.2:3b`, `gemma3:4b`, `qwen2.5:7b` (4.7 GB, sakto lang).

## Kung gusto mong huwag nang gumamit ng local AI

Ang Vyce cloud ay 503 ngayon. Kapag bumalik ito, puwedeng ilipat pabalik:

```json
"provider": "vyce",
"apiKey": "<vyce key>",
"baseUrl": "https://vyceai.com/api/v1",
"model": "gpt-4o-mini"
```

## Mga command na madaling gamitin

```powershell
ollama list            # anong models ang naka-install
ollama ps              # anong naka-load ngayon at saan tumatakbo
ollama stop <model>    # i-unload agad (para bumalik ang VRAM)
```

Kung nag-hang ulit: `ollama stop gemma4:12b` -> babalik agad ang GPU memory.
