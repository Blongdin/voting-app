# ORM 없이 Neon 드라이버로 SQL을 직접 쓴다

테이블이 투표, 선택지, 표 세 개뿐이라 `@neondatabase/serverless`로 SQL을 직접 쓰고, 스키마는 여러 번 실행해도 안전한 `schema.sql` 하나를 `npm run db:migrate`로 적용한다. Drizzle 같은 ORM과 마이그레이션 도구는 이 규모에서 얻는 것보다 의존성과 설정 부담이 더 크다. 테이블이 늘거나 스키마 변경이 잦아지면 다시 검토한다.
