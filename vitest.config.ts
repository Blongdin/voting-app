import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { defineConfig } from "vitest/config";

// 테스트는 테이블을 비우므로 .env.test.local(test 브랜치)만 읽는다.
// 파일이 없거나 dev DB와 같으면 dev 데이터를 지우지 않도록 멈춘다.
function testDatabaseUrl(): string {
  if (!existsSync(".env.test.local")) {
    throw new Error(".env.test.local이 없습니다. ./scripts/setup.sh를 실행하세요.");
  }
  const url = parseEnv(readFileSync(".env.test.local", "utf8")).DATABASE_URL;
  if (!url) throw new Error(".env.test.local에 DATABASE_URL이 없습니다.");
  if (existsSync(".env.local")) {
    const devUrl = parseEnv(readFileSync(".env.local", "utf8")).DATABASE_URL;
    if (devUrl === url) {
      throw new Error("테스트 DB가 dev DB와 같습니다. .env.test.local을 test 브랜치로 바꾸세요.");
    }
  }
  return url;
}

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    env: { DATABASE_URL: testDatabaseUrl() },
    globalSetup: ["./test/global-setup.ts"],
    // 모든 테스트 파일이 같은 테스트 DB를 쓰므로 순서대로 실행한다.
    fileParallelism: false,
  },
});
