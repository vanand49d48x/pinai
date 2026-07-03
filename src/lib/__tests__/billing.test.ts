import { describe, expect, it } from "vitest";
import { isPublishingBlocked } from "@/lib/billing";

describe("isPublishingBlocked", () => {
  it("does not block active subscriptions", () => {
    expect(isPublishingBlocked("active", null)).toBe(false);
  });

  it("does not block canceled subscriptions still within period", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isPublishingBlocked("canceled", future)).toBe(false);
  });

  it("blocks canceled subscriptions after period end", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(isPublishingBlocked("canceled", past)).toBe(true);
  });

  it("blocks canceled with no period end", () => {
    expect(isPublishingBlocked("canceled", null)).toBe(true);
  });
});
