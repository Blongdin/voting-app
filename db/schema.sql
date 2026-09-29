-- 투표 앱 스키마. 여러 번 실행해도 안전하다(IF NOT EXISTS).
-- 규칙은 가능한 한 DB 제약으로 보장한다(ADR-0004).

CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL CHECK (char_length(question) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz -- NULL이면 진행 중
);

CREATE TABLE IF NOT EXISTS options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 100),
  position integer NOT NULL CHECK (position >= 0),
  UNIQUE (poll_id, label),
  UNIQUE (poll_id, position),
  UNIQUE (id, poll_id) -- votes의 복합 외래키 대상
);

CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  option_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- 참여자당 투표마다 한 표
  UNIQUE (poll_id, participant_id),
  -- 선택지는 같은 투표에 속해야 한다
  FOREIGN KEY (option_id, poll_id) REFERENCES options (id, poll_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS votes_option_id_idx ON votes (option_id);
