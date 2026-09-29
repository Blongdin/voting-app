"use client";

import Link from "next/link";
import { useActionState, useState, useSyncExternalStore } from "react";
import { createPollAction, type CreatePollState } from "@/app/admin/actions";
import { buttonClass, FieldError, inputClass } from "@/app/components/ui";
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

const noSubscribe = () => () => {};

const initialState: CreatePollState = {};

const labelClass = "mb-2 block text-[15px] font-medium text-sub";

export function CreatePollForm() {
  const [state, formAction, pending] = useActionState(createPollAction, initialState);

  return (
    <div className="flex flex-col gap-5">
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
  // 현지 시각 → UTC 변환은 브라우저 시간대가 필요하다. 서버에서 그릴 때(하이드레이션 전)는 비워 두고,
  // 그 상태로 제출되면 서버가 "다시 입력하세요"로 거절한다.
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div>
        <label htmlFor="question" className={labelClass}>
          질문
        </label>
        <input
          id="question"
          name="question"
          required
          placeholder="예: 점심 뭐 먹을까요?"
          defaultValue={state.values?.question}
          className={inputClass()}
        />
        {state.errors?.question && <FieldError>{questionMessages[state.errors.question]}</FieldError>}
      </div>

      <fieldset>
        <legend className={labelClass}>
          선택지 <span className="text-muted">({MIN_OPTIONS}~{MAX_OPTIONS}개)</span>
        </legend>
        <div className="flex flex-col gap-2">
          {optionKeys.map((key, index) => (
            <div key={key} className="flex items-center gap-2">
              <input
                name="option"
                required
                placeholder={`선택지 ${index + 1}`}
                defaultValue={state.values?.options[index]}
                aria-label={`선택지 ${index + 1}`}
                className={inputClass()}
              />
              <button
                type="button"
                onClick={() => removeOption(key)}
                disabled={optionKeys.length <= MIN_OPTIONS}
                aria-label={`선택지 ${index + 1} 빼기`}
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-fill text-lg text-muted active:brightness-95 disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          disabled={optionKeys.length >= MAX_OPTIONS}
          className={`${buttonClass("secondary", "medium")} mt-3 w-full`}
        >
          + 선택지 추가
        </button>
        {state.errors?.options && <FieldError>{optionsMessages[state.errors.options]}</FieldError>}
      </fieldset>

      <div>
        <label htmlFor="closesAtLocal" className={labelClass}>
          마감 시각 <span className="text-muted">(선택, 비우면 직접 마감)</span>
        </label>
        <input
          id="closesAtLocal"
          name="closesAtLocal"
          type="datetime-local"
          value={closesAtLocal}
          onChange={(event) => setClosesAtLocal(event.target.value)}
          className={inputClass()}
        />
        <p className="mt-2 text-[13px] text-muted">이 기기의 시간대로 입력합니다. 화면에는 한국 시간으로 표시됩니다.</p>
        <input type="hidden" name="closesAt" value={hydrated ? localToIso(closesAtLocal) : ""} />
        {state.errors?.closesAt && <FieldError>{closesAtMessages[state.errors.closesAt]}</FieldError>}
      </div>

      <button type="submit" disabled={pending} className={buttonClass("primary", "large")}>
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
    <div role="status" className="rounded-2xl bg-primary-soft p-4">
      <p className="text-[16px] font-bold text-primary">투표를 만들었어요</p>
      <Link href={path} className="mt-1 block truncate text-[14px] text-sub underline underline-offset-2">
        {path}
      </Link>
      <button type="button" onClick={copy} className={`${buttonClass("primary", "small")} mt-3`}>
        {copyState === "copied" ? "복사됨" : copyState === "failed" ? "복사할 수 없음" : "링크 복사"}
      </button>
    </div>
  );
}
