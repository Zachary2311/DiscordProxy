# DiscordProxy

- Zero tracking
- No banning
- Allow access to all API
- Built on top of Fastify (which is blazingly fast)

## Forwarded IP handling

DiscordProxy expects upstream load balancers to forward the caller's address in the standard [`X-Forwarded-For`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For) header. Fastify is configured with `trustProxy` so the left-most entry in that header becomes `request.ip`, which is what both the Roblox subnet gate and the rate-limit plugin rely on.

If your deployment has multiple reverse proxies in front of DiscordProxy, set the number of trusted hops via the `TRUSTED_PROXY_HOPS` environment variable so Fastify knows how many addresses to trust when parsing `X-Forwarded-For`. Leaving it unset trusts the entire chain (the default).
