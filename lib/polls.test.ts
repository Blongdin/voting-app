import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, seedPoll } from "@/test/db";
import { listPolls } from "@/lib/polls";

beforeEach(resetDb);

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
      options: ["김밥", "라면", "우동"],
      votes: [0, 0, 1],
    });
    await seedPoll({ question: "표가 없는 투표", createdAt: new Date("2026-01-01") });

    const polls = await listPolls();

    expect(polls.map((p) => [p.question, p.totalVotes])).toEqual([
      ["점심 메뉴", 3],
      ["표가 없는 투표", 0],
    ]);
  });
});
