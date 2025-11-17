import fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
  type HookHandlerDoneFunction,
} from "fastify";
import fastifyUnderpressure from "@fastify/under-pressure";
import fastifyRatelimit from "@fastify/rate-limit";
import fastifyCompress from "@fastify/compress";
import fastifyProxy from "@fastify/http-proxy";
import fastifyHelmet from "@fastify/helmet";

import { robloxRanges } from "./robloxRanges";

const PROJECT_PATH = "https://github.com/xhayper/DiscordProxy";
const LOCAL_IPS = new Set(["localhost", "::1", "127.0.0.1", "::ffff:127.0.0.1"]);

export type AppConfig = {
  onlyRobloxServer: boolean;
  placeIds: string[];
  apiKeys: string[];
  trustedReverseProxies?: string[];
};

export type PackageInfo = {
  version: string;
};

const normalizeAddress = (address: string | undefined) => {
  if (!address) return "";
  return address.startsWith("::ffff:") ? address.slice(7) : address;
};

export const buildTrustedProxySet = (entries: string[] | undefined) => {
  const set = new Set<string>();

  for (const value of entries ?? []) {
    set.add(value);
    const normalized = normalizeAddress(value);
    set.add(normalized);
  }

  return set;
};

const isLocalIp = (ip: string) => {
  if (!ip) return false;
  if (LOCAL_IPS.has(ip)) return true;
  const normalized = normalizeAddress(ip);
  return LOCAL_IPS.has(normalized);
};

const buildForbiddenResponse = (reply: FastifyReply) =>
  reply.code(403).send({ error: "You are not allowed to use this proxy." });

export const resolveClientIp = (
  request: FastifyRequest,
  trustedProxies: Set<string>
) => {
  const remoteAddress = normalizeAddress(
    request.socket.remoteAddress ?? request.ip
  );

  if (!trustedProxies.has(remoteAddress)) {
    return normalizeAddress(request.ip);
  }

  const forwardedHeader = request.headers["x-forwarded-for"];
  const forwarded = Array.isArray(forwardedHeader)
    ? forwardedHeader[0]
    : forwardedHeader;

  if (!forwarded) return remoteAddress;

  const [firstHop] = forwarded.split(",");

  return normalizeAddress(firstHop?.trim());
};

export const createProxyPreHandler = (
  config: AppConfig,
  apiKeys: Set<string>,
  trustedProxies: Set<string>
) =>
  (
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
  ) => {
    if (config.apiKeys.length > 0) {
      const headers = request.headers;
      const apiKeyHeader = headers["proxy-authorization"];
      const apiKey = Array.isArray(apiKeyHeader)
        ? apiKeyHeader[0]
        : apiKeyHeader;

      if (!apiKey || !apiKeys.has(apiKey)) {
        buildForbiddenResponse(reply);
        return done();
      }

      delete headers["proxy-authorization"];
    }

    if (!config.onlyRobloxServer) return done();

    const ip = resolveClientIp(request, trustedProxies);

    if (isLocalIp(ip)) return done();

    if (config.placeIds.length > 0) {
      const headers = request.headers;
      const placeIdHeader = headers["roblox-id"];
      const placeId = Array.isArray(placeIdHeader)
        ? placeIdHeader[0]
        : placeIdHeader;

      if (!placeId || !config.placeIds.includes(placeId)) {
        buildForbiddenResponse(reply);
        return done();
      }
    }

    if (!robloxRanges.check(ip)) {
      buildForbiddenResponse(reply);
      return done();
    }

    return done();
  };

export const buildApp = (config: AppConfig, pkg: PackageInfo): FastifyInstance => {
  const apiKeys = new Set(config.apiKeys);
  const trustedProxies = buildTrustedProxySet(config.trustedReverseProxies);
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
    preHandler: createProxyPreHandler(config, apiKeys, trustedProxies),
    replyOptions: {
      rewriteRequestHeaders: (_, headers) => {
        headers["user-agent"] = `DiscordProxy/${pkg.version} (${PROJECT_PATH})`;
        delete headers["roblox-id"];
        return headers;
      },
    },
  });

  app.get("/", async (_, reply) => {
    reply
      .code(404)
      .send({ error: "You are not fetching a correct endpoint!" });
  });

  return app;
};
