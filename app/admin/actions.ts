"use server";

import { redirect } from "next/navigation";
import { revalidatePollPages } from "@/app/revalidate-poll-pages";
import { endAdminSession, requireAdmin, tryStartAdminSession } from "@/lib/admin-session";
import type { PollInputErrors } from "@/lib/poll-rules";
import { closePoll, createPoll, deletePoll } from "@/lib/polls";

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
  // 로그아웃하면 참여자로서 홈으로 돌아간다.
  redirect("/");
}

export type CreatePollState = {
  errors?: PollInputErrors;
  /** 검증 실패 시 입력을 되살리기 위해 제출한 값을 돌려준다. */
  values?: { question: string; options: string[]; closesAtLocal: string };
  createdPollId?: string;
};

export async function createPollAction(
  _prev: CreatePollState,
  formData: FormData,
): Promise<CreatePollState> {
  const actor = await requireAdmin();
  const question = String(formData.get("question") ?? "");
  const options = formData.getAll("option").map(String);
  // 폼은 운영자 기기의 현지 시각(closesAtLocal)을 UTC ISO 문자열(closesAt)로 바꿔 보낸다.
  const closesAtIso = String(formData.get("closesAt") ?? "");
  const closesAtLocal = String(formData.get("closesAtLocal") ?? "");
  const closesAt = closesAtIso ? new Date(closesAtIso) : null;
  if (closesAtLocal && !closesAtIso) {
    // 스크립트가 돌기 전에 제출됐다. 마감 시각을 조용히 버리지 않는다.
    return { errors: { closesAt: "invalid" }, values: { question, options, closesAtLocal } };
  }

  // 도메인 모듈도 운영자인지 다시 확인한다. requireAdmin을 통과했으므로 forbidden은 오지 않는다.
  const result = await createPoll(actor, question, options, closesAt);
  if (!result.ok) {
    if (result.reason === "forbidden") redirect("/admin/login");
    return { errors: result.errors, values: { question, options, closesAtLocal } };
  }
  revalidatePollPages();
  return { createdPollId: result.pollId };
}

export async function closePollAction(pollId: string) {
  const actor = await requireAdmin();
  const result = await closePoll(actor, pollId);
  if (!result.ok) {
    // requireAdmin을 통과했으므로 forbidden은 오지 않는다.
    if (result.reason === "forbidden") redirect("/admin/login");
    // 없는 투표면 새로 그릴 화면이 없다. 운영자 결과 화면은 이미 404를 보여 준다.
    return;
  }
  revalidatePollPages(pollId);
}

export async function deletePollAction(pollId: string) {
  const actor = await requireAdmin();
  const result = await deletePoll(actor, pollId);
  // requireAdmin을 통과했으므로 forbidden은 오지 않는다.
  if (!result.ok && result.reason === "forbidden") redirect("/admin/login");
  // 삭제했거나 이미 없는 투표면, 사라진 투표의 화면 대신 운영자 목록으로 돌아간다.
  revalidatePollPages(pollId);
  redirect("/admin");
}
