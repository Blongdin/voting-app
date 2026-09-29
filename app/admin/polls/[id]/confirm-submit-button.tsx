"use client";

import { useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass } from "@/app/components/ui";

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
  variant,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label: string;
  pendingLabel: string;
  variant: "primary" | "danger";
}) {
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);

  return (
    <form
      action={action}
      className="flex-1"
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <SubmitButton disabled={!hydrated} label={label} pendingLabel={pendingLabel} variant={variant} />
    </form>
  );
}

function SubmitButton({
  disabled,
  label,
  pendingLabel,
  variant,
}: {
  disabled: boolean;
  label: string;
  pendingLabel: string;
  variant: "primary" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className={buttonClass(variant, "large")}>
      {pending ? pendingLabel : label}
    </button>
  );
}
