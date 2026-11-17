// ブラウザ用: APIクラス + 画面操作
class TodoApi {
  constructor(baseUrl = "/api/todo/v1/todos") {
    this.baseUrl = baseUrl;
  }

  async request(path, options) {
    const res = await fetch(this.baseUrl + path, options);
    if (res.status === 204) return null;
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const message = body && body.error ? body.error.message : "通信エラーが発生しました";
      throw new Error(message);
    }
    return body.data;
  }

  list() {
    return this.request("");
  }

  create(title) {
    return this.request("", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }

  updateCompleted(id, completed) {
    return this.request("/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
  }

  remove(id) {
    return this.request("/" + id, { method: "DELETE" });
  }
}

const api = new TodoApi();
const form = document.getElementById("todo-form");
const input = document.getElementById("title");
const listEl = document.getElementById("todo-list");
const emptyEl = document.getElementById("empty");
const messageEl = document.getElementById("message");

function showMessage(text) {
  messageEl.textContent = text || "";
}

function render(todos) {
  listEl.innerHTML = "";
  emptyEl.hidden = todos.length > 0;
  for (const todo of todos) {
    const li = document.createElement("li");
    if (todo.completed) li.classList.add("done");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", () => run(() => api.updateCompleted(todo.id, checkbox.checked)));

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = todo.title; // textContentでXSSを防ぐ

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "削除";
    del.addEventListener("click", () => run(() => api.remove(todo.id)));

    li.append(checkbox, title, del);
    listEl.appendChild(li);
  }
}

async function reload() {
  render(await api.list());
}

async function run(action) {
  try {
    showMessage("");
    await action();
    await reload();
  } catch (err) {
    showMessage(err.message);
    try { await reload(); } catch (_) { /* 表示更新に失敗しても無視 */ }
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = input.value.trim();
  run(async () => {
    await api.create(title);
    input.value = "";
  });
});

run(async () => {});
