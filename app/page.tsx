import Link from "next/link";
import { connection } from "next/server";
import { PollList } from "@/app/components/poll-list";
import { buttonClass, Page, Title, TopBar } from "@/app/components/ui";
import { listPolls } from "@/lib/polls";

export default async function Home() {
  // 목록은 요청마다 DB에서 읽는다(빌드 시점에 굳히지 않는다).
  await connection();
  const polls = await listPolls();
  const openCount = polls.filter((p) => p.status === "open").length;

  return (
    <>
      <Page>
        <TopBar
          right={
            // 로그인하지 않았으면 /admin이 로그인 화면으로 보낸다.
            <Link href="/admin" className={buttonClass("neutral", "small")}>
              운영자
            </Link>
          }
        />
        <Title sub={openCount > 0 ? `지금 참여할 수 있는 투표 ${openCount}개` : undefined}>투표</Title>
        <PollList polls={polls} />
      </Page>
      {/* 만든 사람. body가 세로 flex라 본문 아래, 화면 맨 아래 왼쪽에 놓인다. */}
      <footer className="px-5 py-5 text-left text-[13px] text-muted">김동현</footer>
    </>
  );
}
