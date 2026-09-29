import Link from "next/link";
import { notFound } from "next/navigation";
import { PollStatusBadge } from "@/app/components/poll-status-badge";
import { getPoll } from "@/lib/polls";

export default async function PollPage({ params }: PageProps<"/polls/[id]">) {
  const { id } = await params;
  const poll = await getPoll(id);
  if (!poll) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← 투표 목록
      </Link>
      <header className="mt-4 mb-6 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">{poll.question}</h1>
        <PollStatusBadge status={poll.status} />
      </header>
      <ul className="flex flex-col gap-2">
        {poll.options.map((option) => (
          <li
            key={option.id}
            className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            {option.label}
          </li>
        ))}
      </ul>
    </main>
  );
}
