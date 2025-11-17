import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import { buildApp, type AppConfig, type PackageInfo } from "./app";

(async () => {
  const config = JSON.parse(
    await fs.readFile(path.join(__dirname, "../", "config.json"), "utf-8")
  ) as AppConfig;
  const pkg = JSON.parse(
    await fs.readFile(path.join(__dirname, "../", "package.json"), "utf-8")
  ) as PackageInfo;

  config.apiKeys ??= [];
  config.placeIds ??= [];
  config.trustedReverseProxies ??= [];

  if (config.placeIds.length > 0)
    console.log("Place ID list is not empty! Tracking enabled.");

  const app = buildApp(config, pkg);

  app
    .listen({ host: "0.0.0.0", port: parseInt(process.env.PORT ?? "3000") })
    .then((host) => {
      console.log(`Listening on ${host}`);
    });
})();
