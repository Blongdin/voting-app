import Link from "next/link";
import { notFound } from "next/navigation";
import { closePollAction, deletePollAction } from "@/app/admin/actions";
import { PollStatusBadge } from "@/app/components/poll-status-badge";
import { requireAdmin } from "@/lib/admin-session";
import { resultsViewer } from "@/lib/participant";
import { getPoll, getResults } from "@/lib/polls";
import { AdminPollPanel } from "./admin-poll-panel";

// 운영자는 표를 내지 않아도 결과를 본다. 마감과 삭제도 여기서 한다.
export default async function AdminPollPage({ params }: PageProps<"/admin/polls/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const poll = await getPoll(id);
  // 결과 API와 같은 보는 사람을 써서 폴링 전후로 "내 표" 표시가 어긋나지 않게 한다.
  const results = await getResults(id, await resultsViewer());
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
      <AdminPollPanel
        pollId={poll.id}
        initial={results.results}
        closeAction={closePollAction.bind(null, poll.id)}
        deleteAction={deletePollAction.bind(null, poll.id)}
      />
    </main>
  );
}
