import express from "express";
import path from "path";
import { pool } from "./db";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

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

if (!process.env.VERCEL) {
  app.listen(3000, () => console.log("http://localhost:3000"));
}

export default app;