import "dotenv/config";

///////////////////////////////////////////////////////////////////////////

import fastifyUnderpressure from "@fastify/under-pressure";
import fastifyRatelimit from "@fastify/rate-limit";
import fastifyCompress from "@fastify/compress";
import fastifyProxy from "@fastify/http-proxy";
import fastifyHelmet from "@fastify/helmet";

import { robloxRanges } from "./robloxRanges";
import fs from "node:fs/promises";
import fastify from "fastify";
import net from "node:net";
import path from "node:path";

const LOCAL_IP = ["localhost", "::1", "127.0.0.1", "::ffff:"];
const PROJECT_PATH = "https://github.com/xhayper/DiscordProxy";

(async () => {
  const config = JSON.parse(
    await fs.readFile(path.join(__dirname, "../", "config.json"), "utf-8")
  ) as {
    onlyRobloxServer: boolean;
    placeIds: string[];
    apiKeys: string[];
  };
  const pkg = JSON.parse(
    await fs.readFile(path.join(__dirname, "../", "package.json"), "utf-8")
  ) as {
    version: string;
  };

  if (config.placeIds.length > 0)
    console.log("Place ID list is not empty! Tracking enabled.");

  const apiKeys = new Set(config.apiKeys);

  const app = fastify();

  app.register(fastifyCompress);
  app.register(fastifyHelmet, { global: true });

  app.register(fastifyUnderpressure, {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 100000000,
    maxRssBytes: 100000000,
    maxEventLoopUtilization: 0.98,
    retryAfter: 50,
    message: "Under pressure!",
  });

  app.register(fastifyRatelimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  app.register(fastifyProxy, {
    upstream: "https://discord.com",
    prefix: "/api",
    rewritePrefix: "/api",
    preHandler: (request, reply, done) => {
      if (config.apiKeys.length > 0) {
        const headers = request.headers;
        const apiKey = headers["proxy-authorization"];

        if (!apiKey || !apiKeys.has(apiKey as string)) {
          reply
            .code(403)
            .send({ error: "You are not allowed to use this proxy." });
          return done();
        }

        delete headers["proxy-authorization"];
      }

      if (!config.onlyRobloxServer) return done();

      const originalIp = request.ip;

      if (LOCAL_IP.includes(originalIp)) return done();

      if (config.placeIds.length > 0) {
        const headers = request.headers;
        const placeId = headers["roblox-id"];

        if (!placeId || !config.placeIds.includes(placeId as string)) {
          reply
            .code(403)
            .send({ error: "You are not allowed to use this proxy." });
          return done();
        }
      }

      const normalizedIpInfo = (() => {
        const ipVersion = net.isIP(originalIp);

        if (ipVersion === 0) return null;

        if (ipVersion === 6) {
          const mappedMatch = originalIp.match(/^::ffff:(?:0:)?(.+)$/i);

          if (mappedMatch && net.isIP(mappedMatch[1]) === 4) {
            return { ip: mappedMatch[1], type: "ipv4" as const };
          }

          return { ip: originalIp, type: "ipv6" as const };
        }

        return { ip: originalIp, type: "ipv4" as const };
      })();

      if (
        !normalizedIpInfo ||
        LOCAL_IP.includes(normalizedIpInfo.ip) ||
        !robloxRanges.check(normalizedIpInfo.ip, normalizedIpInfo.type)
      ) {
        reply
          .code(403)
          .send({ error: "You are not allowed to use this proxy." });
        return done();
      }

      return done();
    },
    replyOptions: {
      rewriteRequestHeaders: (_, headers) => {
        headers["user-agent"] = `DiscordProxy/${pkg.version} (${PROJECT_PATH})`;
        delete headers["roblox-id"];
        return headers;
      },
    },
  });

  app.get("/", async (_, reply) => {
    reply.code(404).send({ error: "You are not fetching a correct endpoint!"});
  });

  app
    .listen({ host: "0.0.0.0", port: parseInt(process.env.PORT ?? "3000") })
    .then((host) => {
      console.log(`Listening on ${host}`);
    });
})();
