import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminAuth } from "@/lib/admin-auth";

// 운영자 세션 쿠키를 읽고 쓰는 연결 코드. 판단은 lib/admin-auth.ts가 한다.

const SESSION_COOKIE = "admin_session";

function adminAuth() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!adminPassword || !sessionSecret) {
    throw new Error("ADMIN_PASSWORD와 SESSION_SECRET이 설정되지 않았습니다.");
  }
  return createAdminAuth({ adminPassword, sessionSecret });
}

/** 비밀번호가 맞으면 세션 쿠키를 발급하고 true를 돌려준다. Server Action에서만 호출한다. */
export async function startAdminSession(password: string): Promise<boolean> {
  const result = adminAuth().login(password, new Date());
  if (!result.ok) return false;
  (await cookies()).set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: result.expiresAt,
  });
  return true;
}

export async function endAdminSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** 현재 요청이 운영자의 것인지. */
export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return adminAuth().verifySession(token, new Date());
}

/** 운영자가 아니면 로그인 화면으로 보낸다. 운영자 페이지와 Server Action마다 호출한다. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
