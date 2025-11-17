# DiscordProxy

- Zero tracking
- No banning
- Allow access to all API
- Built on top of Fastify (which is blazingly fast)

## Configuration

Update `config.json` before starting the proxy:

| Field | Description |
| --- | --- |
| `onlyRobloxServer` | When `true`, only Roblox IP ranges can access the proxy. |
| `placeIds` | Optional Roblox place IDs that must be provided via the `roblox-id` header. Leave empty to accept any place. |
| `apiKeys` | Optional list of API keys that must be sent in the `proxy-authorization` header. |
| `trustedReverseProxies` | IP addresses of reverse proxies/load balancers that you control. Requests coming from these peers may forward the Roblox source IP via the `X-Forwarded-For` header and will be checked against the allowlist. Spoofed headers coming directly from the internet are ignored, keeping the Roblox-only restriction intact. |

Example:

```json
{
  "onlyRobloxServer": true,
  "placeIds": ["123456"],
  "apiKeys": ["example-key"],
  "trustedReverseProxies": ["10.0.0.1"]
}
```

With the above configuration a Roblox server connecting through the reverse proxy at `10.0.0.1` may forward its original IP in `X-Forwarded-For`. The allowlist now sees the actual Roblox IP, while a malicious client that spoofs the header without coming through the trusted proxy will still be rejected.

## Testing

Run the automated tests to verify the header handling logic:

```bash
pnpm test
```
