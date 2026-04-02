import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { AppScreen } from "@/components/AppScreen";
import { todoCategories } from "@/constants/todos";
import {
  createTodo,
  deleteTodo,
  getActiveTodos,
  getTodos,
  toggleTodo,
  type TodoCategory,
} from "@/features/todos/services/todos";

type TodoItem = {
  id: string;
  title: string;
  category: TodoCategory;
  completed: boolean;
};

const categoryConfig: Record<TodoCategory, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  health: { label: "Health",    emoji: "💊", color: "#b91c1c", bg: "#fee2e2", border: "#fecaca" },
  study:  { label: "Study",     emoji: "📚", color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" },
  reminder: { label: "Reminder",emoji: "🔔", color: "#92400e", bg: "#fef3c7", border: "#fde68a" },
  skill:  { label: "Skill",     emoji: "🎯", color: "#065f46", bg: "#d1fae5", border: "#a7f3d0" },
};

export default function ChecklistScreen() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TodoCategory>("study");
  const [filter, setFilter] = useState<TodoCategory | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadTodos(activeOnly = true) {
    try {
      setError(null);
      const data = activeOnly ? await getActiveTodos() : await getTodos();
      setTodos(data as TodoItem[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load tasks");
    }
  }

  useEffect(() => { void loadTodos(); }, []);

  const visibleTodos = useMemo(() =>
          filter === "all" ? todos : todos.filter((t) => t.category === filter),
      [filter, todos]
  );

  const completedCount = todos.filter((t) => t.completed).length;
  const progress = todos.length ? (completedCount / todos.length) * 100 : 0;

  async function handleCreate() {
    if (!newTodo.trim()) return;
    try {
      setSubmitting(true);
      await createTodo(newTodo.trim(), selectedCategory);
      setNewTodo("");
      await loadTodos(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add task");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleTodo(id);
      await loadTodos(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update task");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTodo(id);
      await loadTodos(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete task");
    }
  }

  return (
      <AppScreen title="Checklist" subtitle="Stay on top of your tasks and never miss a deadline!">

        {/* Error */}
        {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
        ) : null}

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Today's Progress</Text>
            <Text style={styles.progressMeta}>{completedCount}/{todos.length} completed</Text>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
                colors={["#6366f1", "#a855f7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress}%` as any }]}
            />
          </View>
        </View>

        {/* Add Task Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add New Task</Text>
          <TextInput
              style={styles.input}
              value={newTodo}
              onChangeText={setNewTodo}
              placeholder="What do you need to do?"
              placeholderTextColor="#94a3b8"
              onSubmitEditing={handleCreate}
              returnKeyType="done"
          />
          {/* Category selector */}
          <View style={styles.chipRow}>
            {(Object.entries(categoryConfig) as [TodoCategory, typeof categoryConfig[TodoCategory]][]).map(([key, cfg]) => {
              const active = selectedCategory === key;
              return (
                  <Pressable
                      key={key}
                      onPress={() => setSelectedCategory(key)}
                      style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={styles.chipEmoji}>{cfg.emoji}</Text>
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{cfg.label}</Text>
                  </Pressable>
              );
            })}
          </View>
          <Pressable
              onPress={handleCreate}
              disabled={submitting}
              style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.85 }, submitting && { opacity: 0.6 }]}
          >
            <LinearGradient
                colors={["#6366f1", "#7c3aed"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
            >
              <Text style={styles.addButtonLabel}>{submitting ? "Adding..." : "Add Task"}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          <Pressable
              onPress={() => setFilter("all")}
              style={[styles.filterTab, filter === "all" && styles.filterTabActive]}
          >
            <Text style={[styles.filterTabLabel, filter === "all" && styles.filterTabLabelActive]}>All</Text>
          </Pressable>
          {(Object.entries(categoryConfig) as [TodoCategory, typeof categoryConfig[TodoCategory]][]).map(([key, cfg]) => (
              <Pressable
                  key={key}
                  onPress={() => setFilter(key)}
                  style={[styles.filterTab, filter === key && styles.filterTabActive]}
              >
                <Text style={styles.filterTabEmoji}>{cfg.emoji}</Text>
                <Text style={[styles.filterTabLabel, filter === key && styles.filterTabLabelActive]}>{cfg.label}</Text>
              </Pressable>
          ))}
        </View>

        {/* Todo list */}
        {visibleTodos.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🎊</Text>
              <Text style={styles.emptyText}>No tasks here!</Text>
            </View>
        ) : (
            visibleTodos.map((todo) => {
              const cfg = categoryConfig[todo.category];
              return (
                  <View key={todo.id} style={[styles.todoRow, todo.completed && styles.todoRowDone]}>
                    {/* Checkbox */}
                    <Pressable
                        onPress={() => handleToggle(todo.id)}
                        style={[styles.checkbox, todo.completed && styles.checkboxDone]}
                    >
                      {todo.completed ? <Text style={styles.checkmark}>✓</Text> : null}
                    </Pressable>

                    {/* Title + category */}
                    <View style={styles.todoMeta}>
                      <Text style={[styles.todoTitle, todo.completed && styles.todoTitleDone]}>{todo.title}</Text>
                      <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                        <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.emoji} {cfg.label}</Text>
                      </View>
                    </View>

                    {/* Delete */}
                    <Pressable onPress={() => handleDelete(todo.id)} style={styles.deleteButton}>
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </Pressable>
                  </View>
              );
            })
        )}
      </AppScreen>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    backgroundColor: "#fee2e2",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: "600",
    fontSize: 13,
  },

  // Progress
  progressCard: {
    backgroundColor: "rgba(30,27,75,0.7)",
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    color: "#e2e8f0",
    fontWeight: "600",
    fontSize: 15,
  },
  progressMeta: {
    color: "#94a3b8",
    fontSize: 13,
  },
  progressTrack: {
    height: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: 12,
    borderRadius: 999,
    minWidth: 4,
  },

  // Add task card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    color: "#1e1b4b",
    fontSize: 17,
    fontWeight: "800",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1e1b4b",
    backgroundColor: "#f8fafc",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  chipActive: {
    backgroundColor: "#ede9fe",
    borderColor: "#7c3aed",
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 13,
  },
  chipLabelActive: {
    color: "#7c3aed",
  },
  addButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  addButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // Filter tabs
  filterRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterTabActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  filterTabEmoji: { fontSize: 13 },
  filterTabLabel: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 13,
  },
  filterTabLabelActive: {
    color: "#ffffff",
  },

  // Empty state
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyEmoji: { fontSize: 36 },
  emptyText: {
    color: "#94a3b8",
    fontSize: 15,
  },

  // Todo rows
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  todoRowDone: {
    opacity: 0.6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  checkmark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  todoMeta: {
    flex: 1,
    gap: 6,
  },
  todoTitle: {
    color: "#1e293b",
    fontSize: 15,
    fontWeight: "600",
  },
  todoTitleDone: {
    textDecorationLine: "line-through",
    color: "#94a3b8",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    padding: 6,
  },
  deleteIcon: {
    fontSize: 18,
  },
});