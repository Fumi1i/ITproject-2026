import express from "express";
import path from "path";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { message: "Hello Vercel!" });
});

if (!process.env.VERCEL) {
  app.listen(3000, () => console.log("http://localhost:3000"));
}

export default app;