import Link from "next/link";
import type { PollSummary } from "@/lib/polls";
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
    return <p className="text-zinc-500">아직 투표가 없습니다.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {polls.map((poll) => (
        <li key={poll.id}>
          <Link
            href={`${hrefBase}/${poll.id}`}
            className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <span className={poll.status === "closed" ? "text-zinc-500" : "font-medium"}>
              {poll.question}
            </span>
            <span className="flex shrink-0 items-center gap-3 text-sm text-zinc-500">
              <span>{poll.totalVotes}표</span>
              <PollStatusBadge status={poll.status} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
