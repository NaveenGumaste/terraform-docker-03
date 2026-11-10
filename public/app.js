const STORAGE_KEY = "daymark.tasks.v1";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const submitButton = document.querySelector("#submit-button");
const cancelButton = document.querySelector("#cancel-edit");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const taskCount = document.querySelector("#task-count");
const feedback = document.querySelector("#feedback");

let tasks = loadTasks();
let editingId = null;

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter((task) => task && typeof task.id === "string" && typeof task.title === "string")
      : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch {
    showFeedback("Could not save tasks in this browser.");
    return false;
  }
}

function showFeedback(message) {
  feedback.textContent = message;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function render() {
  const sortedTasks = [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed));
  taskList.innerHTML = sortedTasks.map((task) => {
    const title = escapeHtml(task.title);
    const checked = task.completed ? "checked" : "";
    const itemClass = task.completed ? "task-item is-complete" : "task-item";
    const toggleLabel = task.completed ? "Mark " + title + " as not complete" : "Mark " + title + " as complete";
    return '<li class="' + itemClass + '">' +
      '<label class="task-toggle">' +
      '<input type="checkbox" data-action="toggle" data-id="' + escapeHtml(task.id) + '" aria-label="' + toggleLabel + '" ' + checked + ' />' +
      '<span class="checkmark" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m3 8 3.2 3.2L13 4.8" /></svg></span>' +
      '</label>' +
      '<span class="task-title">' + title + '</span>' +
      '<div class="task-actions">' +
      '<button class="task-action" type="button" data-action="edit" data-id="' + escapeHtml(task.id) + '" aria-label="Edit ' + title + '">Edit</button>' +
      '<button class="task-action delete" type="button" data-action="delete" data-id="' + escapeHtml(task.id) + '" aria-label="Delete ' + title + '">Delete</button>' +
      '</div></li>';
  }).join("");

  emptyState.hidden = tasks.length > 0;
  const remaining = tasks.filter((task) => !task.completed).length;
  taskCount.textContent = remaining + " " + (remaining === 1 ? "task" : "tasks") + " remaining";
}

function resetForm() {
  editingId = null;
  form.reset();
  submitButton.innerHTML = '<span aria-hidden="true">+</span> Add task';
  cancelButton.hidden = true;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) return;

  if (editingId) {
    tasks = tasks.map((task) => task.id === editingId ? { ...task, title } : task);
    showFeedback("Task updated.");
  } else {
    const id = globalThis.crypto?.randomUUID?.() || "task-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    tasks.push({ id, title, completed: false });
    showFeedback("Task added.");
  }

  saveTasks();
  resetForm();
  render();
  input.focus();
});

cancelButton.addEventListener("click", () => {
  resetForm();
  showFeedback("");
  input.focus();
});

taskList.addEventListener("change", (event) => {
  const checkbox = event.target.closest('input[data-action="toggle"]');
  if (!checkbox) return;
  const task = tasks.find((item) => item.id === checkbox.dataset.id);
  if (!task) return;
  task.completed = checkbox.checked;
  saveTasks();
  render();
  showFeedback(task.completed ? "Task completed." : "Task marked incomplete.");
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const task = tasks.find((item) => item.id === button.dataset.id);
  if (!task) return;

  if (button.dataset.action === "edit") {
    editingId = task.id;
    input.value = task.title;
    submitButton.textContent = "Save changes";
    cancelButton.hidden = false;
    input.focus();
    input.select();
  }

  if (button.dataset.action === "delete" && window.confirm('Delete "' + task.title + '"?')) {
    tasks = tasks.filter((item) => item.id !== task.id);
    if (editingId === task.id) resetForm();
    saveTasks();
    render();
    showFeedback("Task deleted.");
  }
});

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;
  tasks = loadTasks();
  render();
});

render();
