export interface RawConfig {
  onlyRobloxServer: boolean;
  placeIds: unknown;
  apiKeys: string[];
}

export interface NormalizedConfig extends Omit<RawConfig, "placeIds"> {
  placeIds: string[];
}

export function normalizeConfig(rawConfig: RawConfig): NormalizedConfig {
  const { placeIds } = rawConfig;

  if (!Array.isArray(placeIds)) {
    throw new TypeError("config.placeIds must be an array");
  }

  const normalizedPlaceIds = placeIds.map((id, index) => {
    if (typeof id === "string" || typeof id === "number") {
      return String(id);
    }

    throw new TypeError(
      `config.placeIds[${index}] must be a string or number, received ${typeof id}`
    );
  });

  return {
    ...rawConfig,
    placeIds: normalizedPlaceIds,
  };
}
