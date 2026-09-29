import { requireAdmin } from "@/lib/admin-session";
import { logout } from "./actions";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">운영자</h1>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            로그아웃
          </button>
        </form>
      </header>
      <p className="text-zinc-500">투표 만들기·마감·삭제는 다음 단계에서 추가됩니다.</p>
    </main>
  );
}
