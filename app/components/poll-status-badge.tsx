import type { PollStatus } from "@/lib/polls";

const badgeByStatus: Record<PollStatus, { className: string; label: string }> = {
  open: { className: "bg-primary-soft text-primary", label: "진행 중" },
  closed: { className: "bg-fill text-muted", label: "마감" },
};

export function PollStatusBadge({ status }: { status: PollStatus }) {
  const { className, label } = badgeByStatus[status];
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[13px] font-semibold ${className}`}>{label}</span>
  );
}
