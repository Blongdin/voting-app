"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureParticipantId } from "@/lib/participant";
import { castVote } from "@/lib/polls";

/** 표 내기. 결과가 무엇이든 투표 화면으로 돌아가고, 실패 이유는 notice로 알린다. */
export async function castVoteAction(pollId: string, formData: FormData) {
  const optionId = String(formData.get("optionId") ?? "");
  const participantId = await ensureParticipantId();

  const outcome = await castVote(pollId, optionId, participantId);
  revalidatePath("/");
  revalidatePath(`/polls/${pollId}`);
  // not_found는 투표 화면에서 404가 된다.
  redirect(outcome === "ok" || outcome === "not_found" ? `/polls/${pollId}` : `/polls/${pollId}?notice=${outcome}`);
}
