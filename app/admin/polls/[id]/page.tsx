import Link from "next/link";
import { notFound } from "next/navigation";
import { LivePollResults } from "@/app/components/live-poll-results";
import { PollStatusBadge } from "@/app/components/poll-status-badge";
import { requireAdmin } from "@/lib/admin-session";
import { getPoll, getResults } from "@/lib/polls";

// 운영자는 표를 내지 않아도 결과를 본다.
export default async function AdminPollPage({ params }: PageProps<"/admin/polls/[id]">) {
  const actor = await requireAdmin();
  const { id } = await params;
  const poll = await getPoll(id);
  const results = await getResults(id, actor);
  if (!poll || !results.ok) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
        ← 운영자 화면
      </Link>
      <header className="mt-4 mb-6 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">{poll.question}</h1>
        <PollStatusBadge status={poll.status} />
      </header>
      <LivePollResults key={poll.id} pollId={poll.id} initial={results.results} />
      <p className="mt-6 text-sm">
        <Link href={`/polls/${poll.id}`} className="underline">
          참여자 화면 보기
        </Link>
      </p>
    </main>
  );
}
