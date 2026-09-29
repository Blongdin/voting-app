"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PollResults } from "@/lib/polls";
import { PollResultsView } from "./poll-results";

const POLL_INTERVAL_MS = 5000;

/**
 * 진행 중인 투표의 결과를 5초마다 결과 API에서 다시 가져온다.
 * - 탭이 숨겨지면 멈추고, 다시 보이면 곧바로 한 번 가져온 뒤 이어서 한다.
 * - 투표가 마감되면 멈추고 화면 전체를 새로 그려 상태 배지를 "마감"으로 바꾼다.
 * - 결과를 더 볼 수 없게 되면(403, 404: 삭제 등) 멈추고 화면을 새로 그린다.
 */
export function LivePollResults({ pollId, initial }: { pollId: string; initial: PollResults }) {
  const [results, setResults] = useState(initial);
  const router = useRouter();

  // 서버가 새 결과를 내려주면(router.refresh, 다른 투표로 이동) 그것으로 맞춘다.
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setResults(initial);
  }

  const open = results.status === "open";

  useEffect(() => {
    if (!open) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let latestRequest = 0;

    const fetchResults = async () => {
      const request = ++latestRequest;
      try {
        const response = await fetch(`/api/polls/${pollId}/results`, { cache: "no-store" });
        if (response.status === 403 || response.status === 404) {
          stopped = true;
          router.refresh();
          return;
        }
        if (!response.ok) return;
        const next: PollResults = await response.json();
        // 늦게 도착한 옛 응답이 새 응답을 덮어쓰지 않게 한다.
        if (!stopped && request === latestRequest) setResults(next);
      } catch {
        // 네트워크 오류는 다음 주기에 다시 시도한다.
      }
    };
    const tick = async () => {
      await fetchResults();
      schedule();
    };
    const schedule = () => {
      clearTimeout(timer);
      if (stopped || document.visibilityState !== "visible") return;
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    };
    const onVisibilityChange = () => {
      clearTimeout(timer);
      if (document.visibilityState === "visible") tick();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pollId, open, router]);

  // 폴링 중에 마감되면 서버에서 그린 부분(상태 배지 등)도 새로 그린다.
  useEffect(() => {
    if (initial.status === "open" && results.status === "closed") router.refresh();
  }, [initial.status, results.status, router]);

  return <PollResultsView results={results} />;
}
