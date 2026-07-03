import { describe, it, expect } from "vitest";
import { ok, err, map, flatMap, unwrap, type Result } from "@/lib/result";

describe("Result helpers", () => {
  it("ok() returns success variant", () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });

  it("err() returns failure variant", () => {
    expect(err("nope")).toEqual({ ok: false, error: "nope" });
  });

  it("map transforms success value", () => {
    const r: Result<number, string> = ok(2);
    expect(map(r, (n) => n * 10)).toEqual({ ok: true, value: 20 });
  });

  it("map passes through error unchanged", () => {
    const r: Result<number, string> = err("fail");
    expect(map(r, (n) => n * 10)).toEqual({ ok: false, error: "fail" });
  });

  it("flatMap chains success", () => {
    const r: Result<number, string> = ok(5);
    expect(flatMap(r, (n) => ok(n + 1))).toEqual({ ok: true, value: 6 });
  });

  it("flatMap passes through error", () => {
    const r: Result<number, string> = err("boom");
    expect(flatMap(r, (n) => ok(n + 1))).toEqual({ ok: false, error: "boom" });
  });

  it("unwrap returns value on success", () => {
    expect(unwrap(ok("hello"))).toBe("hello");
  });

  it("unwrap throws on failure with string error", () => {
    expect(() => unwrap(err("boom"))).toThrow("boom");
  });

  it("unwrap throws on failure with object error (JSON)", () => {
    expect(() => unwrap(err({ code: 500 }))).toThrow(
      JSON.stringify({ code: 500 }),
    );
  });
});
