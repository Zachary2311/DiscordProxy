# DiscordProxy

- Zero tracking
- No banning
- Allow access to all API
- Built on top of Fastify (which is blazingly fast)

## Configuration

All configuration happens through the root level `config.json` file:

- `onlyRobloxServer` (boolean) – When `true`, the proxy only accepts
  connections from Roblox address ranges.
- `placeIds` (string[] | number[]) – Restricts usage to the provided Roblox
  place IDs. Each entry may be a string or a number. During start-up the proxy
  normalizes the values to strings and refuses to boot if a value is neither a
  string nor a number so that misconfigurations fail fast.
- `apiKeys` (string[]) – Optional list of API keys that callers must send in the
  `proxy-authorization` header.

### Numeric place IDs

You can verify that numeric place IDs are accepted by running the automated
test suite:

```bash
pnpm install
pnpm test
```

One of the tests loads a configuration that mixes numeric and string place IDs
to prove both are honored.
