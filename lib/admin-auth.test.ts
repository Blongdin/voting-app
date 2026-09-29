import { describe, expect, it } from "vitest";
import { createAdminAuth } from "@/lib/admin-auth";

const auth = createAdminAuth({
  adminPassword: "correct horse battery staple",
  sessionSecret: "test-session-secret-0123456789abcdef",
});
const now = new Date("2026-09-29T09:00:00Z");
const later = (ms: number) => new Date(now.getTime() + ms);
const HOUR = 60 * 60 * 1000;

function issueToken(): string {
  const result = auth.login("correct horse battery staple", now);
  if (!result.ok) throw new Error("테스트 준비: 로그인 실패");
  return result.token;
}

describe("운영자 로그인", () => {
  it("맞는 비밀번호로 로그인하면 발급 직후 유효한 세션을 받는다", () => {
    const result = auth.login("correct horse battery staple", now);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(auth.verifySession(result.token, now)).toBe(true);
  });

  it("틀린 비밀번호로는 로그인할 수 없다", () => {
    expect(auth.login("wrong password", now)).toEqual({ ok: false });
    expect(auth.login("", now)).toEqual({ ok: false });
  });
});

describe("운영자 세션 검증", () => {
  it("세션은 1일 동안 유효하고, 1일이 지나면 무효다", () => {
    const token = issueToken();

    expect(auth.verifySession(token, later(24 * HOUR - 1000))).toBe(true);
    expect(auth.verifySession(token, later(24 * HOUR))).toBe(false);
  });

  it("만료 시각을 바꾼 토큰은 무효다", () => {
    const [, signature] = issueToken().split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ exp: later(365 * 24 * HOUR).getTime() })).toString(
      "base64url",
    );

    expect(auth.verifySession(`${forgedPayload}.${signature}`, now)).toBe(false);
  });

  it("다른 서명 키로 만든 토큰은 무효다", () => {
    const other = createAdminAuth({
      adminPassword: "correct horse battery staple",
      sessionSecret: "a-different-session-secret-9876543210",
    });
    const result = other.login("correct horse battery staple", now);
    if (!result.ok) throw new Error("테스트 준비: 로그인 실패");

    expect(auth.verifySession(result.token, now)).toBe(false);
  });

  it("비어 있거나 형식이 틀린 토큰은 무효다", () => {
    for (const token of [undefined, "", "garbage", "a.b", "a.b.c", "..", `${issueToken()}x`, `${issueToken()}.extra`]) {
      expect(auth.verifySession(token, now)).toBe(false);
    }
  });
});
