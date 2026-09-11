const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const clearBtn = document.getElementById("clearBtn");
const emptyMessage = document.getElementById("emptyMessage");

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Something went wrong");
  }

  return response.status === 204 ? null : response.json();
}

async function loadTasks() {
  try {
    const tasks = await api("/api/tasks");
    renderTasks(tasks);
  } catch (error) {
    alert("Could not connect to the backend. Make sure the server is running.");
    console.error(error);
  }
}

function renderTasks(tasks) {
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task" + (task.completed ? " completed" : "");

    li.innerHTML = `
      <input type="checkbox" class="task-check" ${task.completed ? "checked" : ""}>
      <span class="task-text"></span>
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    `;

    li.querySelector(".task-text").textContent = task.text;

    li.querySelector(".task-check").addEventListener("change", async () => {
      try {
        const updated = await api(`/api/tasks/${task.id}`, {
          method: "PUT",
          body: JSON.stringify({ completed: !task.completed })
        });
        loadTasks();
      } catch (error) {
        alert(error.message);
      }
    });

    li.querySelector(".edit-btn").addEventListener("click", async () => {
      const newText = prompt("Edit your task:", task.text);

      if (newText !== null && newText.trim() !== "") {
        try {
          await api(`/api/tasks/${task.id}`, {
            method: "PUT",
            body: JSON.stringify({ text: newText.trim() })
          });
          loadTasks();
        } catch (error) {
          alert(error.message);
        }
      }
    });

    li.querySelector(".delete-btn").addEventListener("click", async () => {
      try {
        await api(`/api/tasks/${task.id}`, { method: "DELETE" });
        loadTasks();
      } catch (error) {
        alert(error.message);
      }
    });

    taskList.appendChild(li);
  });

  const remaining = tasks.filter(task => !task.completed).length;
  taskCount.textContent = `${remaining} ${remaining === 1 ? "task" : "tasks"} remaining`;
  emptyMessage.style.display = tasks.length === 0 ? "block" : "none";
}

async function addTask() {
  const text = taskInput.value.trim();

  if (!text) {
    alert("Please enter a task.");
    return;
  }

  try {
    await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ text })
    });
    taskInput.value = "";
    await loadTasks();
    taskInput.focus();
  } catch (error) {
    alert(error.message);
  }
}

addBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addTask();
});

clearBtn.addEventListener("click", async () => {
  if (!confirm("Delete all tasks?")) return;

  try {
    await api("/api/tasks", { method: "DELETE" });
    loadTasks();
  } catch (error) {
    alert(error.message);
  }
});

loadTasks();
