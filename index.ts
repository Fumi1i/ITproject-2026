import express from "express";
import path from "path";
import { pool } from "./db";
import todoRouter from "./src/apps/todo/todoRouter";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("index", { message: "Hello Vercel!" });
});

app.get("/api/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    res.json({ ok: true, now: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ ok: false, message: "DB接続エラー" });
  }
});

// --- TODOアプリ（追加部分） ---
app.get("/todo", (req, res) => {
  res.render("todo/index");
});
app.use("/api/todo/v1/todos", todoRouter);

// 不正なJSONは400で返す
app.use(
  (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && err.type === "entity.parse.failed") {
      return res
        .status(400)
        .json({ error: { code: "BAD_REQUEST", message: "JSONの形式が正しくありません" } });
    }
    next(err);
  }
);

if (!process.env.VERCEL) {
  app.listen(3000, () => console.log("http://localhost:3000"));
}

export default app;
