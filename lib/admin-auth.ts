import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// 운영자 인증(ADR-0002). DB도 Next도 모르는 순수 모듈이다.
// 쿠키 읽기·쓰기는 lib/admin-session.ts가 맡는다.

export type AdminAuthConfig = {
  adminPassword: string;
  sessionSecret: string;
};

export type LoginResult = { ok: true; token: string; expiresAt: Date } | { ok: false };

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// 길이가 달라도 비교 시간이 같도록 해시한 뒤 상수 시간으로 비교한다.
function constantTimeEqual(a: string, b: string): boolean {
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(a), digest(b));
}

export function createAdminAuth({ adminPassword, sessionSecret }: AdminAuthConfig) {
  const sign = (payload: string) =>
    createHmac("sha256", sessionSecret).update(payload).digest("base64url");

  return {
    login(password: string, now: Date): LoginResult {
      if (!constantTimeEqual(password, adminPassword)) return { ok: false };
      const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
      const payload = Buffer.from(JSON.stringify({ exp: expiresAt.getTime() })).toString(
        "base64url",
      );
      return { ok: true, token: `${payload}.${sign(payload)}`, expiresAt };
    },

    verifySession(token: string | undefined, now: Date): boolean {
      if (!token) return false;
      const parts = token.split(".");
      if (parts.length !== 2) return false;
      const [payload, signature] = parts;
      if (!constantTimeEqual(signature, sign(payload))) return false;
      const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
      return now.getTime() < exp;
    },
  };
}
