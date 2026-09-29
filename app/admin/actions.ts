"use server";

import { redirect } from "next/navigation";
import { endAdminSession, startAdminSession } from "@/lib/admin-session";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get("password");
  if (typeof password !== "string" || !(await startAdminSession(password))) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin/login");
}
