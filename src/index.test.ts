import { describe, it, expect } from "vitest";
import { encode } from "./index.js";

describe("encode", () => {
  it("returns text unchanged (stub)", () => {
    expect(encode("hello")).toBe("hello");
  });
});
