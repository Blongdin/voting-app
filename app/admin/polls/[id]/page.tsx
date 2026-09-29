import { notFound } from "next/navigation";
import { closePollAction, deletePollAction } from "@/app/admin/actions";
import { PollDeadline } from "@/app/components/poll-deadline";
import { PollStatusBadge } from "@/app/components/poll-status-badge";
import { Page, Title, TopBar } from "@/app/components/ui";
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
    <Page>
      <TopBar back={{ href: "/admin", label: "운영자" }} />
      <header className="mt-2">
        <PollStatusBadge status={poll.status} />
        <Title sub={<PollDeadline poll={poll} />}>{poll.question}</Title>
      </header>
      <AdminPollPanel
        pollId={poll.id}
        initial={results.results}
        closeAction={closePollAction.bind(null, poll.id)}
        deleteAction={deletePollAction.bind(null, poll.id)}
      />
    </Page>
  );
}
