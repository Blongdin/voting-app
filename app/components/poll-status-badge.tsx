import type { PollStatus } from "@/lib/polls";

const badgeByStatus: Record<PollStatus, { className: string; label: string }> = {
  open: {
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
    label: "진행 중",
  },
  closed: { className: "bg-zinc-100 dark:bg-zinc-800", label: "마감" },
};

export function PollStatusBadge({ status }: { status: PollStatus }) {
  const { className, label } = badgeByStatus[status];
  return <span className={`rounded px-2 py-0.5 text-sm ${className}`}>{label}</span>;
}
