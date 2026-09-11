const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, "db.json");

app.use(express.json());
app.use(express.static(__dirname));

function readTasks() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeTasks(tasks) {
  fs.writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2));
}

// Get all tasks
app.get("/api/tasks", (req, res) => {
  res.json(readTasks());
});

// Add a task
app.post("/api/tasks", (req, res) => {
  const text = String(req.body.text || "").trim();

  if (!text) {
    return res.status(400).json({ message: "Task text is required." });
  }

  const tasks = readTasks();

  const task = {
    id: Date.now(),
    text,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(task);
  writeTasks(tasks);

  res.status(201).json(task);
});

// Edit or complete a task
app.put("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const tasks = readTasks();
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  if (typeof req.body.text === "string") {
    const text = req.body.text.trim();
    if (!text) {
      return res.status(400).json({ message: "Task text cannot be empty." });
    }
    task.text = text;
  }

  if (typeof req.body.completed === "boolean") {
    task.completed = req.body.completed;
  }

  writeTasks(tasks);
  res.json(task);
});

// Delete one task
app.delete("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const tasks = readTasks();
  const filtered = tasks.filter(t => t.id !== id);

  if (filtered.length === tasks.length) {
    return res.status(404).json({ message: "Task not found." });
  }

  writeTasks(filtered);
  res.status(204).send();
});

// Delete all tasks
app.delete("/api/tasks", (req, res) => {
  writeTasks([]);
  res.status(204).send();
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`To-Do app running at http://localhost:${PORT}`);
});
