"use server";

import { redirect } from "next/navigation";
import { endAdminSession, tryStartAdminSession } from "@/lib/admin-session";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get("password");
  if (typeof password !== "string" || !(await tryStartAdminSession(password))) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }
  redirect("/admin");
}

// 로그아웃은 자기 쿠키만 지우므로 운영자 확인(requireAdmin)이 필요 없는 유일한 예외다.
export async function logout() {
  await endAdminSession();
  redirect("/admin/login");
}
