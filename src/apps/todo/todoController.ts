import { Request, Response } from "express";
import * as model from "./todoModel";

function sendError(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}

// DB接続不可は503、それ以外は500
function handleDbError(res: Response, err: unknown) {
  const code = (err as { code?: string })?.code ?? "";
  const unavailable = ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET"];
  if (unavailable.includes(code) || code.startsWith("08")) {
    return sendError(res, 503, "SERVICE_UNAVAILABLE", "データベースに接続できません");
  }
  console.error(err);
  return sendError(res, 500, "INTERNAL_ERROR", "サーバーでエラーが発生しました");
}

function parseId(value: string): number | null {
  if (!/^[1-9][0-9]*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function isObject(body: unknown): body is Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

// REQ-01 一覧
export async function list(_req: Request, res: Response) {
  try {
    const data = await model.findAll();
    return res.status(200).json({ data });
  } catch (err) {
    return handleDbError(res, err);
  }
}

// REQ-02 登録
export async function create(req: Request, res: Response) {
  if (!isObject(req.body) || !("title" in req.body)) {
    return sendError(res, 400, "BAD_REQUEST", "title を含むJSONを送ってください");
  }
  const raw = req.body.title;
  if (typeof raw !== "string") {
    return sendError(res, 422, "VALIDATION_ERROR", "title は文字列で指定してください");
  }
  const title = raw.trim();
  if (title.length < 1 || title.length > 100) {
    return sendError(res, 422, "VALIDATION_ERROR", "title は1〜100文字で入力してください");
  }
  try {
    const data = await model.create(title);
    return res.status(201).json({ data });
  } catch (err) {
    return handleDbError(res, err);
  }
}

// REQ-03 完了状態の部分更新
export async function updateCompleted(req: Request, res: Response) {
  const id = parseId(String(req.params.id));
  if (id === null) {
    return sendError(res, 400, "BAD_REQUEST", "id は1以上の整数で指定してください");
  }
  if (!isObject(req.body) || !("completed" in req.body)) {
    return sendError(res, 400, "BAD_REQUEST", "completed を含むJSONを送ってください");
  }
  if (typeof req.body.completed !== "boolean") {
    return sendError(res, 422, "VALIDATION_ERROR", "completed は true か false で指定してください");
  }
  try {
    const data = await model.updateCompleted(id, req.body.completed);
    if (!data) return sendError(res, 404, "NOT_FOUND", "TODOが見つかりません");
    return res.status(200).json({ data });
  } catch (err) {
    return handleDbError(res, err);
  }
}

// REQ-04 削除
export async function remove(req: Request, res: Response) {
  const id = parseId(String(req.params.id));
  if (id === null) {
    return sendError(res, 400, "BAD_REQUEST", "id は1以上の整数で指定してください");
  }
  try {
    const deleted = await model.remove(id);
    if (!deleted) return sendError(res, 404, "NOT_FOUND", "TODOが見つかりません");
    return res.status(204).send();
  } catch (err) {
    return handleDbError(res, err);
  }
}
