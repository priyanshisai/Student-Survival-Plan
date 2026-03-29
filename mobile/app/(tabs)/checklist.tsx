import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppScreen } from "@/components/AppScreen";
import { Field } from "@/components/Field";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors } from "@/theme/colors";
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
      setTodos(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load tasks");
    }
  }

  useEffect(() => {
    void loadTodos();
  }, []);

  const visibleTodos = useMemo(() => {
    if (filter === "all") {
      return todos;
    }

    return todos.filter((todo) => todo.category === filter);
  }, [filter, todos]);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const progress = todos.length ? (completedCount / todos.length) * 100 : 0;
  const stickyIndex = error ? 2 : 1;

  async function handleCreate() {
    if (!newTodo.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      await createTodo(newTodo.trim(), selectedCategory);
      setNewTodo("");
      await loadTodos(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to add task");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleTodo(id);
      await loadTodos(false);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Failed to update task");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTodo(id);
      await loadTodos(false);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete task");
    }
  }

  return (
    <AppScreen
      title="Checklist"
      subtitle="Your progress bar stays pinned while the task stack scrolls underneath."
      stickyHeaderIndices={[stickyIndex]}
    >
      {error ? (
        <AppCard>
          <Text style={styles.errorText}>{error}</Text>
        </AppCard>
      ) : null}

      <View style={styles.stickyShell}>
        <AppCard>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.cardTitle}>Today&apos;s progress</Text>
              <Text style={styles.progressMeta}>
                {completedCount}/{todos.length} completed
              </Text>
            </View>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </AppCard>
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Add a new task</Text>
        <Field label="Task" onChangeText={setNewTodo} placeholder="What do you need to do?" value={newTodo} />
        <View style={styles.filterRow}>
          {todoCategories.map((category) => {
            const active = selectedCategory === category.key;
            return (
              <Pressable
                key={category.key}
                onPress={() => setSelectedCategory(category.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{category.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <PrimaryButton label={submitting ? "Adding..." : "Add task"} onPress={handleCreate} />
      </AppCard>

      <View style={styles.filterRow}>
        <Pressable onPress={() => setFilter("all")} style={[styles.filterChip, filter === "all" && styles.filterChipActive]}>
          <Text style={[styles.filterLabel, filter === "all" && styles.filterLabelActive]}>All</Text>
        </Pressable>
        {todoCategories.map((category) => (
          <Pressable
            key={category.key}
            onPress={() => setFilter(category.key)}
            style={[styles.filterChip, filter === category.key && styles.filterChipActive]}
          >
            <Text style={[styles.filterLabel, filter === category.key && styles.filterLabelActive]}>{category.label}</Text>
          </Pressable>
        ))}
      </View>

      {visibleTodos.map((todo) => (
        <AppCard key={todo.id}>
          <View style={styles.todoRow}>
            <Pressable onPress={() => handleToggle(todo.id)} style={[styles.checkbox, todo.completed && styles.checkboxActive]}>
              <Text style={styles.checkboxLabel}>{todo.completed ? "✓" : ""}</Text>
            </Pressable>
            <View style={styles.todoMeta}>
              <Text style={[styles.todoTitle, todo.completed && styles.todoDone]}>{todo.title}</Text>
              <Text style={styles.todoCategory}>{todo.category}</Text>
            </View>
            <PrimaryButton label="Delete" onPress={() => handleDelete(todo.id)} variant="soft" />
          </View>
        </AppCard>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: colors.danger,
    fontWeight: "600",
  },
  stickyShell: {
    backgroundColor: colors.background,
    paddingBottom: 8,
    zIndex: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: "#020617",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  cardTitle: {
    color: colors.textDark,
    fontSize: 20,
    fontWeight: "800",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressMeta: {
    color: colors.textMuted,
    marginTop: 4,
  },
  progressPercent: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  progressTrack: {
    height: 14,
    backgroundColor: colors.cardMuted,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: 14,
    borderRadius: 999,
    backgroundColor: colors.accentStrong,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.accentSoft,
  },
  filterLabel: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  filterLabelActive: {
    color: colors.text,
  },
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: colors.accent,
  },
  checkboxLabel: {
    color: colors.text,
    fontWeight: "800",
  },
  todoMeta: {
    flex: 1,
    gap: 4,
  },
  todoTitle: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: "700",
  },
  todoDone: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  todoCategory: {
    color: colors.textMuted,
    textTransform: "capitalize",
  },
});
