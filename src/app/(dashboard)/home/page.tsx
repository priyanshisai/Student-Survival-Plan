"use client";

import {useState, useEffect, useTransition} from "react";
import {useSession} from "next-auth/react";
import {createMoodCheckIn, getTodaysMood} from "@/lib/actions/mood";
import {getTodayLeaderboard, getUserStats} from "@/lib/actions/leaderboard";
import {getTodoStats} from "@/lib/actions/todos";
import {PackageOpen, CircleQuestionMark, UserStar, BugPlay,} from "lucide-react";
import {redirect} from "next/navigation";

const moods = [
    {emoji: "😊", label: "Great"},
    {emoji: "🙂", label: "Good"},
    {emoji: "😐", label: "Okay"},
    {emoji: "😔", label: "Low"},
    {emoji: "😢", label: "Sad"},
    {emoji: "😤", label: "Stressed"},
];

const helpOptions = [
    {
        id: "item",
        title: "Request an Item",
        icon: PackageOpen,
        description: "Need something? Ask the community!",
        color: "bg-[oklch(45%_0.085_224.283)]",
    },
    {
        id: "wtf",
        title: "WTF is this?",
        icon: CircleQuestionMark,
        description: "Confused about something? Get answers!",
        color: "bg-[oklch(25.7%_0.09_281.288)]",
    },
    {
        id: "prof",
        title: "How's this Prof?",
        icon: UserStar,
        description: "Get reviews about professors",
        color: "bg-[oklch(37.8%_0.077_168.94)]",
    },
    {
        id: "advice",
        title: "Need some Advice!",
        icon: BugPlay,
        description: "Seek guidance from seniors",
        color: "bg-[oklch(66.6%_0.179_58.138)]",
    },
];

interface LeaderboardUser {
    rank: number;
    name: string;
    points: number;
    userId: string;
}

export default function HomePage() {
    const {data: session} = useSession();

    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [moodNote, setMoodNote] = useState("");
    const [showMoodSuccess, setShowMoodSuccess] = useState(false);
    const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [userStats, setUserStats] = useState<{
        totalPoints: number;
        todayPoints: number;
        tasksCompleted: number;
        streak: number
    } | null>(null);
    const [todoStats, setTodoStats] = useState<{ completed: number; total: number }>({completed: 0, total: 0});
    const [isPending, startTransition] = useTransition();


    const loadData = async () => {
        try {
            const [todaysMood, leaderboardData, stats, todos] = await Promise.all([
                getTodaysMood(),
                getTodayLeaderboard(5),
                getUserStats(),
                getTodoStats(),
            ]);

            if (todaysMood) {
                setAlreadyCheckedIn(true);
                setSelectedMood(todaysMood.emoji);
            }

            setLeaderboard(leaderboardData);
            setUserStats(stats);
            setTodoStats(todos);
        } catch (error) {
            console.error("Failed to load data:", error);
        }
    };

    const handleMoodSubmit = async () => {
        if (!selectedMood || alreadyCheckedIn) return;

        startTransition(async () => {
            try {
                await createMoodCheckIn(selectedMood, moodNote || undefined);
                setShowMoodSuccess(true);
                setAlreadyCheckedIn(true);
                setMoodNote("");
                loadData(); // Refresh stats
                setTimeout(() => setShowMoodSuccess(false), 3000);
            } catch (error) {
                console.error("Failed to submit mood:", error);
            }
        });
    };

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };


    if (status === "loading"){
        return <div>Loading...</div>;
    }

    return (


        <div className="p-6 w-full-screen min-h-screen z-0 bg-gradient-to-br from-gray-950 via-teal-950 to-gray-800">
            <div className=" z-0">

                {/* Header */}
                <div className="mb-8 mt-5">
                    <h1 className="text-3xl font-bold text-white">
                        {greeting()}, {session?.user?.name?.split(" ")[0] || "Student"}! 👋
                    </h1>
                    <p className="text-white mt-1">How&apos;s your survival journey going today?</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column - Mood & Help */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Mood Check-in Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                How are you feeling today?
                            </h2>

                            {showMoodSuccess || alreadyCheckedIn ? (
                                <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center">
                                    <p className="text-2xl mb-2">{selectedMood}</p>
                                    <p>{showMoodSuccess ? "Thanks for checking in! Take care of yourself! 💚" : "You've already checked in today! See you tomorrow! 🌟"}</p>
                                </div>
                            ) : (
                                <>
                                    {/* mood array */}
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        {moods.map((mood) => (
                                            <button
                                                key={mood.emoji}
                                                onClick={() => setSelectedMood(mood.emoji)}
                                                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                                                    selectedMood === mood.emoji
                                                        ? "bg-indigo-100 border-2 border-indigo-500 scale-105"
                                                        : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                                                }`}
                                            >
                                                <span className="text-3xl">{mood.emoji}</span>
                                                <span className="text-xs text-gray-600 mt-1">{mood.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* text box */}
                                    <textarea
                                        value={moodNote}
                                        onChange={(e) => setMoodNote(e.target.value)}
                                        placeholder="Want to share what's on your mind? (optional)"
                                        className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
                                        rows={2}
                                    />

                                    <button
                                        onClick={handleMoodSubmit}
                                        disabled={!selectedMood || isPending}
                                        className="mt-3 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isPending ? "Checking in..." : "Check In"}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Need Help Section */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                Need Help?
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                {helpOptions.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <button
                                            key={option.id}
                                            className={`${option.color} p-4 rounded-xl text-white text-left hover:opacity-90 transition-opacity`}
                                        >

                                            <div className="flex items-center gap-3">
                                                <Icon size={32}></Icon>
                                                <div>
                                                    <h3 className="font-semibold">{option.title}</h3>
                                                    <p className="text-sm opacity-90">{option.description}</p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Leaderboard */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                Most Productive Today 🏆
                            </h2>
                            <div className="space-y-3">
                                {leaderboard.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No activity yet today. Be the
                                        first!</p>
                                ) : (
                                    leaderboard.map((user) => (
                                        <div
                                            key={user.userId}
                                            className={`flex items-center gap-3 p-3 rounded-lg ${
                                                user.rank <= 3 ? "bg-gradient-to-r from-yellow-50 to-orange-50" : "bg-gray-50"
                                            }`}
                                        >
                    <span className="text-2xl">
                      {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : user.rank === 3 ? "🥉" : `${user.rank}️⃣`}
                    </span>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800">{user.name}</p>
                                                <p className="text-sm text-gray-500">{user.points} points</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <button
                                className="w-full mt-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium">
                                View Full Leaderboard →
                            </button>
                        </div>

                        {/* Quick Stats {Your Progress }*/}
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                            <h3 className="font-semibold mb-4">Your Progress</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="opacity-80">Tasks Done Today</span>
                                    <span className="font-bold">{todoStats.completed}/{todoStats.total}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-80">Streak</span>
                                    <span className="font-bold">🔥 {userStats?.streak || 0} days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-80">Points Earned</span>
                                    <span className="font-bold">+{userStats?.todayPoints || 0} pts</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
        ;
}
