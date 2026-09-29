"use client";

import { useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import { closePollAction } from "@/app/admin/actions";

const noSubscribe = () => () => {};

export function ClosePollButton({ pollId }: { pollId: string }) {
  // 하이드레이션 전에는 확인 창(onSubmit)이 없으므로 버튼을 막아 둔다. 마감은 되돌릴 수 없다.
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);

  return (
    <form
      action={closePollAction.bind(null, pollId)}
      onSubmit={(event) => {
        if (!window.confirm("마감은 되돌릴 수 없습니다. 이 투표를 마감할까요?")) event.preventDefault();
      }}
    >
      <SubmitButton disabled={!hydrated} />
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
    >
      {pending ? "마감하는 중…" : "마감하기"}
    </button>
  );
}
