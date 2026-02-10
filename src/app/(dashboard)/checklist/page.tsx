"use client";

import { useState, useEffect, useTransition } from "react";
import { createTodo, getTodos, toggleTodo as toggleTodoAction, deleteTodo as deleteTodoAction, type TodoCategory } from "@/lib/actions/todos";

type Category = TodoCategory;

interface TodoItem {
  id: string;
  title: string;
  category: Category;
  completed: boolean;
  dueDate?: Date | null;
}

const categoryConfig = {
  health: { emoji: "💊", label: "Health", color: "bg-red-100 text-red-700 border-red-200" },
  study: { emoji: "📚", label: "Study", color: "bg-blue-100 text-blue-700 border-blue-200" },
  reminder: { emoji: "🔔", label: "Reminder", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  skill: { emoji: "🎯", label: "Skillset", color: "bg-green-100 text-green-700 border-green-200" },
};

export default function ChecklistPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("study");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const data = await getTodos();
      setTodos(data as TodoItem[]);
    } catch (error) {
      console.error("Failed to load todos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    
    startTransition(async () => {
      try {
        await createTodo(newTodo, selectedCategory);
        setNewTodo("");
        loadTodos();
      } catch (error) {
        console.error("Failed to create todo:", error);
      }
    });
  };

  const toggleTodo = (id: string) => {
    startTransition(async () => {
      try {
        await toggleTodoAction(id);
        loadTodos();
      } catch (error) {
        console.error("Failed to toggle todo:", error);
      }
    });
  };

  const deleteTodo = (id: string) => {
    startTransition(async () => {
      try {
        await deleteTodoAction(id);
        loadTodos();
      } catch (error) {
        console.error("Failed to delete todo:", error);
      }
    });
  };

  const filteredTodos = filterCategory === "all" 
    ? todos 
    : todos.filter(todo => todo.category === filterCategory);

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading your tasks...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Smart Student Checklist ✅</h1>
        <p className="text-gray-600 mt-1">Stay on top of your tasks and never miss a deadline!</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="font-medium text-gray-700">Today&apos;s Progress</span>
          <span className="text-sm text-gray-500">{completedCount}/{totalCount} completed</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Add New Todo */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Add New Task</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addTodo()}
            placeholder="What do you need to do?"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as Category)}
            className="px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500 bg-white"
          >
            {Object.entries(categoryConfig).map(([key, config]) => (
              <option key={key} value={key}>
                {config.emoji} {config.label}
              </option>
            ))}
          </select>
          <button
            onClick={addTodo}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Add Task
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterCategory === "all"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          All
        </button>
        {Object.entries(categoryConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilterCategory(key as Category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterCategory === key
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {config.emoji} {config.label}
          </button>
        ))}
      </div>

      {/* Todo List */}
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <span className="text-4xl">🎉</span>
            <p className="text-gray-600 mt-2">No tasks here! Add one above.</p>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 transition-all ${
                todo.completed ? "opacity-60" : ""
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  todo.completed
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-gray-300 hover:border-indigo-500"
                }`}
              >
                {todo.completed && "✓"}
              </button>
              
              <div className="flex-1">
                <p className={`font-medium ${todo.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                  {todo.title}
                </p>
                {todo.dueDate && (
                  <p className="text-sm text-gray-500">Due: {new Date(todo.dueDate).toLocaleDateString()}</p>
                )}
              </div>
              
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryConfig[todo.category].color}`}>
                {categoryConfig[todo.category].emoji} {categoryConfig[todo.category].label}
              </span>
              
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
