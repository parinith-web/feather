import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardNav from "./Elements/DashboardNav";
import HistoryCard from "./Elements/HistoryCard";
import { listHistory, deleteHistoryItem, clearHistory } from "../api/history";
import { useAuth } from "../AuthContext";
import DashboardBg from "../assets/dashboard-bg.png";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "transparent", label: "Transparent" },
  { id: "white", label: "White" },
  { id: "color", label: "Color" },
  { id: "image", label: "Custom" },
];

const History = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("comfortable"); // "comfortable" | "compact"

  useEffect(() => {
    (async () => {
      try {
        const items = await listHistory();
        setHistory(items);
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Couldn't load history.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id) => {
    const previous = history;
    setHistory((h) => h.filter((item) => item.id !== id));
    try {
      await deleteHistoryItem(id);
      refreshProfile();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Couldn't delete that item.");
      setHistory(previous);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete all history? This can't be undone.")) return;
    const previous = history;
    setHistory([]);
    try {
      await clearHistory();
      refreshProfile();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Couldn't clear history.");
      setHistory(previous);
    }
  };

  const filtered = useMemo(() => {
    return history.filter((item) => {
      const matchesFilter = filter === "all" || item.bgType === filter;
      const matchesQuery = item.filename.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [history, filter, query]);

  return (
    <div className="min-h-screen relative isolate overflow-hidden bg-[#F3F4F6] font-sans text-slate-800">
      {/* Background wash + soft color blobs, matching the Dashboard/landing visual language */}
      <div
        className="absolute inset-x-0 top-0 z-[-2] blur-md saturate-75 pointer-events-none"
        style={{
          backgroundImage: `url(${DashboardBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          height: "50vh",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
        }}
      ></div>
      <div className="absolute top-40 -right-24 w-96 h-96 bg-blue-200/40 blur-3xl rounded-full pointer-events-none z-[-1]"></div>
      <div className="absolute bottom-0 -left-24 w-80 h-80 bg-blue-200/30 blur-3xl rounded-full pointer-events-none z-[-1]"></div>

      <DashboardNav />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-brice font-heading font-black text-[#2F5FA8]">
              History
            </h1>
            <p className="text-slate-500 font-manrope mt-1">
              Every image you've processed with Feather
              {history.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center text-xs font-bold bg-[#E8F1FF] text-[#2F5FA8] rounded-full px-2.5 py-0.5 align-middle">
                  {history.length}
                </span>
              )}
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm font-manrope font-medium text-red-500 hover:text-red-600 cursor-pointer flex items-center gap-2 self-start md:self-auto bg-white border border-[#EDEEF1] px-4 py-2.5 rounded-xl shadow-[0px_4px_0px_#EDEEF1] transition hover:shadow-[0px_4px_0px_#EDEEF1,0px_6px_14px_#e5e5e5]"
            >
              <i className="fa-solid fa-trash"></i>
              Clear all history
            </button>
          )}
        </div>

        {history.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-full text-xs font-manrope font-bold transition cursor-pointer ${
                    filter === f.id
                      ? "bg-[#2F5FA8] text-white shadow-[0px_3px_0px_#1F4278]"
                      : "bg-white text-slate-500 border border-[#EDEEF1] hover:border-gray-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="bg-white px-4 gap-2 flex items-center rounded-lg h-11 shadow-sm w-full md:w-64 focus-within:ring-2 focus-within:ring-[#A4BADD] transition-all">
                <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm"></i>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by filename"
                  className="outline-0 w-full placeholder-[#8595B0] text-[#2F5FA8] bg-transparent text-sm"
                />
              </div>

              <div className="shrink-0 bg-white rounded-lg h-11 p-1 flex items-center gap-1 shadow-sm border border-[#EDEEF1]">
                <button
                  onClick={() => setView("comfortable")}
                  title="Comfortable view"
                  className={`w-9 h-full rounded-md flex items-center justify-center transition cursor-pointer ${
                    view === "comfortable"
                      ? "bg-[#2F5FA8] text-white"
                      : "text-slate-400 hover:text-[#2F5FA8]"
                  }`}
                >
                  <i className="fa-solid fa-table-cells-large text-xs"></i>
                </button>
                <button
                  onClick={() => setView("compact")}
                  title="Compact view"
                  className={`w-9 h-full rounded-md flex items-center justify-center transition cursor-pointer ${
                    view === "compact"
                      ? "bg-[#2F5FA8] text-white"
                      : "text-slate-400 hover:text-[#2F5FA8]"
                  }`}
                >
                  <i className="fa-solid fa-table-cells text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#2F5FA8] rounded-full animate-spin"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-dashed border-[#CFD0D5] p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#E8F1FF] text-[#2F5FA8] flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-clock-rotate-left text-2xl"></i>
            </div>
            <p className="font-bold text-[#2F5FA8] font-manrope text-lg">No history yet</p>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              Remove your first background to see it show up here.
            </p>
            <button
              onClick={() => navigate("/remove-background")}
              className="bg-[#2F5FA8] hover:bg-[#1F4278] cursor-pointer text-white px-6 py-3 rounded-xl font-manrope font-bold transition inline-flex items-center gap-2"
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              Remove a Background
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-dashed border-[#CFD0D5] p-16 text-center">
            <p className="font-bold text-[#2F5FA8] font-manrope">No results match your search</p>
          </div>
        ) : (
          <div
            className={
              view === "compact"
                ? "flex flex-col gap-3 max-w-2xl"
                : "grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            }
          >
            {filtered.map((item) => (
              <HistoryCard key={item.id} item={item} onDelete={handleDelete} compact={view === "compact"} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
