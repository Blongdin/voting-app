import { connection } from "next/server";
import { PollList } from "@/app/components/poll-list";
import { listPolls } from "@/lib/polls";

export default async function Home() {
  // 목록은 요청마다 DB에서 읽는다(빌드 시점에 굳히지 않는다).
  await connection();
  const polls = await listPolls();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">투표</h1>
      <PollList polls={polls} />
    </main>
  );
}
