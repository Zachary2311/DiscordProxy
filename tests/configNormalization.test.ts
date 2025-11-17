import assert from "node:assert/strict";
import test from "node:test";

import { normalizeConfig, RawConfig } from "../src/config";

test("numeric place IDs are normalized to strings", () => {
  const config = normalizeConfig({
    onlyRobloxServer: true,
    placeIds: [123456, "78910"],
    apiKeys: [],
  });

  assert.deepEqual(config.placeIds, ["123456", "78910"]);
});

test("non-coercible place IDs throw an error", () => {
  assert.throws(() => {
    normalizeConfig({
      onlyRobloxServer: true,
      placeIds: [{}],
      apiKeys: [],
    } as RawConfig);
  }, /must be a string or number/);
});
