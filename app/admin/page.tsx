import { PollList } from "@/app/components/poll-list";
import { requireAdmin } from "@/lib/admin-session";
import { listPolls } from "@/lib/polls";
import { logout } from "./actions";
import { CreatePollForm } from "./create-poll-form";

export default async function AdminPage() {
  await requireAdmin();
  const polls = await listPolls();

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

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold">새 투표</h2>
        <CreatePollForm />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">모든 투표</h2>
        <PollList polls={polls} />
      </section>
    </main>
  );
}
