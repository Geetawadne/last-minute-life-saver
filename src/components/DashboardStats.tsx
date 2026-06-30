import { ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { TaskStats } from "../types";

interface DashboardStatsProps {
  stats: TaskStats;
  selectedStatus: string;
  onStatusSelect: (status: string) => void;
}

export default function DashboardStats({ stats, selectedStatus, onStatusSelect }: DashboardStatsProps) {
  const isTotalActive = selectedStatus === "all";
  const isAccomplishedActive = selectedStatus === "true";
  const isPendingActive = selectedStatus === "false";

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
      {/* Total Tasks Card - Vibrant indigo background with premium shadow */}
      <button
        id="stat-total-card"
        onClick={() => onStatusSelect("all")}
        className={`rounded-3xl p-6 flex items-center justify-between border-2 transition-all duration-200 cursor-pointer text-left w-full hover:scale-[1.01] ${
          isTotalActive
            ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100/80 border-indigo-600 ring-4 ring-indigo-50"
            : "bg-white border-gray-100 text-gray-900 shadow-sm hover:shadow-md hover:border-indigo-100 hover:bg-indigo-50/10"
        }`}
      >
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest font-mono ${isTotalActive ? "text-indigo-100" : "text-gray-400"}`}>
            Total Tasks
          </p>
          <h3 className={`text-3xl font-black font-sans mt-1 ${isTotalActive ? "text-white" : "text-indigo-600"}`}>{stats.total}</h3>
        </div>
        <div className={`p-3.5 rounded-2xl ${isTotalActive ? "bg-white/15 text-white" : "bg-indigo-50 text-indigo-600"}`}>
          <ClipboardList className="h-6 w-6 stroke-[2.5]" />
        </div>
      </button>

      {/* Accomplished Tasks Card */}
      <button
        id="stat-completed-card"
        onClick={() => onStatusSelect("true")}
        className={`rounded-3xl p-6 flex items-center justify-between border-2 transition-all duration-200 cursor-pointer text-left w-full hover:scale-[1.01] ${
          isAccomplishedActive
            ? "bg-emerald-500 text-white shadow-xl shadow-emerald-100/80 border-emerald-500 ring-4 ring-emerald-50"
            : "bg-white border-gray-100 text-gray-900 shadow-sm hover:shadow-md hover:border-emerald-100 hover:bg-emerald-50/10"
        }`}
      >
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest font-mono ${isAccomplishedActive ? "text-emerald-100" : "text-gray-400"}`}>
            Accomplished
          </p>
          <h3 className={`text-3xl font-black font-sans mt-1 ${isAccomplishedActive ? "text-white" : "text-emerald-500"}`}>{stats.completed}</h3>
        </div>
        <div className={`p-3.5 rounded-2xl ${isAccomplishedActive ? "bg-white/15 text-white" : "bg-emerald-50 text-emerald-500"}`}>
          <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
        </div>
      </button>

      {/* Pending Tasks Card */}
      <button
        id="stat-pending-card"
        onClick={() => onStatusSelect("false")}
        className={`rounded-3xl p-6 flex items-center justify-between border-2 transition-all duration-200 cursor-pointer text-left w-full hover:scale-[1.01] ${
          isPendingActive
            ? "bg-rose-500 text-white shadow-xl shadow-rose-100/80 border-rose-500 ring-4 ring-rose-50"
            : "bg-white border-gray-100 text-gray-900 shadow-sm hover:shadow-md hover:border-rose-100 hover:bg-rose-50/10"
        }`}
      >
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest font-mono ${isPendingActive ? "text-rose-100" : "text-gray-400"}`}>
            Pending
          </p>
          <h3 className={`text-3xl font-black font-sans mt-1 ${isPendingActive ? "text-white" : "text-rose-500"}`}>{stats.pending}</h3>
        </div>
        <div className={`p-3.5 rounded-2xl ${isPendingActive ? "bg-white/15 text-white" : "bg-rose-50 text-rose-500"}`}>
          <Clock className="h-6 w-6 stroke-[2.5]" />
        </div>
      </button>

      {/* Completion Progress Card / Efficiency */}
      <div id="stat-progress-card" className="bg-white rounded-3xl p-6 border-2 border-transparent border-gray-100 shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Efficiency</p>
          <span className="text-sm font-black text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded-lg">{stats.completionRate}%</span>
        </div>
        <div className="mt-3">
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-600 ease-out"
              style={{ width: `${stats.completionRate}%` }}
            ></div>
          </div>
          <p className="text-[11px] font-medium text-gray-400 mt-2 font-sans">
            {stats.completed} of {stats.total} tasks archived
          </p>
        </div>
      </div>
    </div>
  );
}
