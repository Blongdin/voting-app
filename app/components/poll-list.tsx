import Link from "next/link";
import type { PollSummary } from "@/lib/polls";
import { PollDeadline } from "./poll-deadline";
import { PollStatusBadge } from "./poll-status-badge";

/** hrefBase: 항목 링크의 앞부분. 운영자 목록은 운영자용 결과 화면으로 보낸다. */
export function PollList({
  polls,
  hrefBase = "/polls",
}: {
  polls: PollSummary[];
  hrefBase?: string;
}) {
  if (polls.length === 0) {
    return (
      <div className="rounded-3xl bg-surface px-5 py-12 text-center">
        <p className="text-[17px] font-semibold text-text">아직 투표가 없습니다.</p>
        <p className="mt-1 text-[15px] text-muted">새 투표가 올라오면 여기에 보여요.</p>
      </div>
    );
  }
  return (
    <ul className="overflow-hidden rounded-3xl bg-surface">
      {polls.map((poll) => (
        <li key={poll.id} className="border-b border-line last:border-b-0">
          <Link
            href={`${hrefBase}/${poll.id}`}
            className="flex items-center gap-3 px-5 py-4 transition-colors active:bg-fill"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span
                className={`truncate text-[17px] font-semibold ${poll.status === "closed" ? "text-muted" : "text-text"}`}
              >
                {poll.question}
              </span>
              <span className="flex items-center gap-2 text-[14px] text-muted">
                <span className="tabular-nums">{poll.totalVotes}표</span>
                <PollDeadline poll={poll} className="before:mr-2 before:content-['·']" />
              </span>
            </span>
            <PollStatusBadge status={poll.status} />
            <span aria-hidden className="text-xl text-muted">
              ›
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
