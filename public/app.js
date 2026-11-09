const STORAGE_KEY = "daymark.tasks.v1";

const taskList = document.querySelector("#task-list");
const taskDialog = document.querySelector("#task-dialog");
const taskForm = document.querySelector("#task-form");
const taskTitleInput = document.querySelector("#task-title");
const searchInput = document.querySelector("#search-input");
const priorityFilter = document.querySelector("#priority-filter");
const toast = document.querySelector("#toast");
const clearCompletedButton = document.querySelector("#clear-completed");

let currentView = "all";
let toastTimeout;
let tasks = readTasks();

const viewDetails = {
  all: { title: "All tasks", description: "Everything you want to make time for." },
  today: { title: "Today", description: "A clear view of what’s on your plate today." },
  upcoming: { title: "Coming up", description: "Make a little room for what’s next." },
  important: { title: "Important", description: "The things you’ve marked as a priority." },
  completed: { title: "Completed", description: "A record of the things you’ve already done." },
};

function readTasks() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((task) => task && typeof task.id === "string" && typeof task.title === "string");
  } catch {
    showToast("Your saved tasks could not be read in this browser.");
    return [];
  }
}

function saveTasks() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    document.querySelector("#storage-status").textContent = "Auto-saved";
  } catch {
    document.querySelector("#storage-status").textContent = "Storage unavailable";
    showToast("Could not save changes. Check this browser’s storage settings.");
  }
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function localDateKey(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatDueDate(value) {
  if (!value) return "";
  const today = localDateKey();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = localDateKey(tomorrowDate);
  if (value === today) return "Today";
  if (value === tomorrow) return "Tomorrow";
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function dateSubtitle() {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const date = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(now);
  document.querySelector("#today-label").textContent = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(now);
  document.querySelector("#date-subtitle").textContent = `${greeting}. It’s ${date} — make space for what matters.`;
}

function priorityRank(priority) {
  return ({ high: 0, medium: 1, low: 2 })[priority] ?? 3;
}

function countForView(view) {
  const today = localDateKey();
  if (view === "today") return tasks.filter((task) => !task.completed && task.dueDate === today).length;
  if (view === "upcoming") return tasks.filter((task) => !task.completed && task.dueDate && task.dueDate > today).length;
  if (view === "important") return tasks.filter((task) => !task.completed && task.priority === "high").length;
  if (view === "completed") return tasks.filter((task) => task.completed).length;
  return tasks.filter((task) => !task.completed).length;
}

function getVisibleTasks() {
  const today = localDateKey();
  const search = searchInput.value.trim().toLocaleLowerCase();
  return tasks.filter((task) => {
    if (currentView === "today" && (task.completed || task.dueDate !== today)) return false;
    if (currentView === "upcoming" && (task.completed || !task.dueDate || task.dueDate <= today)) return false;
    if (currentView === "important" && (task.completed || task.priority !== "high")) return false;
    if (currentView === "completed" && !task.completed) return false;
    if (priorityFilter.value !== "all" && task.priority !== priorityFilter.value) return false;
    if (search) {
      const searchable = `${task.title} ${task.description ?? ""} ${task.category ?? ""}`.toLocaleLowerCase();
      if (!searchable.includes(search)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const dueOrder = (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
    return dueOrder || priorityRank(a.priority) - priorityRank(b.priority) || (b.createdAt || "").localeCompare(a.createdAt || "");
  });
}

function dueMarkup(task) {
  if (!task.dueDate) return "";
  const overdue = !task.completed && task.dueDate < localDateKey();
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/></svg>';
  const label = overdue ? `Overdue · ${formatDueDate(task.dueDate)}` : formatDueDate(task.dueDate);
  return `<span class="task-due${overdue ? " is-overdue" : ""}">${icon}${escapeHtml(label)}</span>`;
}

function taskMarkup(task, index) {
  const completed = Boolean(task.completed);
  const safeId = escapeHtml(task.id);
  const title = escapeHtml(task.title);
  const description = task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : "";
  const category = escapeHtml(task.category || "Personal");
  const priority = ["high", "medium", "low"].includes(task.priority) ? task.priority : "medium";
  const priorityName = priority.charAt(0).toUpperCase() + priority.slice(1);
  return `<article class="task-row${completed ? " is-complete" : ""}" style="animation-delay:${Math.min(index, 7) * 25}ms">
    <button class="task-check" type="button" data-action="toggle" data-id="${safeId}" aria-label="${completed ? "Mark" : "Complete"} ${title}" aria-pressed="${completed}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"/></svg></button>
    <div class="task-copy"><div class="task-title">${title}</div>${description}<div class="task-meta"><span class="task-category" data-category="${category}">${category}</span>${dueMarkup(task)}<span class="priority-label priority-${priority}"><span class="priority-dot"></span>${priorityName}</span></div></div>
    <div class="task-actions"><button class="icon-button" type="button" data-action="edit" data-id="${safeId}" aria-label="Edit ${title}" title="Edit task"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/></svg></button><button class="icon-button delete-action" type="button" data-action="delete" data-id="${safeId}" aria-label="Delete ${title}" title="Delete task"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 7h15M9 7V4.5h6V7m-8.5 0 1 13h9l1-13M10 10.5v6m4-6v6"/></svg></button></div>
  </article>`;
}

function emptyMarkup() {
  const searching = searchInput.value.trim();
  const noTasksAtAll = tasks.length === 0 && currentView === "all" && !searching;
  const title = noTasksAtAll ? "A fresh page." : searching ? "Nothing matched that search." : "Nothing on this list yet.";
  const description = noTasksAtAll ? "Add your first task and give it a clear next step." : searching ? "Try another phrase or clear your search." : "When something comes up, add it here and keep moving.";
  const action = noTasksAtAll ? '<button class="button button-primary" type="button" data-new-task><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg> Add your first task</button>' : "";
  return `<div class="empty-state"><div class="empty-illustration" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5h10a2 2 0 0 1 2 2v13l-7-3.5-7 3.5v-13a2 2 0 0 1 2-2Z"/><path d="M9 10h6m-6 3.5h4"/></svg></div><h3>${title}</h3><p>${description}</p>${action}</div>`;
}

function render() {
  const visibleTasks = getVisibleTasks();
  const openTasks = tasks.filter((task) => !task.completed);
  const doneTasks = tasks.filter((task) => task.completed);
  const dueToday = openTasks.filter((task) => task.dueDate === localDateKey()).length;

  document.querySelector("#section-title").textContent = viewDetails[currentView].title;
  document.querySelector("#section-description").textContent = viewDetails[currentView].description;
  document.querySelector("#section-count").textContent = String(visibleTasks.length);
  document.querySelector("#open-count").textContent = String(openTasks.length);
  document.querySelector("#due-today-count").textContent = String(dueToday);
  document.querySelector("#completed-count").textContent = String(doneTasks.length);
  document.querySelector("#nav-all-count").textContent = String(countForView("all"));
  document.querySelector("#nav-today-count").textContent = String(countForView("today"));
  document.querySelector("#nav-upcoming-count").textContent = String(countForView("upcoming"));
  document.querySelector("#nav-important-count").textContent = String(countForView("important"));
  document.querySelector("#nav-completed-count").textContent = String(countForView("completed"));
  clearCompletedButton.hidden = currentView !== "completed" || doneTasks.length === 0;

  taskList.innerHTML = visibleTasks.length ? visibleTasks.map(taskMarkup).join("") : emptyMarkup();

  const total = tasks.length;
  const percent = total ? Math.round((doneTasks.length / total) * 100) : 0;
  const ring = document.querySelector("#progress-ring");
  ring.style.setProperty("--progress", `${percent * 3.6}deg`);
  ring.setAttribute("aria-label", `${percent} percent of tasks completed`);
  document.querySelector("#progress-percent").textContent = `${percent}%`;
  document.querySelector("#progress-fraction").textContent = `${doneTasks.length} of ${total}`;
  document.querySelector("#progress-caption").textContent = total ? (percent === 100 ? "Everything on your list is done." : "Every small step moves you forward.") : "Your list is ready when you are.";
  document.querySelector("#progress-bar").style.width = `${percent}%`;
  document.querySelector("#progress-count-label").textContent = `${doneTasks.length} ${doneTasks.length === 1 ? "task" : "tasks"}`;

  const nextTask = openTasks.slice().sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31") || priorityRank(a.priority) - priorityRank(b.priority))[0];
  const nextContent = document.querySelector("#next-task-content");
  if (nextTask) {
    const due = nextTask.dueDate ? formatDueDate(nextTask.dueDate) : "No due date";
    const priority = ["high", "medium", "low"].includes(nextTask.priority) ? nextTask.priority : "medium";
    nextContent.innerHTML = `<span class="next-task-title">${escapeHtml(nextTask.title)}</span><span class="next-task-meta"><span class="priority-label priority-${priority}"><span class="priority-dot"></span>${priority}</span><span>·</span>${escapeHtml(due)}</span>`;
  } else {
    nextContent.innerHTML = '<span class="next-empty">No open tasks right now. Enjoy the breathing room.</span>';
  }
}

function openCreateDialog() {
  taskForm.reset();
  document.querySelector("#task-id").value = "";
  document.querySelector("#dialog-title").textContent = "Create a task";
  document.querySelector("#save-task").textContent = "Create task";
  taskDialog.showModal();
  window.setTimeout(() => taskTitleInput.focus(), 0);
}

function openEditDialog(task) {
  taskForm.elements.id.value = task.id;
  taskForm.elements.title.value = task.title;
  taskForm.elements.description.value = task.description || "";
  taskForm.elements.dueDate.value = task.dueDate || "";
  taskForm.elements.priority.value = task.priority || "medium";
  taskForm.elements.category.value = task.category || "Personal";
  document.querySelector("#dialog-title").textContent = "Edit task";
  document.querySelector("#save-task").textContent = "Save changes";
  taskDialog.showModal();
  window.setTimeout(() => taskTitleInput.focus(), 0);
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

document.querySelectorAll("[data-new-task]").forEach((button) => button.addEventListener("click", openCreateDialog));
document.querySelector("#close-dialog").addEventListener("click", () => taskDialog.close());
document.querySelector("#cancel-dialog").addEventListener("click", () => taskDialog.close());
taskDialog.addEventListener("click", (event) => {
  if (event.target === taskDialog) taskDialog.close();
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!taskForm.reportValidity()) return;
  const formData = new FormData(taskForm);
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!title) {
    taskTitleInput.focus();
    return;
  }

  const existing = tasks.find((task) => task.id === id);
  const task = {
    id: existing?.id || makeId(),
    title,
    description: String(formData.get("description") || "").trim(),
    dueDate: String(formData.get("dueDate") || ""),
    priority: String(formData.get("priority") || "medium"),
    category: String(formData.get("category") || "Personal"),
    completed: existing?.completed ?? false,
    createdAt: existing?.createdAt || new Date().toISOString(),
    completedAt: existing?.completedAt || null,
  };

  if (existing) {
    tasks = tasks.map((current) => current.id === id ? task : current);
    showToast("Your changes have been saved.");
  } else {
    tasks = [task, ...tasks];
    showToast("Task added to your list.");
  }
  saveTasks();
  taskDialog.close();
  render();
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const task = tasks.find((item) => item.id === button.dataset.id);
  if (!task) return;

  if (button.dataset.action === "toggle") {
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    saveTasks();
    render();
    showToast(task.completed ? "Marked complete. Nice work." : "Task moved back to your list.");
  }
  if (button.dataset.action === "edit") openEditDialog(task);
  if (button.dataset.action === "delete" && window.confirm(`Delete “${task.title}”?`)) {
    tasks = tasks.filter((item) => item.id !== task.id);
    saveTasks();
    render();
    showToast("Task deleted.");
  }
});

document.querySelectorAll(".nav-item[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    currentView = button.dataset.view;
    document.querySelectorAll(".nav-item[data-view]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
    render();
  });
});

searchInput.addEventListener("input", render);
priorityFilter.addEventListener("change", render);
clearCompletedButton.addEventListener("click", () => {
  if (!window.confirm(`Clear all ${tasks.filter((task) => task.completed).length} completed tasks?`)) return;
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
  showToast("Completed tasks cleared.");
});

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;
  tasks = readTasks();
  render();
  showToast("Your list was updated in another tab.");
});

document.addEventListener("keydown", (event) => {
  const editing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
  if (event.key === "/" && !editing) {
    event.preventDefault();
    searchInput.focus();
  }
  if ((event.key === "n" || event.key === "N") && !editing && !taskDialog.open && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    openCreateDialog();
  }
});

dateSubtitle();
render();
