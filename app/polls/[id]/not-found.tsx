import Link from "next/link";

export default function PollNotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-4 text-2xl font-bold">찾을 수 없는 투표</h1>
      <p className="mb-6 text-zinc-500">삭제되었거나 존재하지 않는 투표입니다.</p>
      <Link href="/" className="underline">
        투표 목록으로
      </Link>
    </main>
  );
}
