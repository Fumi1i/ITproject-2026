import { pool } from "../../../db";

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
};

const COLUMNS = "id::int AS id, title, completed, created_at";

export async function findAll(): Promise<Todo[]> {
  const result = await pool.query(
    `SELECT ${COLUMNS} FROM todo_tasks ORDER BY id ASC`
  );
  return result.rows;
}

export async function create(title: string): Promise<Todo> {
  const result = await pool.query(
    `INSERT INTO todo_tasks (title) VALUES ($1) RETURNING ${COLUMNS}`,
    [title]
  );
  return result.rows[0];
}

export async function updateCompleted(
  id: number,
  completed: boolean
): Promise<Todo | null> {
  const result = await pool.query(
    `UPDATE todo_tasks SET completed = $1 WHERE id = $2 RETURNING ${COLUMNS}`,
    [completed, id]
  );
  return result.rows[0] ?? null;
}

export async function remove(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM todo_tasks WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
