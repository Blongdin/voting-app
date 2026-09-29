"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createPollAction, type CreatePollState } from "@/app/admin/actions";
import {
  MAX_OPTIONS,
  MIN_OPTIONS,
  OPTION_MAX_LENGTH,
  QUESTION_MAX_LENGTH,
  type ClosesAtError,
  type OptionsError,
  type QuestionError,
} from "@/lib/poll-rules";

const questionMessages: Record<QuestionError, string> = {
  required: "질문을 입력하세요.",
  too_long: `질문은 ${QUESTION_MAX_LENGTH}자까지 쓸 수 있습니다.`,
};

const optionsMessages: Record<OptionsError, string> = {
  too_few: `선택지는 ${MIN_OPTIONS}개 이상이어야 합니다.`,
  too_many: `선택지는 ${MAX_OPTIONS}개까지 만들 수 있습니다.`,
  empty: "빈 선택지가 있습니다.",
  too_long: `선택지는 ${OPTION_MAX_LENGTH}자까지 쓸 수 있습니다.`,
  duplicate: "같은 선택지가 두 번 들어 있습니다.",
};

const closesAtMessages: Record<ClosesAtError, string> = {
  past: "마감 시각은 지금보다 뒤여야 합니다.",
  invalid: "마감 시각을 다시 입력하세요.",
};

/** datetime-local 값(현지 시각, 시간대 없음)을 UTC ISO 문자열로. 비었거나 틀리면 "". */
function localToIso(local: string): string {
  if (!local) return "";
  const date = new Date(local); // 시간대가 없는 날짜·시간은 브라우저 현지 시각으로 해석된다
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

const initialState: CreatePollState = {};

export function CreatePollForm() {
  const [state, formAction, pending] = useActionState(createPollAction, initialState);

  return (
    <div className="flex flex-col gap-4">
      {state.createdPollId && <CreatedPollNotice pollId={state.createdPollId} />}
      {/* 투표를 만들 때마다 key가 바뀌어 폼이 빈 상태(선택지 2개)로 돌아간다. */}
      <PollFields
        key={state.createdPollId ?? "new"}
        formAction={formAction}
        state={state}
        pending={pending}
      />
    </div>
  );
}

function PollFields({
  formAction,
  state,
  pending,
}: {
  formAction: (formData: FormData) => void;
  state: CreatePollState;
  pending: boolean;
}) {
  const initialCount = Math.max(state.values?.options.length ?? 0, MIN_OPTIONS);
  const [optionKeys, setOptionKeys] = useState(() => Array.from({ length: initialCount }, (_, i) => i));
  const [nextKey, setNextKey] = useState(initialCount);

  const addOption = () => {
    setOptionKeys((keys) => [...keys, nextKey]);
    setNextKey((key) => key + 1);
  };
  const removeOption = (key: number) => setOptionKeys((keys) => keys.filter((k) => k !== key));
  const [closesAtLocal, setClosesAtLocal] = useState(state.values?.closesAtLocal ?? "");

  const inputClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="question" className="text-sm font-medium">
          질문
        </label>
        <input
          id="question"
          name="question"
          required
          defaultValue={state.values?.question}
          className={inputClass}
        />
        {state.errors?.question && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {questionMessages[state.errors.question]}
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">
          선택지 ({MIN_OPTIONS}~{MAX_OPTIONS}개)
        </legend>
        {optionKeys.map((key, index) => (
          <div key={key} className="flex gap-2">
            <input
              name="option"
              required
              defaultValue={state.values?.options[index]}
              aria-label={`선택지 ${index + 1}`}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => removeOption(key)}
              disabled={optionKeys.length <= MIN_OPTIONS}
              aria-label={`선택지 ${index + 1} 빼기`}
              className="rounded-lg border border-zinc-300 px-3 text-sm disabled:opacity-30 dark:border-zinc-700"
            >
              빼기
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          disabled={optionKeys.length >= MAX_OPTIONS}
          className="self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-30 dark:border-zinc-700"
        >
          선택지 추가
        </button>
        {state.errors?.options && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {optionsMessages[state.errors.options]}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="closesAtLocal" className="text-sm font-medium">
          마감 시각 <span className="font-normal text-zinc-500">(선택, 비우면 직접 마감)</span>
        </label>
        <input
          id="closesAtLocal"
          name="closesAtLocal"
          type="datetime-local"
          value={closesAtLocal}
          onChange={(event) => setClosesAtLocal(event.target.value)}
          className={`${inputClass} sm:w-auto`}
        />
        <input type="hidden" name="closesAt" value={localToIso(closesAtLocal)} />
        {state.errors?.closesAt && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {closesAtMessages[state.errors.closesAt]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "만드는 중…" : "투표 만들기"}
      </button>
    </form>
  );
}

function CreatedPollNotice({ pollId }: { pollId: string }) {
  const path = `/polls/${pollId}`;
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
      setCopyState("copied");
    } catch {
      // http 등 클립보드를 쓸 수 없는 환경. 링크는 화면에 그대로 보인다.
      setCopyState("failed");
    }
  };

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
    >
      <span>투표를 만들었습니다.</span>
      <Link href={path} className="font-mono underline">
        {path}
      </Link>
      <button type="button" onClick={copy} className="underline">
        {copyState === "copied" ? "복사됨" : copyState === "failed" ? "복사할 수 없음" : "링크 복사"}
      </button>
    </div>
  );
}
