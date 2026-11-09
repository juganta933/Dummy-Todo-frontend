"use client";

import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { 
  Trash2, 
  CheckCircle, 
  Circle, 
  LogOut, 
  Plus, 
  ShieldAlert, 
  Sparkles,
  Search,
  CheckCheck
} from "lucide-react";
import confetti from "canvas-confetti";

export default function Home() {
  // Authentication State
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Todo States
  const [todos, setTodos] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | "active" | "completed"
  const [newTitle, setNewTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      loadUserProfile();
    }
  }, []);

  // Fetch todos when user is authenticated
  useEffect(() => {
    if (user) {
      fetchTodos();
    }
  }, [user]);

  async function loadUserProfile() {
    try {
      const res = await api.getMe();
      if (res.data) {
        setUser(res.data);
      }
    } catch {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  }

  async function fetchTodos() {
    setLoading(true);
    setActionError("");
    try {
      const res = await api.getTodos("limit=100");
      if (res.data && res.data.todos) {
        setTodos(res.data.todos);
      }
    } catch (err) {
      setActionError(err.message || "Failed to fetch todos");
    } finally {
      setLoading(false);
    }
  }

  // Auth Submit Handlers
  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      let res;
      if (authMode === "register") {
        res = await api.register(authForm);
      } else {
        res = await api.login({ email: authForm.email, password: authForm.password });
      }

      if (res.data?.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
        setUser(res.data.user);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("accessToken");
    setUser(null);
    setTodos([]);
  }

  // Todo Actions
  async function handleCreateTodo(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await api.createTodo({
        title: newTitle.trim(),
      });
      if (res.data) {
        setTodos([res.data, ...todos]);
        setNewTitle("");
        confetti({
          particleCount: 35,
          spread: 50,
          colors: ['#e11d48', '#fbbf24', '#ffffff']
        });
      }
    } catch (err) {
      setActionError(err.message || "Could not add todo");
    }
  }

  async function handleToggleTodo(id) {
    try {
      const res = await api.toggleTodo(id);
      if (res.data) {
        setTodos(todos.map(t => t._id === id ? res.data : t));
        if (res.data.isCompleted) {
          confetti({
            particleCount: 30,
            angle: 60,
            spread: 50,
            origin: { x: 0.1 }
          });
        }
      }
    } catch (err) {
      setActionError(err.message || "Toggle failed");
    }
  }

  async function handleDeleteTodo(id) {
    try {
      await api.deleteTodo(id);
      setTodos(todos.filter(t => t._id !== id));
    } catch (err) {
      setActionError(err.message || "Delete failed");
    }
  }

  async function handleClearCompleted() {
    try {
      await api.clearCompleted();
      setTodos(todos.filter(t => !t.isCompleted));
    } catch (err) {
      setActionError(err.message || "Clear completed failed");
    }
  }

  // Filter calculations
  const filteredTodos = todos.filter(t => {
    const matchesStatus = 
      filterStatus === "all" ? true :
      filterStatus === "active" ? !t.isCompleted :
      t.isCompleted;

    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const completedCount = todos.filter(t => t.isCompleted).length;
  const activeCount = todos.length - completedCount;

  return (
    <div className="min-h-screen text-slate-100 px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        
        {/* ========================================================================= */}
        {/* CLEAN COMIC HEADER                                                        */}
        {/* ========================================================================= */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b-2 border-slate-800">
          <div>
            <h1 className="text-4xl md:text-5xl font-comic tracking-wider text-white drop-shadow-[2px_2px_0px_#e11d48]">
              DUMMY <span className="text-amber-400">TODO</span>
            </h1>
            <p className="font-marker text-xs md:text-sm text-slate-400 mt-1">
              {user ? `Logged in as ${user.name}` : "Stay sharp • Get things done"}
            </p>
          </div>

          {user && (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-white border-2 border-slate-700 hover:border-rose-500 font-comic text-sm px-3 py-1.5 comic-btn-shadow cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-500" /> LOGOUT
            </button>
          )}
        </header>

        {!user ? (
          /* ========================================================================= */
          /* AUTHENTICATION VIEW                                                       */
          /* ========================================================================= */
          <div className="bg-slate-900 comic-border p-6 md:p-8 tilt-slight mt-6">
            <div className="text-center mb-6">
              <span className="bg-amber-400 text-black font-comic text-lg px-4 py-1 border-2 border-black inline-block font-bold">
                {authMode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
              </span>
            </div>

            {authError && (
              <div className="bg-rose-950 border-2 border-rose-500 text-rose-200 px-3 py-2 font-mono text-xs mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "register" && (
                <div>
                  <label className="block font-comic text-slate-300 text-base mb-1">
                    NAME
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full bg-slate-950 text-white font-mono px-3 py-2.5 border-2 border-slate-700 focus:border-amber-400 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-comic text-slate-300 text-base mb-1">
                  EMAIL
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full bg-slate-950 text-white font-mono px-3 py-2.5 border-2 border-slate-700 focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block font-comic text-slate-300 text-base mb-1">
                  PASSWORD
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full bg-slate-950 text-white font-mono px-3 py-2.5 border-2 border-slate-700 focus:border-amber-400 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 bg-rose-600 hover:bg-rose-500 text-white font-comic text-xl py-2.5 border-2 border-black comic-btn-shadow tracking-wider uppercase cursor-pointer"
              >
                {authLoading ? "PLEASE WAIT..." : (authMode === "login" ? "ENTER" : "REGISTER")}
              </button>
            </form>

            <div className="mt-6 text-center border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setAuthError("");
                }}
                className="text-amber-400 hover:text-amber-300 font-marker text-xs underline cursor-pointer"
              >
                {authMode === "login"
                  ? "Don't have an account? Sign up here"
                  : "Already registered? Sign in"}
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CLEAN TODO LIST VIEW                                                      */
          /* ========================================================================= */
          <div className="space-y-6">
            
            {/* ADD TODO INPUT */}
            <form onSubmit={handleCreateTodo} className="flex gap-2">
              <input
                type="text"
                placeholder="What needs to be done?"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 bg-slate-900 border-2 border-slate-700 focus:border-amber-400 text-white px-4 py-3 font-mono text-sm outline-none comic-btn-shadow"
              />
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-300 text-black font-comic text-xl px-5 border-2 border-black comic-btn-shadow cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-5 h-5 stroke-[3]" /> ADD
              </button>
            </form>

            {/* CONTROLS BAR: Filter tabs & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2">
              
              {/* Filter Tabs */}
              <div className="flex gap-1 bg-slate-900 p-1 border-2 border-slate-800">
                {[
                  { id: "all", label: `ALL (${todos.length})` },
                  { id: "active", label: `ACTIVE (${activeCount})` },
                  { id: "completed", label: `DONE (${completedCount})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id)}
                    className={`font-comic text-sm px-3 py-1 cursor-pointer transition-colors ${
                      filterStatus === tab.id
                        ? "bg-amber-400 text-black font-bold shadow-[2px_2px_0px_#000]"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter todos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-44 bg-slate-900 border-2 border-slate-800 text-white pl-9 pr-3 py-1 text-xs font-mono focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            {actionError && (
              <div className="bg-rose-950 text-rose-200 border-2 border-rose-500 px-3 py-2 font-mono text-xs flex justify-between items-center">
                <span>{actionError}</span>
                <button onClick={() => setActionError("")} className="font-bold ml-2">✕</button>
              </div>
            )}

            {/* TODO ITEMS LIST */}
            <div className="space-y-2.5">
              {loading && todos.length === 0 ? (
                <div className="text-center py-12 font-comic text-xl text-slate-500 animate-pulse">
                  LOADING TODOS...
                </div>
              ) : filteredTodos.length === 0 ? (
                <div className="bg-slate-900 comic-border p-8 text-center">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
                  <p className="font-comic text-xl text-slate-300">NO TODOS HERE</p>
                  <p className="font-marker text-xs text-slate-500 mt-1">
                    {searchQuery ? "Try a different search word" : "Add a task above to get started!"}
                  </p>
                </div>
              ) : (
                filteredTodos.map((todo) => (
                  <div
                    key={todo._id}
                    className={`bg-slate-900 comic-border p-3.5 flex items-center gap-3 transition-all ${
                      todo.isCompleted 
                        ? "opacity-60 bg-slate-950 border-slate-800" 
                        : "hover:border-amber-400"
                    }`}
                  >
                    {/* Toggle Button */}
                    <button
                      onClick={() => handleToggleTodo(todo._id)}
                      className="text-slate-400 hover:text-amber-400 cursor-pointer shrink-0"
                    >
                      {todo.isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 fill-emerald-950 stroke-[2.5]" />
                      ) : (
                        <Circle className="w-5 h-5 hover:stroke-amber-400 stroke-[2]" />
                      )}
                    </button>

                    {/* Todo Text */}
                    <span className={`flex-1 font-mono text-sm break-all ${
                      todo.isCompleted ? "line-through text-slate-500" : "text-white"
                    }`}>
                      {todo.title}
                    </span>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteTodo(todo._id)}
                      className="text-slate-500 hover:text-rose-400 p-1 hover:bg-slate-800 cursor-pointer shrink-0 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* BOTTOM SUMMARY & BULK CLEAR */}
            {todos.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs font-mono text-slate-400">
                <span>{activeCount} pending • {completedCount} completed</span>
                
                {completedCount > 0 && (
                  <button
                    onClick={handleClearCompleted}
                    className="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                  >
                    Clear completed
                  </button>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
