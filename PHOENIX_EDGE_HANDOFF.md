# ΩMEGA PRIME Δ — Cloudflare Phoenix Edge Handoff

## Worker

- Worker/project: `omegaaa`
- Repository: `DD505818/omegaaa`
- Production branch: `main`
- Runtime mode: `PAPER`
- `LIVE_TRADING_ENABLED=false`

The Worker remains the public REST / Workers AI edge. It is not an execution authority.

## Phoenix public preview

The current AppDeploy evidence dashboard is available at:

`https://omega-prime-delta-s2po2f.v2.appdeploy.ai/`

It displays the audited PAPER campaign, EdgeForge promotion state, AEGIS 22 authority registry, provider boundaries, and the advisory operator copilot.

## Edge separation

```text
Internet
  ↓
Cloudflare
  ├── TLS / WAF / Access / rate limits
  ├── omegaaa REST + Workers AI edge
  └── optional exact-hostname route to Phoenix preview
          ↓
      AppDeploy control/evidence UI
          ↓
      private control-plane APIs only
          ↓
      AEGIS 22 → VULTURE → broker
```

Neither the Cloudflare Worker nor AppDeploy may hold:

- AEGIS approval-signing keys;
- unrestricted broker credentials;
- withdrawal credentials;
- treasury signing secrets;
- a route that can bypass the private approval service.

## Current Cloudflare Worker API

- `GET /api/v1/health`
- `GET /api/v1/status`
- `POST /api/v1/ai/generate`
- `POST /api/v1/ai/stream`

AI endpoints remain authenticated, rate-limited, research/advisory only, and must never generate execution approval artifacts.

## AppDeploy custom-hostname target

No production hostname has been chosen yet. When an exact hostname is selected, AppDeploy v2 currently expects:

- subdomain: `CNAME` → `proxy-v2.appdeploy.ai`
- apex: prefer `ALIAS`/`ANAME`/CNAME flattening → `proxy-v2.appdeploy.ai`
- IPv4 fallback for an apex that cannot flatten: `18.232.7.146`

Do not create a wildcard route. Do not invent a production hostname.

## Recommended Cloudflare controls before production hostname activation

1. Protect the operator hostname with Cloudflare Access.
2. Enforce HTTPS only and HSTS after hostname validation.
3. Apply WAF managed rules and rate limits to public APIs.
4. Restrict CORS to the exact operator origin.
5. Keep `/api/v1/ai/*` token-authenticated and server-side only.
6. Keep execution/control-plane origins private; do not expose broker-bound routes through the public Worker.
7. Record deployment SHA and evidence version in the operator dashboard.

## Profitability posture

The public edge must not describe ΩMEGA as profitable until EdgeForge has authoritative positive out-of-sample expectancy after real costs and the SHADOW/LIVE degradation evidence required for promotion.
