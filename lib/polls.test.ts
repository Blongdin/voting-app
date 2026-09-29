import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, seedPoll } from "@/test/db";
import { createPoll, getPoll, listPolls, type Actor } from "@/lib/polls";

beforeEach(resetDb);

const admin: Actor = { isAdmin: true };

describe("투표 만들기", () => {
  it("운영자가 만든 투표는 질문과 선택지를 입력 순서대로 가진 진행 중 투표다", async () => {
    const result = await createPoll(admin, "점심 뭐 먹을까요?", ["김밥", "라면", "우동"]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const poll = await getPoll(result.pollId);
    expect(poll).toMatchObject({
      id: result.pollId,
      question: "점심 뭐 먹을까요?",
      status: "open",
    });
    expect(poll?.options.map((o) => o.label)).toEqual(["김밥", "라면", "우동"]);
  });

  it("운영자가 아니면 거절되고 투표가 생기지 않는다", async () => {
    const participant: Actor = { isAdmin: false, participantId: "11111111-1111-4111-8111-111111111111" };

    const result = await createPoll(participant, "점심 뭐 먹을까요?", ["김밥", "라면"]);

    expect(result).toEqual({ ok: false, reason: "forbidden" });
    expect(await listPolls()).toEqual([]);
  });

  const twoOptions = ["김밥", "라면"];
  it.each([
    { case: "빈 질문", question: "", options: twoOptions, errors: { question: "required" } },
    { case: "공백뿐인 질문", question: "   ", options: twoOptions, errors: { question: "required" } },
    { case: "200자 초과 질문", question: "가".repeat(201), options: twoOptions, errors: { question: "too_long" } },
    { case: "선택지 1개", question: "질문", options: ["김밥"], errors: { options: "too_few" } },
    {
      case: "선택지 11개",
      question: "질문",
      options: Array.from({ length: 11 }, (_, i) => `선택지 ${i + 1}`),
      errors: { options: "too_many" },
    },
    { case: "빈 선택지", question: "질문", options: ["김밥", "  "], errors: { options: "empty" } },
    { case: "100자 초과 선택지", question: "질문", options: ["김밥", "가".repeat(101)], errors: { options: "too_long" } },
    { case: "중복 선택지", question: "질문", options: ["김밥", "라면", "김밥"], errors: { options: "duplicate" } },
    { case: "공백만 다른 중복 선택지", question: "질문", options: ["김밥", " 김밥 "], errors: { options: "duplicate" } },
  ])("$case : 이유와 함께 거절되고 투표가 생기지 않는다",async ({ question, options, errors }) => {
    const result = await createPoll(admin, question, options);

    expect(result).toEqual({ ok: false, reason: "invalid", errors });
    expect(await listPolls()).toEqual([]);
  });

  it("질문 200자, 선택지 100자, 선택지 10개는 경계값이라 허용된다", async () => {
    const options = Array.from({ length: 10 }, (_, i) => `${i}`.padEnd(100, "가"));

    const result = await createPoll(admin, "가".repeat(200), options);

    expect(result.ok).toBe(true);
  });

  it("글자 수는 DB와 같이 문자 단위로 센다(이모지로 된 200자 질문, 100자 선택지 허용)", async () => {
    const result = await createPoll(admin, "🗳️".repeat(100), ["👍".repeat(100), "👎"]);

    expect(result.ok).toBe(true);
  });

  it("질문과 선택지가 모두 틀리면 두 이유를 함께 돌려준다", async () => {
    const result = await createPoll(admin, " ", ["김밥"]);

    expect(result).toEqual({
      ok: false,
      reason: "invalid",
      errors: { question: "required", options: "too_few" },
    });
  });

  it("질문과 선택지의 앞뒤 공백은 지워서 저장한다", async () => {
    const result = await createPoll(admin, "  점심 뭐 먹을까요?  ", [" 김밥", "라면 "]);

    if (!result.ok) throw new Error("테스트 준비: 투표 만들기 실패");
    const poll = await getPoll(result.pollId);
    expect(poll?.question).toBe("점심 뭐 먹을까요?");
    expect(poll?.options.map((o) => o.label)).toEqual(["김밥", "라면"]);
  });

  it("대소문자가 다른 선택지는 중복이 아니다", async () => {
    const result = await createPoll(admin, "언어", ["Go", "go"]);

    expect(result.ok).toBe(true);
  });
});

describe("투표 하나 조회", () => {
  it("없는 투표는 없음이다", async () => {
    expect(await getPoll("00000000-0000-4000-8000-000000000000")).toBeNull();
  });

  it("형식이 틀린 투표 ID도 없음이다", async () => {
    expect(await getPoll("not-a-poll-id")).toBeNull();
  });
});

describe("투표 목록 조회", () => {
  it("투표가 없으면 빈 목록이다", async () => {
    expect(await listPolls()).toEqual([]);
  });

  it("진행 중인 투표가 마감된 투표보다 먼저 오고, 각 그룹 안에서는 최신순이다", async () => {
    await seedPoll({ question: "오래된 진행 중", createdAt: new Date("2026-01-01") });
    await seedPoll({
      question: "최근 마감",
      createdAt: new Date("2026-03-01"),
      closedAt: new Date("2026-03-02"),
    });
    await seedPoll({ question: "최근 진행 중", createdAt: new Date("2026-02-01") });
    await seedPoll({
      question: "오래된 마감",
      createdAt: new Date("2025-12-01"),
      closedAt: new Date("2025-12-02"),
    });

    const polls = await listPolls();

    expect(polls.map((p) => [p.question, p.status])).toEqual([
      ["최근 진행 중", "open"],
      ["오래된 진행 중", "open"],
      ["최근 마감", "closed"],
      ["오래된 마감", "closed"],
    ]);
  });

  it("투표마다 총 표 수를 담는다", async () => {
    await seedPoll({
      question: "점심 메뉴",
      createdAt: new Date("2026-02-01"),
      optionLabels: ["김밥", "라면", "우동"],
      voteOptionIndexes: [0, 0, 1],
    });
    await seedPoll({ question: "표가 없는 투표", createdAt: new Date("2026-01-01") });

    const polls = await listPolls();

    expect(polls.map((p) => [p.question, p.totalVotes])).toEqual([
      ["점심 메뉴", 3],
      ["표가 없는 투표", 0],
    ]);
  });
});
