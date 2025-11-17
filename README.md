# DiscordProxy

- Zero tracking
- No banning
- Allow access to all API
- Built on top of Fastify (which is blazingly fast)

## Operations endpoints

- `GET /health` exposes liveness information including the running version, Fastify uptime, and current resource metrics provided by `@fastify/under-pressure` (event loop delay, heap usage, RSS, etc.).
- `GET /ready` exposes readiness information with the same metrics payload so orchestrators can determine if the proxy is under pressure before routing traffic.
