import { describe, expect, it } from "vitest";
import { createAdminAuth } from "@/lib/admin-auth";

const PASSWORD = "correct horse battery staple";
const SECRET = "test-session-secret-0123456789abcdef";
const auth = createAdminAuth({ adminPassword: PASSWORD, sessionSecret: SECRET });

const now = new Date("2026-09-29T09:00:00Z");
const later = (ms: number) => new Date(now.getTime() + ms);
const HOUR = 60 * 60 * 1000;

function issueToken(issuer = auth): string {
  const result = issuer.login(PASSWORD, now);
  if (!result.ok) throw new Error("테스트 준비: 로그인 실패");
  return result.token;
}

describe("운영자 로그인", () => {
  it("맞는 비밀번호로 로그인하면 발급 직후 유효한 세션을 받는다", () => {
    const result = auth.login(PASSWORD, now);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(auth.verifySession(result.token, now)).toBe(true);
  });

  it("틀린 비밀번호로는 로그인할 수 없다", () => {
    expect(auth.login("wrong password", now)).toEqual({ ok: false });
    expect(auth.login("", now)).toEqual({ ok: false });
  });

  it("세션 서명 키가 32자보다 짧으면 시작하지 않는다", () => {
    expect(() => createAdminAuth({ adminPassword: PASSWORD, sessionSecret: "short" })).toThrow();
  });
});

describe("운영자 세션 검증", () => {
  it("세션은 1일 동안 유효하고, 1일이 지나면 무효다", () => {
    const token = issueToken();

    expect(auth.verifySession(token, later(24 * HOUR - 1000))).toBe(true);
    expect(auth.verifySession(token, later(24 * HOUR))).toBe(false);
  });

  it("토큰을 한 글자라도 바꾸면 무효다", () => {
    const token = issueToken();
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

    for (let i = 0; i < token.length; i++) {
      const index = alphabet.indexOf(token[i]);
      if (index < 0) continue; // 구분 문자는 건너뛴다
      // 6비트 값의 최상위 비트를 뒤집어, 반드시 디코딩 결과가 달라지게 한다.
      const tampered = token.slice(0, i) + alphabet[index ^ 32] + token.slice(i + 1);
      expect(auth.verifySession(tampered, now), `위치 ${i}`).toBe(false);
    }
  });

  it("다른 서명 키로 만든 토큰은 무효다", () => {
    const other = createAdminAuth({
      adminPassword: PASSWORD,
      sessionSecret: "a-different-session-secret-9876543210",
    });

    expect(auth.verifySession(issueToken(other), now)).toBe(false);
  });

  it("운영자 비밀번호를 바꾸면 기존 세션은 무효다", () => {
    const token = issueToken();
    const afterPasswordChange = createAdminAuth({
      adminPassword: "a new admin password",
      sessionSecret: SECRET,
    });

    expect(afterPasswordChange.verifySession(token, now)).toBe(false);
  });

  it("비어 있거나 형식이 틀린 토큰은 무효다", () => {
    const token = issueToken();
    for (const bad of [undefined, "", "garbage", `${token}x`, `${token}.extra`]) {
      expect(auth.verifySession(bad, now)).toBe(false);
    }
  });
});
