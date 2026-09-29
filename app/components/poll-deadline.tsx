import { formatDeadline } from "@/lib/format";
import type { PollStatus } from "@/lib/polls";

/** 진행 중이고 마감 시각이 있는 투표에만 "10월 3일 18:00 마감"을 보여 준다. */
export function PollDeadline({
  poll,
  className = "",
}: {
  poll: { status: PollStatus; closesAt: Date | null };
  className?: string;
}) {
  if (poll.status !== "open" || !poll.closesAt) return null;
  return <span className={`text-zinc-500 ${className}`}>{formatDeadline(poll.closesAt)}</span>;
}
