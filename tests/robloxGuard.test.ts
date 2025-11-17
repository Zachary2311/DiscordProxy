import assert from "node:assert/strict";
import test from "node:test";
import fastify from "fastify";

import {
  buildTrustedProxySet,
  createProxyPreHandler,
  type AppConfig,
} from "../src/app";

const baseConfig: AppConfig = {
  onlyRobloxServer: true,
  placeIds: [],
  apiKeys: [],
  trustedReverseProxies: ["10.0.0.1"],
};

const buildTestServer = (config: AppConfig) => {
  const trusted = buildTrustedProxySet(config.trustedReverseProxies);
  const app = fastify({
  });

  app.route({
    method: "GET",
    url: "/api/test",
    preHandler: createProxyPreHandler(
      config,
      new Set(config.apiKeys),
      trusted
    ),
    handler: async () => ({ ok: true }),
  });

  return app;
};

test("allows Roblox IPs forwarded by trusted reverse proxies", async (t) => {
  const app = buildTestServer(baseConfig);
  t.after(() => app.close());

  const response = await app.inject({
    method: "GET",
    url: "/api/test",
    remoteAddress: "10.0.0.1",
    headers: {
      "x-forwarded-for": "128.116.0.10",
    },
  });

  assert.equal(response.statusCode, 200);
});

test("blocks spoofed X-Forwarded-For headers from untrusted clients", async (t) => {
  const app = buildTestServer(baseConfig);
  t.after(() => app.close());

  const response = await app.inject({
    method: "GET",
    url: "/api/test",
    remoteAddress: "203.0.113.5",
    headers: {
      "x-forwarded-for": "128.116.0.10",
    },
  });

  assert.equal(response.statusCode, 403);
});
