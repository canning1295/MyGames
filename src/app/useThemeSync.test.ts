import { describe, expect, it } from "vitest";
import { resolveTheme } from "./theme-utils";

describe("resolveTheme", () => {
  it("returns explicit preference when not system", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("maps system preference to dark when system prefers dark", () => {
    expect(resolveTheme("system", true)).toBe("dark");
  });

  it("maps system preference to light when system prefers light", () => {
    expect(resolveTheme("system", false)).toBe("light");
  });
});
