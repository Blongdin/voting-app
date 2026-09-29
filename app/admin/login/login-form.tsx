"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";
import { BottomCTA, buttonClass, FieldError, inputClass } from "@/app/components/ui";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <label htmlFor="password" className="mb-2 text-[15px] font-medium text-sub">
        비밀번호
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        placeholder="운영자 비밀번호"
        className={inputClass(true)}
      />
      {state.error && <FieldError>{state.error}</FieldError>}
      <BottomCTA>
        <button type="submit" disabled={pending} className={buttonClass("primary", "large")}>
          {pending ? "확인 중…" : "로그인"}
        </button>
      </BottomCTA>
    </form>
  );
}
