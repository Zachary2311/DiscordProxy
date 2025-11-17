import { describe, expect, it } from "vitest";
import { robloxRanges } from "../robloxRanges";

describe("robloxRanges IPv6 support", () => {
  it("allows IPv6 addresses that belong to Roblox", () => {
    const knownRobloxIpv6 = "2620:135:6008::1234";

    expect(robloxRanges.check(knownRobloxIpv6, "ipv6")).toBe(true);
  });

  it("denies arbitrary IPv6 addresses", () => {
    const randomIpv6 = "2001:db8::1";

    expect(robloxRanges.check(randomIpv6, "ipv6")).toBe(false);
  });
});
