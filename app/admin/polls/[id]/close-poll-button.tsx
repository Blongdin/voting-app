"use client";

import { useFormStatus } from "react-dom";
import { closePollAction } from "@/app/admin/actions";

export function ClosePollButton({ pollId }: { pollId: string }) {
  return (
    <form
      action={closePollAction.bind(null, pollId)}
      onSubmit={(event) => {
        if (!window.confirm("마감은 되돌릴 수 없습니다. 이 투표를 마감할까요?")) event.preventDefault();
      }}
    >
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
    >
      {pending ? "마감하는 중…" : "마감하기"}
    </button>
  );
}
