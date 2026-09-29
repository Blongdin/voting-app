import type { CastVoteResult } from "@/lib/polls";

/** 표 내기가 실패해 투표 화면으로 돌아왔을 때 보여 주는 안내. */
export type VoteNotice = Exclude<CastVoteResult, "ok" | "not_found">;

const messages: Record<VoteNotice, string> = {
  already_voted: "이미 참여한 투표입니다.",
  closed: "마감된 투표입니다.",
  invalid_option: "표를 낼 수 없었습니다. 선택지를 다시 골라 주세요.",
};

/**
 * URL의 notice 값을 안내 문구로 바꾼다. 알 수 없는 값은 무시한다.
 * showingResults: 결과를 보여 줄 때는 결과에 관한 안내만, 투표 양식일 때는 양식에 관한 안내만 띄운다.
 */
export function voteNoticeMessage(notice: unknown, showingResults: boolean): string | undefined {
  if (typeof notice !== "string" || !Object.hasOwn(messages, notice)) return undefined;
  const known = notice as VoteNotice;
  const aboutResults = known === "already_voted" || known === "closed";
  return aboutResults === showingResults ? messages[known] : undefined;
}
