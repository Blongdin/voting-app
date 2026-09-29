"use client";

import Link from "next/link";
import { useLivePollResults } from "@/app/components/live-poll-results";
import { PollResultsView } from "@/app/components/poll-results";
import { BottomCTA, buttonClass } from "@/app/components/ui";
import type { PollResults } from "@/lib/polls";
import { ConfirmSubmitButton } from "./confirm-submit-button";

/**
 * 운영자 결과 화면의 본문: 실시간 결과와 마감·삭제 버튼.
 * 삭제 확인 문구의 표 수가 화면의 실시간 표 수와 같도록 같은 결과 상태를 쓴다.
 */
export function AdminPollPanel({
  pollId,
  initial,
  closeAction,
  deleteAction,
}: {
  pollId: string;
  initial: PollResults;
  closeAction: () => Promise<void>;
  deleteAction: () => Promise<void>;
}) {
  const results = useLivePollResults(pollId, initial);

  return (
    <>
      <PollResultsView results={results} />
      <Link href={`/polls/${pollId}`} className={`${buttonClass("neutral", "medium")} mt-4 w-full`}>
        참여자 화면 보기
      </Link>
      <BottomCTA>
        <div className="flex gap-2">
          <ConfirmSubmitButton
            action={deleteAction}
            confirmMessage={`이 투표와 표 ${results.totalVotes}개가 삭제됩니다. 되돌릴 수 없습니다.`}
            label="삭제하기"
            pendingLabel="삭제하는 중…"
            variant="danger"
          />
          {results.status === "open" && (
            <ConfirmSubmitButton
              action={closeAction}
              confirmMessage="마감은 되돌릴 수 없습니다. 이 투표를 마감할까요?"
              label="마감하기"
              pendingLabel="마감하는 중…"
              variant="primary"
            />
          )}
        </div>
      </BottomCTA>
    </>
  );
}
