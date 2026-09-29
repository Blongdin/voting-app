"use server";

import { redirect } from "next/navigation";
import { revalidatePollPages } from "@/app/revalidate-poll-pages";
import { participantIdForVote, rememberParticipant } from "@/lib/participant";
import { castVote } from "@/lib/polls";
import type { VoteNotice } from "./notices";

/** 표 내기. 결과가 무엇이든 투표 화면으로 돌아가고, 실패 이유는 notice로 알린다. */
export async function castVoteAction(pollId: string, formData: FormData) {
  const optionId = String(formData.get("optionId") ?? "");
  const { participantId, isNew } = await participantIdForVote();

  const outcome = await castVote(pollId, optionId, participantId);
  if (outcome === "ok" && isNew) await rememberParticipant(participantId);
  revalidatePollPages(pollId);

  // not_found는 투표 화면에서 404가 된다.
  if (outcome === "ok" || outcome === "not_found") redirect(`/polls/${pollId}`);
  const notice: VoteNotice = outcome;
  redirect(`/polls/${pollId}?notice=${notice}`);
}
