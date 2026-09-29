import type { PollResults } from "@/lib/polls";

export function PollResultsView({ results }: { results: PollResults }) {
  const leading = Math.max(...results.options.map((o) => o.votes));
  return (
    <section aria-label="결과" className="rounded-3xl bg-surface p-5">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-[19px] font-bold text-text">결과</h2>
        <p className="text-[15px] text-muted">
          총 <span className="font-semibold text-sub tabular-nums">{results.totalVotes}</span>표
        </p>
      </div>
      <ul className="flex flex-col gap-5">
        {results.options.map((option) => {
          const mine = option.id === results.myOptionId;
          const top = results.totalVotes > 0 && option.votes === leading;
          return (
            <li key={option.id} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`break-keep text-[16px] ${top ? "font-bold text-text" : "font-medium text-sub"}`}>
                    {option.label}
                  </span>
                  {mine && (
                    <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[12px] font-semibold text-primary">
                      내 표
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-right tabular-nums">
                  <span className={`text-[18px] font-bold ${mine || top ? "text-primary" : "text-text"}`}>
                    {option.percent}%
                  </span>
                  <span className="ml-1.5 text-[14px] text-muted">{option.votes}표</span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-fill" role="presentation">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${mine || top ? "bg-primary" : "bg-bar"}`}
                  style={{ width: `${option.percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
