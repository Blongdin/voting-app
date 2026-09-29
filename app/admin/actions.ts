"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endAdminSession, isAdmin, requireAdmin, tryStartAdminSession } from "@/lib/admin-session";
import type { PollInputErrors } from "@/lib/poll-rules";
import { createPoll } from "@/lib/polls";

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

export type CreatePollState = {
  errors?: PollInputErrors;
  /** 검증 실패 시 입력을 되살리기 위해 제출한 값을 돌려준다. */
  values?: { question: string; options: string[] };
  createdPollId?: string;
};

export async function createPollAction(
  _prev: CreatePollState,
  formData: FormData,
): Promise<CreatePollState> {
  await requireAdmin();
  const question = String(formData.get("question") ?? "");
  const options = formData.getAll("option").map(String);

  const result = await createPoll({ isAdmin: await isAdmin() }, question, options);
  if (!result.ok) {
    if (result.reason === "forbidden") redirect("/admin/login");
    return { errors: result.errors, values: { question, options } };
  }
  revalidatePath("/");
  revalidatePath("/admin");
  return { createdPollId: result.pollId };
}
