# ΩMEGA PRIME Δ — Cloudflare Workers Setup

This Worker is the public REST + AI inference edge for ΩMEGA PRIME Δ.

It is intentionally **not** the broker execution authority. AI remains advisory; deterministic AEGIS risk approval and the execution service remain separate.

## Architecture

```text
Client / ΩMEGA UI
      ↓ HTTPS
Cloudflare Worker: omegaaa
      ├── GET  /api/v1/health
      ├── GET  /api/v1/status
      ├── POST /api/v1/ai/generate
      ├── POST /api/v1/ai/stream   (SSE)
      └── Existing React Router UI fallback
              ↓
        Workers AI binding

Future private origin path:
Cloudflare Worker
      ↓ Cloudflare Tunnel / service boundary
Private ΩMEGA backend
      ↓
AEGIS → Execution → Reconciliation → TruthCore
```

## Runtime configuration

`wrangler.jsonc` is the source of truth.

Configured bindings:

- `AI` — Workers AI
- `AI_RATE_LIMITER` — native Workers rate limiting

Configured safety variables:

```text
OMEGA_MODE=PAPER
LIVE_TRADING_ENABLED=false
AI_MODEL=@cf/meta/llama-3.3-70b-instruct-fp8-fast
ALLOWED_ORIGINS=
```

Keep `LIVE_TRADING_ENABLED=false` until the separate ΩMEGA live-certification gates pass.

## Required secret

Create one high-entropy API token for the protected AI routes:

```bash
openssl rand -hex 32
```

Store it as a Cloudflare Worker secret. Do not commit the value.

```bash
npx wrangler secret put OMEGA_API_TOKEN
```

The Worker fails closed if the secret is absent.

## Optional CORS configuration

The dashboard and API currently run on the same Worker, so cross-origin access can remain disabled.

If you later host the UI on another origin, set exact origins only:

```jsonc
"ALLOWED_ORIGINS": "https://paper.example.com"
```

For multiple origins, use a comma-separated allowlist.

## Cloudflare agent setup for OpenAI Codex

Cloudflare's official Codex setup recommends using the Cloudflare plugin so Codex receives Cloudflare Skills and MCP access.

1. Launch Codex from this repository root.

```bash
codex
```

2. In Codex, run:

```text
/plugins
```

3. Install the **Cloudflare** plugin.

Useful Cloudflare MCP endpoints registered by the plugin include:

```text
https://mcp.cloudflare.com/mcp
https://docs.mcp.cloudflare.com/mcp
https://bindings.mcp.cloudflare.com/mcp
https://builds.mcp.cloudflare.com/mcp
https://observability.mcp.cloudflare.com/mcp
```

If configuring Code Mode manually:

```bash
codex mcp add cloudflare --url https://mcp.cloudflare.com/mcp
codex mcp list
```

The first account-level Cloudflare tool call opens an OAuth authorization flow.

## Install and validate

```bash
npm ci
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

Workers AI local simulation is not available; use a remote AI binding or a preview deployment for inference testing.

## Deploy

The repository is already connected to Cloudflare Workers Builds with `main` as the production branch.

Manual deployment:

```bash
npm run build
npm run deploy
```

Or merge an approved branch into `main` and allow Workers Builds to deploy it.

## Smoke tests

Set the deployed Worker URL and the same token stored in `OMEGA_API_TOKEN`:

```bash
export OMEGA_URL="https://omegaaa.<your-workers-subdomain>.workers.dev"
export OMEGA_TOKEN="<your-secret>"
```

Health:

```bash
curl -sS "$OMEGA_URL/api/v1/health"
```

Expected shape:

```json
{
  "ok": true,
  "service": "omega-prime-edge-api",
  "mode": "PAPER",
  "workers_ai_bound": true,
  "timestamp": "..."
}
```

Safety status:

```bash
curl -sS "$OMEGA_URL/api/v1/status"
```

Confirm:

```text
mode = PAPER
live_trading_enabled = false
ai_execution_authority = false
```

Non-streaming inference:

```bash
curl -sS "$OMEGA_URL/api/v1/ai/generate" \
  -H "Authorization: Bearer $OMEGA_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "prompt": "Explain ΩMEGA PRIME risk-first architecture in three bullets.",
    "max_tokens": 256,
    "temperature": 0.2
  }'
```

Streaming inference:

```bash
curl -N "$OMEGA_URL/api/v1/ai/stream" \
  -H "Authorization: Bearer $OMEGA_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "messages": [
      {"role":"user","content":"Summarize current PAPER-mode operating rules."}
    ],
    "max_tokens": 256,
    "temperature": 0.2
  }'
```

The streaming route returns `text/event-stream` directly from Workers AI.

## Production boundary

Do not add broker API keys, wallet private keys, or signing credentials to this Worker.

The next integration step is to expose only the required private ΩMEGA PAPER backend endpoints through Cloudflare Tunnel or another controlled origin boundary, then proxy read/status and validated command routes through this Worker.

Never implement a direct path from Workers AI to broker execution.
