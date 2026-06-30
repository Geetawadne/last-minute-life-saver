import React, { useState, useEffect } from "react";
import { X, Calendar, Plus, Save } from "lucide-react";
import { Task } from "../types";

interface TaskFormProps {
  taskToEdit?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Omit<Task, "id" | "completed" | "createdAt" | "updatedAt">) => void;
  isSubmitting?: boolean;
}

const CATEGORY_SUGGESTIONS = ["Work", "Personal", "Health", "Education", "Finance", "Other"];

export default function TaskForm({
  taskToEdit,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState("Work");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [validationError, setValidationError] = useState("");

  // Populate form if we are editing an existing task
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || "");
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.dueDate || "");

      const isPreset = CATEGORY_SUGGESTIONS.includes(taskToEdit.category);
      if (isPreset) {
        setCategory(taskToEdit.category);
        setIsCustomCategoryMode(false);
      } else {
        setCategory("Other");
        setCustomCategory(taskToEdit.category);
        setIsCustomCategoryMode(true);
      }
    } else {
      // Reset form for clean creation
      setTitle("");
      setDescription("");
      setPriority("medium");
      setCategory("Work");
      setCustomCategory("");
      setIsCustomCategoryMode(false);
      setDueDate("");
    }
    setValidationError("");
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleCategorySelect = (cat: string) => {
    if (cat === "Other") {
      setIsCustomCategoryMode(true);
      setCategory("Other");
    } else {
      setIsCustomCategoryMode(false);
      setCategory(cat);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!title.trim()) {
      setValidationError("Task title is required.");
      return;
    }

    const finalCategory = isCustomCategoryMode
      ? customCategory.trim() || "Other"
      : category;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      category: finalCategory,
      dueDate: dueDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="task-form-modal"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {taskToEdit ? "Edit Task Details" : "Create New Task"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {validationError && (
            <div className="p-3 text-xs bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-sans">
              {validationError}
            </div>
          )}

          {/* Title input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans">Task Title *</label>
            <input
              id="task-title-input"
              type="text"
              required
              placeholder="e.g. Design user database schema"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>

          {/* Description input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans">Description</label>
            <textarea
              id="task-desc-input"
              rows={3}
              placeholder="Provide a summary of the steps or checklist..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
            />
          </div>

          {/* Category selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_SUGGESTIONS.map((cat) => {
                const isSelected = isCustomCategoryMode ? cat === "Other" : category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`px-3 py-1.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {isCustomCategoryMode && (
              <div className="mt-2 animate-in slide-in-from-top-1 duration-150">
                <input
                  id="custom-category-input"
                  type="text"
                  placeholder="Type a custom category name..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            )}
          </div>

          {/* Priority custom radio buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans block">Priority Level</label>
            <div className="grid grid-cols-3 gap-2.5">
              {(["low", "medium", "high"] as const).map((p) => {
                const isSelected = priority === p;
                const borderClass =
                  p === "high"
                    ? "border-rose-200 hover:border-rose-400 focus:ring-rose-500/10"
                    : p === "medium"
                    ? "border-indigo-200 hover:border-indigo-400 focus:ring-indigo-500/10"
                    : "border-emerald-200 hover:border-emerald-400 focus:ring-emerald-500/10";

                const activeBg =
                  p === "high"
                    ? "bg-rose-500 border-rose-500 text-white"
                    : p === "medium"
                    ? "bg-indigo-500 border-indigo-500 text-white"
                    : "bg-emerald-500 border-emerald-500 text-white";

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2.5 rounded-2xl border text-xs font-bold text-center transition-all capitalize cursor-pointer ${
                      isSelected
                        ? activeBg
                        : `bg-white border-gray-200 text-gray-600 ${borderClass}`
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest font-sans flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Due Date
            </label>
            <input
              id="task-date-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>

          {/* Form Actions footer */}
          <div className="pt-5 flex items-center justify-end gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="form-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl flex items-center gap-1.5 shadow-md shadow-indigo-100 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" />
              ) : taskToEdit ? (
                <Save className="h-4.5 w-4.5" />
              ) : (
                <Plus className="h-4.5 w-4.5 stroke-[3]" />
              )}
              <span>{taskToEdit ? "Save Changes" : "Create Task"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
