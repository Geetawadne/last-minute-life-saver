import { motion } from "motion/react";
import { Check, Edit2, Trash2, Calendar, AlertCircle } from "lucide-react";
import { Task } from "../types";

interface TaskCardProps {
  key?: string | number;
  task: Task;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
  // Color configuration for priority tags
  const priorityColors = {
    high: {
      bg: "bg-rose-100 text-rose-600 border-rose-200",
      dot: "bg-rose-500",
      label: "High Priority",
    },
    medium: {
      bg: "bg-indigo-100 text-indigo-600 border-indigo-200",
      dot: "bg-indigo-500",
      label: "Medium Priority",
    },
    low: {
      bg: "bg-emerald-100 text-emerald-600 border-emerald-200",
      dot: "bg-emerald-500",
      label: "Low Priority",
    },
  };

  // Color configuration for standard categories
  const getCategoryStyles = (category: string) => {
    const formatted = category.toLowerCase().trim();
    switch (formatted) {
      case "work":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "personal":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "health":
        return "bg-cyan-50 text-cyan-600 border-cyan-100";
      case "education":
        return "bg-violet-50 text-violet-600 border-violet-100";
      case "finance":
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-indigo-50 text-indigo-600 border-indigo-100";
    }
  };

  // Format due date elegantly
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return new Date(dateStr).toLocaleDateString("en-US", options);
  };

  // Check if task is overdue
  const isOverdue = () => {
    if (!task.dueDate || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      id={`task-card-${task.id}`}
      className={`relative group bg-gray-50 rounded-3xl border-2 p-5 transition-all duration-200 ${
        task.completed
          ? "border-transparent shadow-none opacity-70 bg-gray-50/70"
          : "border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-lg hover:shadow-indigo-100/40"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Toggle Checkbox - Custom styled rounded-lg checkbox */}
        <button
          id={`toggle-btn-${task.id}`}
          onClick={() => onToggleComplete(task.id, !task.completed)}
          className={`mt-1 flex-shrink-0 w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-colors cursor-pointer duration-200 ${
            task.completed
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-gray-300 bg-white hover:border-indigo-500"
          }`}
          aria-label={task.completed ? "Mark as pending" : "Mark as completed"}
        >
          {task.completed ? (
            <Check className="h-4 w-4 stroke-[3.5]" />
          ) : (
            <span className="w-2 h-2 bg-indigo-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        {/* Task Info Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {/* Category Tag */}
            <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-lg border ${getCategoryStyles(task.category)}`}>
              {task.category}
            </span>

            {/* Priority Tag */}
            <span className={`flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-lg border ${priorityColors[task.priority].bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${priorityColors[task.priority].dot}`} />
              {priorityColors[task.priority].label}
            </span>

            {/* Overdue Warning */}
            {isOverdue() && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                Overdue
              </span>
            )}
          </div>

          <h4
            className={`text-base font-bold text-gray-900 break-words ${
              task.completed ? "line-through text-gray-400 font-medium" : ""
            }`}
          >
            {task.title}
          </h4>

          {task.description && (
            <p
              className={`mt-1 text-sm text-gray-500 break-words leading-relaxed line-clamp-3 ${
                task.completed ? "text-gray-400" : ""
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Bottom Metas */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            {task.dueDate ? (
              <span className={`flex items-center gap-1.5 ${isOverdue() ? "text-rose-500 font-bold" : ""}`}>
                <Calendar className="h-3.5 w-3.5" />
                <span>Due {formatDate(task.dueDate)}</span>
              </span>
            ) : (
              <span />
            )}

            <span className="font-mono text-[10px] tracking-wider text-gray-400">
              {new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            id={`edit-btn-${task.id}`}
            onClick={() => onEdit(task)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Edit Task"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            id={`delete-btn-${task.id}`}
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            title="Delete Task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
