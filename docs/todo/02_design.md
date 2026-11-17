# TODOアプリ V1 設計書

REQ-01〜REQ-04 は `01_requirements.md` を変更せずに参照する。

## 1. 作るものとファイルの役割

| ファイル | 役割 |
|---|---|
| `index.ts` | 既存。`express.json()`、`/todo` 画面、`todoRouter` の登録を最小限で追記 |
| `db.ts` | 既存。`pool` を提供（変更なし） |
| `src/apps/todo/todoRouter.ts` | URL とメソッドを Controller に振り分ける |
| `src/apps/todo/todoController.ts` | 入力検査、ステータスとJSONの決定、エラー処理 |
| `src/apps/todo/todoModel.ts` | SQL の実行（DB 操作のみ） |
| `views/todo/index.ejs` | TODO 画面（HTML） |
| `public/todo/todo.js` | ブラウザ用。`TodoApi` クラスと画面操作 |
| `sql/todo/020_create_todo_tasks.sql` | テーブル作成 SQL |

## 2. リクエストはどこを通るか

```
ブラウザ(todo.js) --Fetch--> index.ts --/api/todo/v1/todos--> todoRouter
   -> todoController(入力検査) -> todoModel(SQL) -> db.ts(pool) -> Neon
```

- 画面：`GET /todo` → `views/todo/index.ejs` を表示
- API：`app.use("/api/todo/v1/todos", todoRouter)`
- `index.ts` の追記は、`express.json()`、`/todo`、`todoRouter` 登録、不正JSON用の1ハンドラのみ

## 3. DB の設計

テーブル `todo_tasks`

| 列 | 型 | 制約 |
|---|---|---|
| id | BIGINT | 主キー、自動採番（IDENTITY） |
| title | VARCHAR(100) | NOT NULL、前後の空白を除いて 1〜100文字（CHECK） |
| completed | BOOLEAN | NOT NULL、初期値 FALSE |
| created_at | TIMESTAMPTZ | NOT NULL、初期値 now() |

`id` は Model で `id::int` に変換して返す（JSON で数値として扱うため）。

## 4. API の共通ルール

- ベースURL：`/api/todo/v1/todos`
- 成功：`{ "data": ... }`。DELETE 成功は 204 で本文なし。
- 失敗：`{ "error": { "code": "...", "message": "..." } }`
- id は `/^[1-9][0-9]*$/` に合う整数のみ有効。
- 【要確認】第6章の共通仕様と JSON の形・コード名が異なる場合は、共通仕様に合わせて Controller を直す。

## 5. 各機能の設計

### 5.1 REQ-01 TODO 一覧を取得する
| 項目 | 内容 |
|---|---|
| メソッド・URL | GET `/api/todo/v1/todos` |
| リクエスト本文 | なし |
| 成功 | 200 `{ "data": [ {id,title,completed,created_at}, ... ] }`（0件は `[]`） |
| 失敗 | 500 `INTERNAL_ERROR`、503 `SERVICE_UNAVAILABLE` |
| DB 処理 | `SELECT ... FROM todo_tasks ORDER BY id ASC` |
| TodoApi | `list()` |
| 確認方法 | `/todo` を開く。API を直接開く |

### 5.2 REQ-02 TODO を登録する
| 項目 | 内容 |
|---|---|
| メソッド・URL | POST `/api/todo/v1/todos` |
| リクエスト本文 | `{ "title": "文字列" }` |
| 成功 | 201 `{ "data": { 作成した TODO } }` |
| 失敗 | 400 `BAD_REQUEST`（title なし・不正JSON）、422 `VALIDATION_ERROR`（型違い・0文字・101文字以上）、500、503 |
| DB 処理 | `INSERT INTO todo_tasks (title) VALUES ($1) RETURNING ...`（trim 後の値） |
| TodoApi | `create(title)` |
| 確認方法 | 画面から追加。空欄・空白のみ・101文字で拒否される |

### 5.3 REQ-03 完了状態を変える
| 項目 | 内容 |
|---|---|
| メソッド・URL | PATCH `/api/todo/v1/todos/:id` |
| リクエスト本文 | `{ "completed": true または false }` |
| 成功 | 200 `{ "data": { 更新後の TODO } }` |
| 失敗 | 400（id 不正・completed なし）、422（completed が真偽値でない）、404 `NOT_FOUND`、500、503 |
| DB 処理 | `UPDATE todo_tasks SET completed = $1 WHERE id = $2 RETURNING ...` |
| TodoApi | `updateCompleted(id, completed)` |
| 確認方法 | チェックして再読み込み。id=999999 で 404 |

### 5.4 REQ-04 TODO を削除する
| 項目 | 内容 |
|---|---|
| メソッド・URL | DELETE `/api/todo/v1/todos/:id` |
| リクエスト本文 | なし |
| 成功 | 204 本文なし |
| 失敗 | 400（id 不正）、404、500、503 |
| DB 処理 | `DELETE FROM todo_tasks WHERE id = $1`（削除件数 0 なら 404） |
| TodoApi | `remove(id)` |
| 確認方法 | 削除して再読み込み。存在しない id で 404 |

## 6. 画面と TodoApi の設計

- `TodoApi`（`public/todo/todo.js`）：`list / create / updateCompleted / remove` を持ち、Fetch を1か所にまとめる。204 は `null`、失敗時は `error.message` で `Error` を投げる。
- 画面：入力欄＋追加ボタン、一覧（チェックボックス・タイトル・削除ボタン）、0件時は「TODOがありません」、エラーは `#message` に表示。
- タイトルは `textContent` で表示し、HTML として解釈させない。
- 操作のあとは必ず一覧を再取得して表示を DB と一致させる。

## 7. エラーはどこで処理するか

| 種類 | 場所 |
|---|---|
| 不正JSON（400） | `index.ts` のエラーハンドラ |
| id・本文の検査（400/422） | Controller |
| 対象なし（404） | Model の結果を見て Controller |
| DB 接続不可（503）・その他（500） | Controller の `handleDbError` |

## 8. 実装への注意事項

- 既存の `/` と `/api/db-check` は変更しない。
- Model には入力検査を書かず、Controller に書く。
- SQL は必ずプレースホルダ（`$1`）を使い、文字列連結しない。
- `.env` と接続文字列は Git に入れない。
- 【要確認】ファイル配置は授業テキストの構成どおり。実際のプロジェクトと違う場合は講師に確認する。
