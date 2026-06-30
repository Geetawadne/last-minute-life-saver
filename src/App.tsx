import { useState, useEffect, useCallback } from "react";
import { Plus, Search, SlidersHorizontal, RefreshCw, Layers, CheckCircle2, RotateCcw, AlertTriangle, Info } from "lucide-react";
import DashboardStats from "./components/DashboardStats";
import TaskCard from "./components/TaskCard";
import TaskForm from "./components/TaskForm";
import { Task, TaskStats } from "./types";

// Standard preset categories for filtering sidebar/pills
const FILTER_CATEGORIES = ["All", "Work", "Personal", "Health", "Education", "Finance", "Other"];

// Empty default stats structure
const DEFAULT_STATS: TaskStats = {
  total: 0,
  completed: 0,
  pending: 0,
  completionRate: 0,
  byCategory: {},
  byPriority: { low: 0, medium: 0, high: 0 },
};

export default function App() {
  // Task data & analytics states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>(DEFAULT_STATS);
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState<string>("created-desc");
  
  // UI Controls
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Helper to trigger custom toasts
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch both tasks & analytics stats from database
  const fetchAppData = useCallback(async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      // Build search params
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (selectedPriority !== "all") params.append("priority", selectedPriority);
      if (selectedStatus !== "all") params.append("completed", selectedStatus);

      // Fetch tasks
      const tasksRes = await fetch(`/api/tasks?${params.toString()}`);
      if (!tasksRes.ok) throw new Error("Could not fetch tasks from server.");
      const tasksData = await tasksRes.json();
      setTasks(tasksData);

      // Fetch stats
      const statsRes = await fetch("/api/stats");
      if (!statsRes.ok) throw new Error("Could not fetch database statistics.");
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred while communicating with the database.");
      showToast("Sync failure: Server database offline.", "error");
    } finally {
      setIsSyncing(false);
    }
  }, [searchQuery, selectedCategory, selectedPriority, selectedStatus, showToast]);

  // Synchronize on filters or search query changes
  useEffect(() => {
    fetchAppData();
  }, [fetchAppData]);

  // Handle task submission (creation or update)
  const handleFormSubmit = async (taskData: Omit<Task, "id" | "completed" | "createdAt" | "updatedAt">) => {
    setErrorMessage(null);
    try {
      if (taskToEdit) {
        // UPDATE Existing
        const res = await fetch(`/api/tasks/${taskToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        if (!res.ok) throw new Error("Failed to save changes to task.");
        showToast("Task successfully updated!");
      } else {
        // CREATE New
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        if (!res.ok) throw new Error("Failed to register new task.");
        showToast("New task created successfully!");
      }
      setIsFormOpen(false);
      setTaskToEdit(null);
      fetchAppData();
    } catch (err: any) {
      showToast(err.message || "Could not execute task save operation.", "error");
    }
  };

  // Toggle completion status
  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error("Could not update task status.");
      
      // Update local state instantly for lightning fast feedback, then pull verified server data
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
      showToast(completed ? "Task completed! Great job." : "Task marked as pending.", "info");
      
      // Sync analytics stats in background
      const statsRes = await fetch("/api/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err: any) {
      showToast(err.message || "Could not toggle status.", "error");
      fetchAppData();
    }
  };

  // Delete a task
  const handleDeleteTask = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Could not remove task from server database.");
      showToast("Task permanently deleted.", "success");
      fetchAppData();
    } catch (err: any) {
      showToast(err.message || "Could not delete task.", "error");
    }
  };

  // Trigger Edit mode
  const handleEditTaskTrigger = (task: Task) => {
    setTaskToEdit(task);
    setIsFormOpen(true);
  };

  // Reset all filters in one click
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedPriority("all");
    setSelectedStatus("all");
    setSortBy("created-desc");
    showToast("Filters successfully reset.", "info");
  };

  // Client-side sort implementation
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === "created-desc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "created-asc") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === "due-asc") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === "due-desc") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
    if (sortBy === "priority-high") {
      const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const weightA = priorityWeight[a.priority as string] || 0;
      const weightB = priorityWeight[b.priority as string] || 0;
      return weightB - weightA;
    }
    if (sortBy === "priority-low") {
      const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const weightA = priorityWeight[a.priority as string] || 0;
      const weightB = priorityWeight[b.priority as string] || 0;
      return weightA - weightB;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast Notification HUD */}
      {toast && (
        <div
          id="system-toast"
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm transition-all duration-300 animate-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-emerald-500 border-emerald-600 text-white"
              : toast.type === "error"
              ? "bg-red-500 border-red-600 text-white"
              : "bg-slate-800 border-slate-900 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : toast.type === "error" ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <Info className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Main App Bar / Navigation */}
      <header className="h-20 bg-white border-b border-gray-100 sticky top-0 z-40 flex items-center shrink-0">
        <div className="max-w-7xl w-full mx-auto px-6 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-gray-900">Taskly.</span>
              <p className="text-[10px] text-gray-400 font-mono tracking-wider">CRUX ENGINE • NODE.JS</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              id="sync-btn"
              onClick={fetchAppData}
              disabled={isSyncing}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-all"
              title="Sync Database"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${isSyncing ? "animate-spin text-indigo-600" : ""}`} />
            </button>

            <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">Alex Johnson</p>
                <p className="text-xs text-gray-500">Product Designer</p>
              </div>
              <div className="w-11 h-11 rounded-full bg-amber-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-to-tr from-rose-400 to-amber-300"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 py-8">
        {/* Core Dashboard Stats widgets */}
        <DashboardStats stats={stats} selectedStatus={selectedStatus} onStatusSelect={setSelectedStatus} />

        {/* Error Callout Banner if any */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-800">Database Connection Error</h4>
              <p className="text-xs text-rose-600 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Workspace Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* LEFT COLUMN: Robust Sidebar Filters Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-sans flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
                  Filter Desk
                </h3>
                {(searchQuery || selectedCategory !== "All" || selectedPriority !== "all" || selectedStatus !== "all") && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline transition-all"
                  >
                    <RotateCcw className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>

              {/* Text Search Bar */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans">Search Tasks</label>
                <div className="relative">
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Search keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9.5 pr-3.5 py-2.5 rounded-2xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  />
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Status Select Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans">Completion Status</label>
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="all">All States</option>
                  <option value="false">Pending Tasks</option>
                  <option value="true">Completed Tasks</option>
                </select>
              </div>

              {/* Priority Select Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans">Priority Level</label>
                <select
                  id="priority-filter"
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              {/* Category Select Filters with dot color indicator */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans block">Categories</label>
                <div className="space-y-1">
                  {FILTER_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const count = cat === "All" 
                      ? stats.total 
                      : stats.byCategory[cat] || 0;

                    const getDotColor = (name: string) => {
                      switch (name.toLowerCase()) {
                        case "all": return "bg-indigo-600";
                        case "work": return "bg-rose-500";
                        case "personal": return "bg-emerald-500";
                        case "health": return "bg-cyan-500";
                        case "education": return "bg-violet-500";
                        case "finance": return "bg-amber-500";
                        default: return "bg-indigo-500";
                      }
                    };

                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-indigo-50 text-indigo-700 font-bold"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${getDotColor(cat)}`} />
                          {cat}
                        </span>
                        <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                          isSelected ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-500"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Task Grid */}
          <div className="lg:col-span-3 space-y-4">
            {/* Task list main container box (rounded-3xl p-8 bg-white shadow-sm) */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 flex flex-col shadow-sm border border-gray-100/40 min-h-[500px]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-50">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Today's Schedule</h2>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">
                    {tasks.length} standard records filtered
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort by:</span>
                    <select
                      id="sort-by-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-white text-gray-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="created-desc">Date Created (Newest)</option>
                      <option value="created-asc">Date Created (Oldest)</option>
                      <option value="due-asc">Due Date (Soonest)</option>
                      <option value="due-desc">Due Date (Furthest)</option>
                      <option value="priority-high">Priority (High to Low)</option>
                      <option value="priority-low">Priority (Low to High)</option>
                    </select>
                  </div>

                  <button
                    id="new-task-btn"
                    onClick={() => {
                      setTaskToEdit(null);
                      setIsFormOpen(true);
                    }}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-indigo-100 cursor-pointer"
                  >
                    <Plus className="h-4.5 w-4.5 stroke-[3]" />
                    <span>Add Task</span>
                  </button>
                </div>
              </div>

              {isSyncing && tasks.length > 0 && (
                <div className="mb-4 text-xs font-mono text-gray-400 animate-pulse flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
                  Syncing with server database...
                </div>
              )}

              {/* Task Grid Container */}
              {tasks.length === 0 ? (
                // Enhanced Empty State Container
                <div className="my-auto py-12 text-center max-w-md mx-auto flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 shadow-sm">
                    <CheckCircle2 className="h-8 w-8 stroke-[1.5] text-indigo-600" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-gray-800">No matching tasks found</h3>
                    <p className="text-sm text-gray-400">
                      {searchQuery || selectedCategory !== "All" || selectedPriority !== "all" || selectedStatus !== "all"
                        ? "Try clearing some of your filters or broadening your search keywords to reveal tasks."
                        : "Your task space is currently clear. Add your first task and let's get organized!"}
                    </p>
                  </div>
                  <div>
                    {searchQuery || selectedCategory !== "All" || selectedPriority !== "all" || selectedStatus !== "all" ? (
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-2xl text-sm font-semibold transition-all cursor-pointer"
                      >
                        Reset Workspace Filters
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setTaskToEdit(null);
                          setIsFormOpen(true);
                        }}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-indigo-100 flex items-center gap-1.5 mx-auto transition-all cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5 stroke-[3]" />
                        <span>Add First Task</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // Task Cards list
                <div className="flex flex-col gap-3.5">
                  {sortedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onEdit={handleEditTaskTrigger}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Task Creation & Modification Modal */}
      <TaskForm
        isOpen={isFormOpen}
        taskToEdit={taskToEdit}
        onClose={() => {
          setIsFormOpen(false);
          setTaskToEdit(null);
        }}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
