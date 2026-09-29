import Link from "next/link";
import { connection } from "next/server";
import { listPolls, type PollSummary } from "@/lib/polls";

export default async function Home() {
  // 목록은 요청마다 DB에서 읽는다(빌드 시점에 굳히지 않는다).
  await connection();
  const polls = await listPolls();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">투표</h1>
      {polls.length === 0 ? (
        <p className="text-zinc-500">아직 투표가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {polls.map((poll) => (
            <PollListItem key={poll.id} poll={poll} />
          ))}
        </ul>
      )}
    </main>
  );
}

function PollListItem({ poll }: { poll: PollSummary }) {
  const closed = poll.status === "closed";
  return (
    <li>
      <Link
        href={`/polls/${poll.id}`}
        className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        <span className={closed ? "text-zinc-500" : "font-medium"}>{poll.question}</span>
        <span className="flex shrink-0 items-center gap-3 text-sm text-zinc-500">
          <span>{poll.totalVotes}표</span>
          <span
            className={
              closed
                ? "rounded bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800"
                : "rounded bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100"
            }
          >
            {closed ? "마감" : "진행 중"}
          </span>
        </span>
      </Link>
    </li>
  );
}
