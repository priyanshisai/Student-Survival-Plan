"use client"

import {useState, useEffect, useTransition} from "react";
import {createTodo, getTodos, toggleTodo as toggleTodoAction, deleteTodo as deleteTodoAction, type TodoCategory} from "@/lib/actions/todos";
import {X, ListPlus, Library, BellRing, Goal, Pill, Trash2} from "lucide-react";
import Grainient from "@/components/active/Grainient";
import {getActiveTodos} from "@/lib/actions/todos";

type Category = TodoCategory;

interface TodoItem {
    id: string;
    title: string;
    category: Category;
    completed: boolean;
    dueDate?: Date | null;
}

const categoryConfig = {
    health: {visual: Pill, label: "Health", color: "bg-red-100 text-red-700 border-red-200"},
    study: {visual: Library, label: "Study", color: "bg-blue-100 text-blue-700 border-blue-200"},
    reminder: {visual: BellRing, label: "Reminder", color: "bg-yellow-100 text-yellow-700 border-yellow-200"},
    skill: {visual: Goal, label: "Skillset", color: "bg-green-100 text-green-700 border-green-200"},
};

const AddTaskForm = ({
                         newTodo,
                         setNewTodo,
                         addTodo,
                         selectedCategory,
                         setSelectedCategory,
                         isPending,
                         categoryConfig
                     }: any) => {
    return (<div className="flex flex-col gap-3">
        <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addTodo()}
            placeholder="What do you need to do?"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500 text-black"
        />
        <div className="flex gap-2">
            <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as Category)}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500 text-black bg-white"
            >
                {Object.entries(categoryConfig).map(([key, config]) => (
                    <option
                        key={key} value={key}>
                        {config.label}
                    </option>
                ))}
            </select>
            <button
                onClick={addTodo}
                disabled={isPending}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                {isPending ? "..." : "Add"}
            </button>
        </div>
    </div>);
};

export default function ChecklistPage() {
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [newTodo, setNewTodo] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<Category>("study");
    const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const loadChecklist = async () => {
            setIsLoading(true);
            try {
                const data = await getActiveTodos();
                setTodos(data as TodoItem[]);
            } catch (error) {
                console.error("Failed to load checklist: ",error);
            } finally {
                setIsLoading(false);
            }
        };
        loadChecklist();
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

    const [isCelebrating, setIsCelebrating] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsCelebrating(false);
        }, 2080);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Loading your tasks...</div>
            </div>
        );
    }

    return (
        <div className="relative overflow-x-hidden w-full min-h-screen z-0 bg-black/80">
            <div className="min-h-screen w-full absolute inset-0 -z-2">
                <Grainient
                    color1="#303746"
                    color2="#364ba1"
                    color3="#343783"
                    timeSpeed={0.25}
                    colorBalance={0}
                    warpStrength={1}
                    warpFrequency={5}
                    warpSpeed={2}
                    warpAmplitude={50}
                    blendAngle={0}
                    blendSoftness={0.05}
                    rotationAmount={500}
                    noiseScale={2}
                    grainAmount={0.1}
                    grainScale={2}
                    grainAnimated={false}
                    contrast={1.5}
                    gamma={1}
                    saturation={1}
                    centerX={0}
                    centerY={0}
                    zoom={0.9}
                />
            </div>

            {/* Floating section (main) */}
            <div className="md:m-10 m-3 relative z-10  p-4
            border-1 border-gray-400 rounded-3xl bg-gray-700/30
            animate-float mb-20 ">

                    <div className="flex flex-col md:flex-row p-3 w-full md:mt-20 mt-6 gap-8 items-start">

                        {/* Left Section */}
                        <div className="flex flex-col w-full shrink-0 md:w-[49%]">

                            {/* Header */}
                            <div className="mb-8">
                                <p className="text-white text-base md:text-xl mt-1">Stay on top of your tasks and never miss a deadline!</p>
                            </div>

                            {/* Progress Bar */}
                            <div className="bg-gray-800/60 rounded-2xl p-6 shadow-sm  mb-6 w-full">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-medium text-white/90">Today&apos;s Progress</span>
                                    <span
                                        className="text-sm text-gray-200">{completedCount}/{totalCount} completed</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                                        style={{width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`}}
                                    />
                                </div>
                            </div>

                            {/* Add New Task */}
                            <div className="hidden md:block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 ">
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
                                        {Object.entries(categoryConfig).map(([key, config]) => {
                                            return (
                                                <option key={key} value={key}>
                                                    {config.label}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <button
                                        onClick={addTodo}
                                        className="text-nowrap px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                    >
                                        Add Task
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className=" flex flex-col w-full">


                            <div className="flex flex-row justify-between w-full gap-1 mb-6">

                                {/* Filter Tabs */}
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

                                {/* Filter buttons */}
                                {Object.entries(categoryConfig).map(([key, config]) => {
                                    const Icon = config.visual;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setFilterCategory(key as Category)}
                                            className={`flex flex-row gap-2 px-4 py-2 rounded-lg font-xs justify-center w-full items-center text-center transition-colors ${
                                                filterCategory === key
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                                            }`}
                                        >
                                            <Icon size={15}/>
                                            <span className="hidden md:inline whitespace-nowrap">
                                    {config.label}
                                </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* To Do List */}
                            <div className="space-y-3 w-full">

                                {filteredTodos.length === 0 ? (

                                    /* No Task */
                                    <div className="flex flex-col items-center justify-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                                        {isCelebrating ? (
                                            <picture>
                                                <source srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f38a/512.webp" type="image/webp"/>
                                                <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f38a/512.gif" alt="🎊" width="40" height="40"/>
                                            </picture>
                                        ) : (
                                            <span className="text-4xl">🎊</span>
                                        )}
                                        <p className="text-gray-600 mt-2">No tasks here!</p>
                                    </div>

                                ) : (
                                    filteredTodos.map((todo) => {
                                        const CategoryIcon = categoryConfig[todo.category].visual;

                                        return (
                                            <div
                                                key={todo.id}
                                                className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center w-full gap-4 transition-all ${
                                                    todo.completed ? "opacity-60" : ""
                                                }`}
                                            >
                                                {/*Task Selection */}
                                                <button
                                                    onClick={() => toggleTodo(todo.id)}
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                        todo.completed
                                                            ? "bg-green-500 border-green-500 text-white"
                                                            : "border-gray-300 hover:border-indigo-500"
                                                    }`}
                                                >
                                                    {todo.completed && "✓"}
                                                </button>

                                                {/*Task Name */}
                                                <div className="flex-1">
                                                    <p className={`font-medium ${todo.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                                                        {todo.title}
                                                    </p>
                                                    {todo.dueDate && (
                                                        <p className="text-sm text-gray-500">Due: {new Date(todo.dueDate).toLocaleDateString()}</p>
                                                    )}
                                                </div>

                                                {/* Task Type */}
                                                <span
                                                    className={`sm:hidden px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${categoryConfig[todo.category].color}`}>
                                    {(() => {
                                        return <CategoryIcon size={14}/>;
                                    })()}
                                                    {categoryConfig[todo.category].label}
                                </span>

                                                {/* Task deletion */}
                                                <button
                                                    onClick={() => deleteTodo(todo.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2/>
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>


                        {/* MOBILE POP-UP*/}
                        {
                            isModalOpen && (
                                <div
                                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 rounded-4xl">
                                    <div
                                        className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-lg font-bold text-gray-800">Add New Task</h2>

                                            <button
                                                onClick={() => setIsModalOpen(false)}
                                                className="p-1 hover:bg-gray-100 rounded-full"
                                            >
                                                <X size={20} className="text-gray-500"/>
                                            </button>
                                        </div>
                                        <AddTaskForm
                                            newTodo={newTodo}
                                            setNewTodo={setNewTodo}
                                            addTodo={addTodo}
                                            selectedCategory={selectedCategory}
                                            setSelectedCategory={setSelectedCategory}
                                            isPending={isPending}
                                            categoryConfig={categoryConfig}
                                        />
                                    </div>
                                </div>
                            )
                        }
                    </div>
            </div>

            {/* Mobile View Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="z-50 flex flex-col md:hidden fixed bottom-25 pl-1 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg items-center justify-center active:scale-90 transition-transform"
            >
                <ListPlus size={30}/>
            </button>

        </div>
);
}
