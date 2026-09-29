import Link from "next/link";
import { connection } from "next/server";
import { PollList } from "@/app/components/poll-list";
import { listPolls } from "@/lib/polls";

export default async function Home() {
  // 목록은 요청마다 DB에서 읽는다(빌드 시점에 굳히지 않는다).
  await connection();
  const polls = await listPolls();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">투표</h1>
        {/* 로그인하지 않았으면 /admin이 로그인 화면으로 보낸다. */}
        <Link
          href="/admin"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          운영자
        </Link>
      </header>
      <PollList polls={polls} />
    </main>
  );
}
