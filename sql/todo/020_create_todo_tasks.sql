-- TODOアプリ V1: todo_tasks テーブル
-- Neon の SQL Editor で手動実行する（Git保存と実行は別工程）
CREATE TABLE IF NOT EXISTS todo_tasks (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title      VARCHAR(100) NOT NULL
             CHECK (char_length(btrim(title)) BETWEEN 1 AND 100),
  completed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 確認用
-- SELECT * FROM todo_tasks ORDER BY id;
