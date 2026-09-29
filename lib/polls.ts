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

// DB의 char_length처럼 코드 포인트 단위로 센다(JS의 .length는 이모지를 2로 센다).
const charLength = (text: string) => [...text].length;

function questionError(question: string): QuestionError | undefined {
  if (charLength(question) === 0) return "required";
  if (charLength(question) > QUESTION_MAX_LENGTH) return "too_long";
}

function optionsError(labels: string[]): OptionsError | undefined {
  if (labels.length < MIN_OPTIONS) return "too_few";
  if (labels.length > MAX_OPTIONS) return "too_many";
  if (labels.some((label) => charLength(label) === 0)) return "empty";
  if (labels.some((label) => charLength(label) > OPTION_MAX_LENGTH)) return "too_long";
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
  const questionProblem = questionError(question);
  const optionsProblem = optionsError(optionLabels);
  if (questionProblem || optionsProblem) {
    const errors: PollInputErrors = {};
    if (questionProblem) errors.question = questionProblem;
    if (optionsProblem) errors.options = optionsProblem;
    return { ok: false, reason: "invalid", errors };
  }

  const db = sql();
  const pollId = randomUUID();
  // 투표와 선택지를 한 트랜잭션으로 만든다.
  await db.transaction([
    db`INSERT INTO polls (id, question) VALUES (${pollId}, ${question})`,
    db`INSERT INTO options (poll_id, label, position)
      SELECT ${pollId}, label, ordinality - 1
      FROM unnest(${optionLabels}::text[]) WITH ORDINALITY AS t(label, ordinality)`,
  ]);
  return { ok: true, pollId };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// URL과 폼에서 온 ID이므로 UUID가 아니면 DB에 묻지 않는다.
export const isUuid = (value: string) => UUID.test(value);

const isForeignKeyViolation = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === "23503";

export async function getPoll(pollId: string): Promise<Poll | null> {
  if (!isUuid(pollId)) return null;
  const db = sql();
  const [poll] = await db`
    SELECT id, question, closed_at IS NOT NULL AS closed FROM polls WHERE id = ${pollId}`;
  if (!poll) return null;
  const options = await db`
    SELECT id, label FROM options WHERE poll_id = ${pollId} ORDER BY position`;
  return {
    id: poll.id,
    question: poll.question,
    status: poll.closed ? "closed" : "open",
    options: options.map((o) => ({ id: o.id, label: o.label })),
  };
}

/** 운영자가 투표 하나를 바꾸는 일(마감, 삭제)의 결과. */
export type AdminPollChangeResult = { ok: true } | { ok: false; reason: "forbidden" | "not_found" };

/** 투표를 마감한다. 되돌릴 수 없고, 이미 마감된 투표는 그대로 둔다(처음 마감한 시각 유지). */
export async function closePoll(actor: Actor, pollId: string): Promise<AdminPollChangeResult> {
  if (!actor.isAdmin) return { ok: false, reason: "forbidden" };
  if (!isUuid(pollId)) return { ok: false, reason: "not_found" };
  const [poll] = await sql()`
    UPDATE polls SET closed_at = COALESCE(closed_at, now())
    WHERE id = ${pollId}
    RETURNING id`;
  return poll ? { ok: true } : { ok: false, reason: "not_found" };
}

/** 투표를 완전히 삭제한다. 선택지와 표는 DB의 연쇄 삭제(ON DELETE CASCADE)로 함께 지워진다. */
export async function deletePoll(actor: Actor, pollId: string): Promise<AdminPollChangeResult> {
  if (!actor.isAdmin) return { ok: false, reason: "forbidden" };
  if (!isUuid(pollId)) return { ok: false, reason: "not_found" };
  const [poll] = await sql()`DELETE FROM polls WHERE id = ${pollId} RETURNING id`;
  return poll ? { ok: true } : { ok: false, reason: "not_found" };
}

export type CastVoteResult = "ok" | "already_voted" | "closed" | "invalid_option" | "not_found";

export async function castVote(
  pollId: string,
  optionId: string,
  participantId: string,
): Promise<CastVoteResult> {
  if (!isUuid(pollId)) return "not_found";
  if (!isUuid(optionId)) return "invalid_option";
  if (!isUuid(participantId)) throw new Error("참여자 ID는 UUID여야 합니다.");

  const db = sql();
  // 마감 여부는 표를 넣는 같은 문장에서 확인한다(ADR-0004).
  // 한 사람당 한 표는 UNIQUE(poll_id, participant_id)가,
  // 선택지가 이 투표에 속하는지는 votes의 복합 외래키가 보장한다.
  let inserted;
  try {
    inserted = await db`
      INSERT INTO votes (poll_id, option_id, participant_id)
      SELECT id, ${optionId}, ${participantId} FROM polls
      WHERE id = ${pollId} AND closed_at IS NULL
      FOR SHARE -- 마감(UPDATE)이 이 문장이 끝날 때까지 기다리게 한다
      ON CONFLICT (poll_id, participant_id) DO NOTHING
      RETURNING id`;
  } catch (error) {
    if (!isForeignKeyViolation(error)) throw error;
    // 선택지가 이 투표에 속하지 않거나, 그 사이 투표가 삭제되었다.
    const [stillExists] = await db`SELECT 1 FROM polls WHERE id = ${pollId}`;
    return stillExists ? "invalid_option" : "not_found";
  }
  if (inserted.length > 0) return "ok";

  // 들어가지 않았다면 이유만 알아낸다. 규칙 자체는 위 문장이 이미 지켰다.
  const [poll] = await db`SELECT closed_at IS NOT NULL AS closed FROM polls WHERE id = ${pollId}`;
  if (!poll) return "not_found";
  if (poll.closed) return "closed";
  return "already_voted";
}

export type OptionResult = { id: string; label: string; votes: number; percent: number };

export type PollResults = {
  status: PollStatus;
  totalVotes: number;
  options: OptionResult[];
  /** 보는 참여자가 고른 선택지. 표를 내지 않았으면 null. */
  myOptionId: string | null;
};

export type GetResultsResult =
  | { ok: true; results: PollResults }
  | { ok: false; reason: "not_found" | "forbidden" };

export async function getResults(pollId: string, viewer: Actor): Promise<GetResultsResult> {
  if (!isUuid(pollId)) return { ok: false, reason: "not_found" };
  const db = sql();
  const [poll] = await db`SELECT closed_at IS NOT NULL AS closed FROM polls WHERE id = ${pollId}`;
  if (!poll) return { ok: false, reason: "not_found" };

  // 쿠키에서 온 참여자 ID이므로 UUID가 아니면 표를 내지 않은 사람으로 본다.
  const participantId = viewer.participantId;
  const [mine] =
    participantId && isUuid(participantId)
      ? await db`
          SELECT option_id FROM votes WHERE poll_id = ${pollId} AND participant_id = ${participantId}`
      : [];
  // 결과는 표를 낸 참여자, 마감된 투표를 보는 누구나, 운영자만 본다.
  if (!mine && !poll.closed && !viewer.isAdmin) return { ok: false, reason: "forbidden" };

  const options = await db`
    SELECT o.id, o.label, count(v.id)::int AS votes
    FROM options o
    LEFT JOIN votes v ON v.option_id = o.id
    WHERE o.poll_id = ${pollId}
    GROUP BY o.id
    ORDER BY o.position`;
  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);
  return {
    ok: true,
    results: {
      status: poll.closed ? "closed" : "open",
      totalVotes,
      options: options.map((o) => ({
        id: o.id,
        label: o.label,
        votes: o.votes,
        // 반올림하므로 합이 100이 아닐 수 있다(스펙에서 허용).
        percent: totalVotes === 0 ? 0 : Math.round((o.votes * 100) / totalVotes),
      })),
      myOptionId: mine?.option_id ?? null,
    },
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
