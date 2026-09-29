// db/schema.sql을 DATABASE_URL의 DB에 적용한다. 여러 번 실행해도 안전하다.
// 사용: npm run db:migrate  (기본은 .env.local의 dev 브랜치)
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Client } from "@neondatabase/serverless";

const schemaPath = fileURLToPath(new URL("../db/schema.sql", import.meta.url));

export async function migrate(connectionString) {
  const schema = await readFile(schemaPath, "utf8");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(schema);
  } finally {
    await client.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL이 없습니다. ./scripts/setup.sh를 먼저 실행하세요.");
    process.exit(1);
  }
  await migrate(url);
  console.log(`스키마 적용 완료: ${new URL(url).host}`);
}
