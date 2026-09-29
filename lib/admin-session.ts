import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminAuth } from "@/lib/admin-auth";
import type { Actor } from "@/lib/polls";

// 운영자 세션 쿠키를 읽고 쓰는 연결 코드. 판단은 lib/admin-auth.ts가 한다.

// __Host- 접두사: Secure, Path=/, Domain 없음이 강제된다.
// 지울 때도 같은 속성이 있어야 브라우저가 받아들인다(없으면 InvalidPrefix로 거부해 로그아웃이 안 된다).
const SESSION_COOKIE = "__Host-admin_session";
const SESSION_COOKIE_OPTIONS = { httpOnly: true, secure: true, sameSite: "lax", path: "/" } as const;

function adminAuth() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!adminPassword || !sessionSecret) {
    throw new Error("ADMIN_PASSWORD와 SESSION_SECRET이 설정되지 않았습니다.");
  }
  return createAdminAuth({ adminPassword, sessionSecret });
}

/** 비밀번호가 맞으면 세션 쿠키를 발급하고 true를 돌려준다. Server Action에서만 호출한다. */
export async function tryStartAdminSession(password: string): Promise<boolean> {
  const result = adminAuth().login(password, new Date());
  if (!result.ok) return false;
  (await cookies()).set(SESSION_COOKIE, result.token, {
    ...SESSION_COOKIE_OPTIONS,
    expires: result.expiresAt,
  });
  return true;
}

export async function endAdminSession() {
  (await cookies()).set(SESSION_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
}

/** 현재 요청이 운영자의 것인지. */
export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return adminAuth().verifySession(token, new Date());
}

/** 운영자가 아니면 로그인 화면으로 보낸다. 운영자 페이지와 Server Action마다 호출한다. */
export async function requireAdmin(): Promise<Actor> {
  if (!(await isAdmin())) redirect("/admin/login");
  return { isAdmin: true };
}
