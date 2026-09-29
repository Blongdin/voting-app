import type { PollResults } from "@/lib/polls";

export function PollResultsView({ results }: { results: PollResults }) {
  return (
    <section aria-label="결과" className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {results.options.map((option) => {
          const mine = option.id === results.myOptionId;
          return (
            <li key={option.id} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-4">
                <span className={mine ? "font-semibold" : undefined}>
                  {option.label}
                  {mine && (
                    <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-xs text-sky-800 dark:bg-sky-900 dark:text-sky-100">
                      내 선택
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-sm text-zinc-500 tabular-nums">
                  {option.votes}표 · {option.percent}%
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                role="presentation"
              >
                <div
                  className={mine ? "h-full bg-sky-500" : "h-full bg-zinc-400 dark:bg-zinc-500"}
                  style={{ width: `${option.percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-zinc-500">총 {results.totalVotes}표</p>
    </section>
  );
}
