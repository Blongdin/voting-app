import { notFound } from "next/navigation";
import { LivePollResults } from "@/app/components/live-poll-results";
import { PollDeadline } from "@/app/components/poll-deadline";
import { PollStatusBadge } from "@/app/components/poll-status-badge";
import { BottomCTA, buttonClass, Notice, Page, Title, TopBar } from "@/app/components/ui";
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
    <Page>
      <TopBar back={{ href: "/", label: "투표 목록" }} />
      <header className="mt-2">
        <PollStatusBadge status={poll.status} />
        <Title sub={<PollDeadline poll={poll} />}>{poll.question}</Title>
      </header>
      {message && <Notice tone={results.ok ? "info" : "warning"}>{message}</Notice>}
      {results.ok ? (
        <LivePollResults pollId={poll.id} initial={results.results} />
      ) : (
        <VoteForm poll={poll} />
      )}
    </Page>
  );
}

function VoteForm({ poll }: { poll: Poll }) {
  return (
    <form action={castVoteAction.bind(null, poll.id)} className="flex flex-1 flex-col">
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">선택지</legend>
        {poll.options.map((option) => (
          <label
            key={option.id}
            className="flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl bg-surface px-5 py-4 ring-primary transition-[box-shadow,background-color] has-[:checked]:bg-primary-soft has-[:checked]:ring-2 has-[:focus-visible]:ring-2 active:scale-[0.99]"
          >
            <input type="radio" name="optionId" value={option.id} required className="peer sr-only" />
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-line text-[13px] font-bold text-transparent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white"
            >
              ✓
            </span>
            <span className="text-[17px] font-semibold break-keep text-text">{option.label}</span>
          </label>
        ))}
      </fieldset>
      <p className="mt-4 text-center text-[14px] text-muted">낸 표는 바꿀 수 없어요.</p>
      <BottomCTA>
        <button type="submit" className={buttonClass("primary", "large")}>
          표 내기
        </button>
      </BottomCTA>
    </form>
  );
}
