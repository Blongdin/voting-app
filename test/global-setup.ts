import type { TestProject } from "vitest/node";
import { migrate } from "../scripts/migrate.mjs";

// 테스트 전에 test 브랜치에 최신 스키마를 적용한다.
export default async function setup(project: TestProject) {
  await migrate(project.config.env.DATABASE_URL);
}
