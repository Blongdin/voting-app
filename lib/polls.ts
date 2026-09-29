import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db";
import {
  MAX_OPTIONS,
  MIN_OPTIONS,
  OPTION_MAX_LENGTH,
  QUESTION_MAX_LENGTH,
  type OptionsError,
  type PollInputErrors,
  type QuestionError,
} from "@/lib/poll-rules";

export type PollStatus = "open" | "closed";

/** 요청한 사람. 연결 코드가 쿠키에서 만들어 넘긴다(이 모듈은 쿠키를 모른다). */
export type Actor = { isAdmin: boolean; participantId?: string };

export type PollOption = { id: string; label: string };

export type Poll = {
  id: string;
  question: string;
  status: PollStatus;
  options: PollOption[];
};

export type CreatePollResult =
  | { ok: true; pollId: string }
  | { ok: false; reason: "forbidden" }
  | { ok: false; reason: "invalid"; errors: PollInputErrors };

function questionError(question: string): QuestionError | undefined {
  if (question.length === 0) return "required";
  if (question.length > QUESTION_MAX_LENGTH) return "too_long";
}

function optionsError(labels: string[]): OptionsError | undefined {
  if (labels.length < MIN_OPTIONS) return "too_few";
  if (labels.length > MAX_OPTIONS) return "too_many";
  if (labels.some((label) => label.length === 0)) return "empty";
  if (labels.some((label) => label.length > OPTION_MAX_LENGTH)) return "too_long";
  // 공백을 지운 뒤 대소문자를 구분해 비교한다.
  if (new Set(labels).size !== labels.length) return "duplicate";
}

export async function createPoll(
  actor: Actor,
  rawQuestion: string,
  rawOptionLabels: string[],
): Promise<CreatePollResult> {
  if (!actor.isAdmin) return { ok: false, reason: "forbidden" };

  const question = rawQuestion.trim();
  const optionLabels = rawOptionLabels.map((label) => label.trim());
  const errors: PollInputErrors = {};
  const qError = questionError(question);
  const oError = optionsError(optionLabels);
  if (qError) errors.question = qError;
  if (oError) errors.options = oError;
  if (qError || oError) return { ok: false, reason: "invalid", errors };

  const q = sql();
  const pollId = randomUUID();
  // 투표와 선택지를 한 트랜잭션으로 만든다.
  await q.transaction([
    q`INSERT INTO polls (id, question) VALUES (${pollId}, ${question})`,
    q`INSERT INTO options (poll_id, label, position)
      SELECT ${pollId}, label, ordinality - 1
      FROM unnest(${optionLabels}::text[]) WITH ORDINALITY AS t(label, ordinality)`,
  ]);
  return { ok: true, pollId };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getPoll(pollId: string): Promise<Poll | null> {
  // URL에서 온 값이므로 UUID가 아니면 DB에 묻지 않고 없음으로 본다.
  if (!UUID.test(pollId)) return null;
  const q = sql();
  const [poll] = await q`
    SELECT id, question, closed_at IS NOT NULL AS closed FROM polls WHERE id = ${pollId}`;
  if (!poll) return null;
  const options = await q`
    SELECT id, label FROM options WHERE poll_id = ${pollId} ORDER BY position`;
  return {
    id: poll.id,
    question: poll.question,
    status: poll.closed ? "closed" : "open",
    options: options.map((o) => ({ id: o.id, label: o.label })),
  };
}

export type PollSummary = {
  id: string;
  question: string;
  status: PollStatus;
  totalVotes: number;
};

export async function listPolls(): Promise<PollSummary[]> {
  const rows = await sql()`
    SELECT p.id, p.question, p.closed_at IS NOT NULL AS closed, count(v.id)::int AS total_votes
    FROM polls p
    LEFT JOIN votes v ON v.poll_id = p.id
    GROUP BY p.id
    ORDER BY closed, p.created_at DESC, p.id`;
  return rows.map((row) => ({
    id: row.id,
    question: row.question,
    status: row.closed ? "closed" : "open",
    totalVotes: row.total_votes,
  }));
}
