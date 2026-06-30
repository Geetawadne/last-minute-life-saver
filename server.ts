import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Task, TaskStats } from "./src/types";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "tasks-db.json");

// Parse JSON request bodies
app.use(express.json());

// Helper function to read tasks from DB
function readTasks(): Task[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // Seed initial tasks if database file doesn't exist
      const initialTasks: Task[] = [
        {
          id: "seed-1",
          title: "Design task manager architecture",
          description: "Create standard modular structures, state managers, and database models for the CRUD application.",
          completed: true,
          priority: "high",
          category: "Work",
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Yesterday
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "seed-2",
          title: "Implement frontend components",
          description: "Build a highly responsive task grid, filtering panels, and stats visualization with Framer Motion and Lucide icons.",
          completed: false,
          priority: "medium",
          category: "Work",
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // In 2 days
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "seed-3",
          title: "Set up Node.js server and API endpoints",
          description: "Develop Express API router with persistent JSON-file-based storage and dynamic analytics generation.",
          completed: true,
          priority: "high",
          category: "Education",
          dueDate: new Date(Date.now()).toISOString().split("T")[0], // Today
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "seed-4",
          title: "Buy weekly organic groceries",
          description: "Pick up fresh spinach, broccoli, berries, avocados, milk, and whole grains from the local farmer's market.",
          completed: false,
          priority: "low",
          category: "Personal",
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // In 4 days
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "seed-5",
          title: "Schedule physical checkup",
          description: "Call Dr. Evans' office to confirm annual consultation and review lipid profile reports.",
          completed: false,
          priority: "medium",
          category: "Health",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // In 7 days
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(DB_FILE, JSON.stringify(initialTasks, null, 2), "utf-8");
      return initialTasks;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data) as Task[];
  } catch (error) {
    console.error("Failed to read database file:", error);
    return [];
  }
}

// Helper function to write tasks to DB
function writeTasks(tasks: Task[]): boolean {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(tasks, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to write database file:", error);
    return false;
  }
}

// REST API Endpoints

// 1. Get all tasks (supports query filters)
app.get("/api/tasks", (req, res) => {
  let tasks = readTasks();
  const { search, category, priority, completed } = req.query;

  if (search) {
    const q = (search as string).toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }

  if (category && category !== "all") {
    tasks = tasks.filter((t) => t.category === category);
  }

  if (priority && priority !== "all") {
    tasks = tasks.filter((t) => t.priority === priority);
  }

  if (completed !== undefined && completed !== "all") {
    const isCompleted = completed === "true";
    tasks = tasks.filter((t) => t.completed === isCompleted);
  }

  // Sort by date (newest first) by default
  tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(tasks);
});

// 2. Create a new task
app.post("/api/tasks", (req, res) => {
  const { title, description, priority, category, dueDate } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Task title is required." });
  }

  const tasks = readTasks();
  const newTask: Task = {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: title.trim(),
    description: (description || "").trim(),
    completed: false,
    priority: priority || "medium",
    category: category || "Other",
    dueDate: dueDate || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks.unshift(newTask); // Add to the beginning
  if (writeTasks(tasks)) {
    res.status(201).json(newTask);
  } else {
    res.status(500).json({ error: "Could not save task to database." });
  }
});

// 3. Update an existing task
app.put("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { title, description, priority, category, dueDate, completed } = req.body;

  const tasks = readTasks();
  const taskIndex = tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found." });
  }

  const existingTask = tasks[taskIndex];

  const updatedTask: Task = {
    ...existingTask,
    title: title !== undefined ? title.trim() : existingTask.title,
    description: description !== undefined ? description.trim() : existingTask.description,
    priority: priority || existingTask.priority,
    category: category || existingTask.category,
    dueDate: dueDate !== undefined ? dueDate : existingTask.dueDate,
    completed: completed !== undefined ? !!completed : existingTask.completed,
    updatedAt: new Date().toISOString(),
  };

  // Validate title if supplied
  if (updatedTask.title === "") {
    return res.status(400).json({ error: "Task title cannot be empty." });
  }

  tasks[taskIndex] = updatedTask;
  if (writeTasks(tasks)) {
    res.json(updatedTask);
  } else {
    res.status(500).json({ error: "Could not update task in database." });
  }
});

// 4. Delete a task
app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const tasks = readTasks();
  const filteredTasks = tasks.filter((t) => t.id !== id);

  if (tasks.length === filteredTasks.length) {
    return res.status(404).json({ error: "Task not found." });
  }

  if (writeTasks(filteredTasks)) {
    res.json({ success: true, message: "Task successfully deleted." });
  } else {
    res.status(500).json({ error: "Could not delete task from database." });
  }
});

// 5. Get database stats
app.get("/api/stats", (req, res) => {
  const tasks = readTasks();
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Breakdown by category
  const byCategory: Record<string, number> = {};
  // Breakdown by priority
  const byPriority = { low: 0, medium: 0, high: 0 };

  tasks.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    if (t.priority === "low") byPriority.low++;
    else if (t.priority === "medium") byPriority.medium++;
    else if (t.priority === "high") byPriority.high++;
  });

  const stats: TaskStats = {
    total,
    completed,
    pending,
    completionRate,
    byCategory,
    byPriority,
  };

  res.json(stats);
});

// Integrates Vite development server middleware OR static prod files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Single page app fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
