import Link from "next/link";
import { notFound } from "next/navigation";
import { LivePollResults } from "@/app/components/live-poll-results";
import { PollStatusBadge } from "@/app/components/poll-status-badge";
import { participantActor } from "@/lib/participant";
import { getPoll, getResults, type Poll } from "@/lib/polls";
import { castVoteAction } from "./actions";
import { voteNoticeMessage } from "./notices";

export default async function PollPage({ params, searchParams }: PageProps<"/polls/[id]">) {
  const { id } = await params;
  const { notice } = await searchParams;
  const poll = await getPoll(id);
  if (!poll) notFound();

  // 진행 중이고 아직 표를 내지 않은 참여자에게는 결과 대신 투표 양식을 보여 준다.
  const results = await getResults(poll.id, await participantActor());
  const message = voteNoticeMessage(notice, results.ok);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← 투표 목록
      </Link>
      <header className="mt-4 mb-6 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">{poll.question}</h1>
        <PollStatusBadge status={poll.status} />
      </header>
      {message && (
        <p
          role="status"
          className="mb-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        >
          {message}
        </p>
      )}
      {results.ok ? (
        <LivePollResults key={poll.id} pollId={poll.id} initial={results.results} />
      ) : (
        <VoteForm poll={poll} />
      )}
    </main>
  );
}

function VoteForm({ poll }: { poll: Poll }) {
  return (
    <form action={castVoteAction.bind(null, poll.id)} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">선택지</legend>
        {poll.options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 has-[:checked]:border-zinc-900 dark:border-zinc-800 dark:has-[:checked]:border-zinc-100"
          >
            <input type="radio" name="optionId" value={option.id} required />
            {option.label}
          </label>
        ))}
      </fieldset>
      <p className="text-sm text-zinc-500">낸 표는 바꿀 수 없습니다.</p>
      <button
        type="submit"
        className="self-start rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        표 내기
      </button>
    </form>
  );
}
