# unfortunately… — architecture map

## two parts, one repo
- `extension/` — Chrome Manifest V3 extension. Vanilla JS, no bundler. Loaded directly by Chrome.
- `api/` + `prompts/` — Vercel serverless proxy. Deploy repo root to Vercel. Extension calls this.

## data flow
```
Gmail email arrives
  → extension/src/content.js       MutationObserver watches for new emails
  → extension/src/background.js    receives message, runs detection
  → extension/src/detection.js     keyword rules → confidence score → rejection | acceptance | none
  if rejection:
    → background.js calls POST api/rewrite.js with email text + humor mode
    → api/rewrite.js validates, rate limits, calls AI API using prompts/
    → background.js receives rewrite, tells content.js to inject it
    → extension/src/storage.js     increments streak + rejection count
  if acceptance:
    → extension/src/celebration.js confetti + big message + streak reset
    → storage.js                   resets streak
```

## key decisions (don't redo these)
- detection is rule-based, NOT AI. Predictable + free.
- AI is only used for rewriting. Calls are cached locally (storage.js) to avoid repeats.
- no backend DB. All user state lives in chrome.storage.local.
- rate limiting on proxy is in-memory for v1 (sufficient for low volume).

## file quick reference
| file | job |
|---|---|
| extension/src/content.js | watches Gmail DOM, injects rewrites |
| extension/src/background.js | message hub, orchestrates detection + AI calls |
| extension/src/detection.js | rejection/acceptance keyword rules + scoring |
| extension/src/storage.js | chrome.storage.local read/write wrapper |
| extension/src/celebration.js | acceptance confetti + UI |
| extension/popup.js | popup UI logic (streak, stats) |
| api/rewrite.js | Vercel serverless: validate → rate limit → AI → respond |
| prompts/system.js | system prompts per humor mode |
| prompts/template.js | rewrite prompt template |

## env vars (proxy, set in Vercel)
- AI_API_KEY — OpenAI or Anthropic key
- MAX_CALLS_PER_DAY — optional rate limit cap
