"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PollResults } from "@/lib/polls";
import { PollResultsView } from "./poll-results";

const POLL_INTERVAL_MS = 5000;

/**
 * 진행 중인 투표의 결과를 5초마다 결과 API에서 다시 가져온다.
 * 탭이 숨겨지면 멈추고, 다시 보이면 곧바로 한 번 가져온 뒤 이어서 한다.
 * 투표가 마감되면 멈추고 화면 전체를 새로 그려 상태 배지를 "마감"으로 바꾼다.
 */
export function LivePollResults({ pollId, initial }: { pollId: string; initial: PollResults }) {
  const [results, setResults] = useState(initial);
  const router = useRouter();
  const open = results.status === "open";

  useEffect(() => {
    if (!open) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await fetch(`/api/polls/${pollId}/results`, { cache: "no-store" });
        if (!cancelled && response.ok) setResults(await response.json());
      } catch {
        // 네트워크 오류는 다음 주기에 다시 시도한다.
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      if (document.visibilityState !== "visible") return;
      timer = setTimeout(async () => {
        await refresh();
        if (!cancelled) schedule();
      }, POLL_INTERVAL_MS);
    };
    const onVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        await refresh();
        if (!cancelled) schedule();
      } else {
        clearTimeout(timer);
      }
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pollId, open]);

  // 폴링 중에 마감되면 서버에서 그린 부분(상태 배지 등)도 새로 그린다.
  useEffect(() => {
    if (initial.status === "open" && results.status === "closed") router.refresh();
  }, [initial.status, results.status, router]);

  return <PollResultsView results={results} />;
}
