# TODOアプリ V1 実装手順書

REQ-01＝一覧、REQ-02＝登録、REQ-03＝部分更新、REQ-04＝削除。列名・URL は `02_design.md` に合わせる。
各工程は小さく区切り、完了ごとに確認する。ブランチは `feature/todo-app`。

| # | 工程 | 対象ファイル | 作業 | 確認コマンド・方法 | 期待結果 | 失敗時に最初に見る場所 |
|---|---|---|---|---|---|---|
| 0 | 準備 | - | `git checkout feature/todo-app`、`git merge main` | `git branch` | `* feature/todo-app` | ブランチ名 |
| 1 | SQL を Git に保存 | `sql/todo/020_create_todo_tasks.sql` | SQL ファイルを作成 | VSCode で内容確認 | 列が design の表と一致 | 列名・型 |
| 2 | SQL を Neon で実行（手動） | Neon SQL Editor | ファイル内容を貼り付けて Run | `SELECT * FROM todo_tasks;` | 4列・0件 | エラー文、接続先 DB |
| 3 | 一覧 API（REQ-01） | `todoModel.ts` `todoController.ts` `todoRouter.ts` `index.ts` | `findAll`、`list`、GET を実装、`index.ts` に `todoRouter` 登録 | `npm run dev` → `/api/todo/v1/todos` | 200 `{"data":[]}` | `Cannot find module`＝ファイル位置、`relation does not exist`＝工程2 |
| 4 | 登録 API（REQ-02） | 同上 | `create`（trim・1〜100文字）、POST | `curl -X POST -H "Content-Type: application/json" -d '{"title":"test"}' localhost:3000/api/todo/v1/todos` | 201、空文字は 422 | `express.json()` の有無 |
| 5 | 更新 API（REQ-03） | 同上 | `updateCompleted`、PATCH | `curl -X PATCH -H "Content-Type: application/json" -d '{"completed":true}' localhost:3000/api/todo/v1/todos/1` | 200、存在しない id は 404 | id の検査、Content-Type |
| 6 | 削除 API（REQ-04） | 同上 | `remove`、DELETE | `curl -X DELETE -i localhost:3000/api/todo/v1/todos/1` | 204 本文なし、再実行で 404 | 削除件数の判定 |
| 7 | TodoApi | `public/todo/todo.js` | `TodoApi` クラスを作成 | ブラウザの開発者ツール Network | 4操作が正しい URL・メソッドで呼ばれる | URL の綴り |
| 8 | 画面 | `views/todo/index.ejs` `index.ts` | `/todo` と画面を作成 | `localhost:3000/todo` | 0件で「TODOがありません」。追加・完了・削除ができる | `Cannot GET /todo`＝サーバ再起動、`index.ts` の追記 |
| 9 | ローカル確認 | `04_test_results.md` | REQ-01〜04 と異常系を確認 | 同ファイルの表 | すべて期待どおり | ターミナルのログ |
| 10 | Git に保存・Push | 全ファイル | `git add .` → `git commit` → `git push -u origin feature/todo-app` | `git status`（`.env` が出ない） | GitHub にブランチが載る | `.gitignore` |
| 11 | Preview 確認 | - | GitHub で `feature/todo-app` → `main` の Pull Request を作成 | PR の Vercel コメントの Preview URL の `/todo` | ローカルと同じ動作 | Vercel の Environment Variables（`DATABASE_URL`）、Deployments のログ |
| 12 | PR をマージ | - | PR を Merge | Vercel の Deployments | Production が `Ready` | ビルドログ |
| 13 | Production 確認 | `04_test_results.md` | 公開 URL の `/todo` を確認 | 同ファイル | ローカルと同じ動作 | 環境変数、再デプロイ |

## 文書間で揃える項目（実装前チェック）
- テーブル名 `todo_tasks`、列 `id / title / completed / created_at`
- URL `/api/todo/v1/todos`、画面 `/todo`
- 機能名 REQ-01 一覧、REQ-02 登録、REQ-03 完了状態の部分更新、REQ-04 削除
- 各 REQ の「完了と言える状態」は `01_requirements.md` の受け入れ条件

## 注意
- 工程1（Git 保存）と工程2（Neon 実行）は別作業。
- 確認で作ったデータは、Preview・Production で共有されるため、確認後に削除する。
- AI が生成した各変更について、目的を自分の言葉で説明できること。
