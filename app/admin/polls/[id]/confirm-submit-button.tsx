"use client";

import { useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";

const noSubscribe = () => () => {};

/**
 * 브라우저 확인 창을 거친 뒤에만 Server Action을 실행하는 버튼(마감, 삭제처럼 되돌릴 수 없는 일).
 * 하이드레이션 전에는 확인 창(onSubmit)이 없으므로 버튼을 막아 둔다.
 */
export function ConfirmSubmitButton({
  action,
  confirmMessage,
  label,
  pendingLabel,
  danger = false,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label: string;
  pendingLabel: string;
  danger?: boolean;
}) {
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <SubmitButton disabled={!hydrated} label={label} pendingLabel={pendingLabel} danger={danger} />
    </form>
  );
}

function SubmitButton({
  disabled,
  label,
  pendingLabel,
  danger,
}: {
  disabled: boolean;
  label: string;
  pendingLabel: string;
  danger: boolean;
}) {
  const { pending } = useFormStatus();
  const color = danger
    ? "border-red-300 text-red-700 dark:border-red-800 dark:text-red-300"
    : "border-zinc-300 dark:border-zinc-700";
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 ${color}`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
