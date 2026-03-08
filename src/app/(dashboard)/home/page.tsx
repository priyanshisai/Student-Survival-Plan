"use client";

import {useState,useEffect, useTransition} from "react";
import {useSession} from "next-auth/react";
import {createMoodCheckIn, getTodaysMood} from "@/lib/actions/mood";
import {getTodayLeaderboard, getUserStats} from "@/lib/actions/leaderboard";
import {getTodoStats} from "@/lib/actions/todos";
import TextType from '@/components/active/TextType';
import Grainient from "@/components/active/Grainient";
import {moods} from "@/constants/moods";
import {helpOptions} from "@/constants/helpOptions";

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

    useEffect(()=>{
        loadData();
    },[]);


const handleMoodSubmit = async () => {
    if (!selectedMood || alreadyCheckedIn) return;

    startTransition(async () => {
        try {
            await createMoodCheckIn(selectedMood, moodNote || undefined);
            setShowMoodSuccess(true);
            setAlreadyCheckedIn(true);
            setMoodNote("");
            loadData(); // Refresh stats
            setTimeout(() => setShowMoodSuccess(false), 6000);
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

const userName = session?.user?.name?.split(" ")[0] || "Student";
const fullGreeting = `${greeting()}, ${userName} !
 Have a good day!! `;


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
        <div className="md:m-10 m-3 relative z-10 md:p-10 p-4
            border-1 border-gray-400 rounded-3xl bg-gray-700/30
            animate-float mb-20">

            {/* Header */}
            <div className="mb-8 mt-5">

                {/* Greeting */}
                <h1 className="text-xl font-bold text-white flex items-center min-h-[4rem]">
                    <TextType
                        text={[fullGreeting]}
                        typingSpeed={170}
                        loop={false}
                        pauseDuration={2300}
                        showCursor
                        cursorCharacter="_"
                        texts={["Welcome to React Bits! Good to see you!", "Build some amazing experiences!"]}
                        deletingSpeed={100}
                        variableSpeedEnabled
                        variableSpeedMin={90}
                        variableSpeedMax={185}
                        cursorBlinkDuration={0.5}
                    />
                </h1>
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
                                <div className="flex justify-center mb-2">
                                    {moods.find(m => m.label === selectedMood)?.visual || "🌟"}
                                </div>
                                <p className="text-2xl mb-2">{selectedMood}</p>
                                <p>{showMoodSuccess
                                    ? "Thanks for checking in! Take care of yourself! 💚"
                                    : "You've already checked in today! See you tomorrow! "}</p>
                            </div>
                        ) : (
                            <>
                                {/* mood array */}
                                <div className="flex flex-wrap gap-3 mb-4 justify-between">
                                    {moods.map((mood) => (
                                        <button
                                            key={mood.label}
                                            onClick={() => setSelectedMood(mood.label)}
                                            className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                                                selectedMood === mood.label
                                                    ? "bg-indigo-100 border-2 border-indigo-500 scale-105"
                                                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                                            }`}
                                        >
                                            <div className="w-8 h-8 flex items-center justify-center">
                                                {mood.visual}</div>
                                            <span className="text-xs text-gray-600 mt-1">{mood.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* text box */}
                                <textarea
                                    value={moodNote}
                                    onChange={(e) => setMoodNote(e.target.value)}
                                    placeholder="Want to share what's on your mind?"
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
                                    rows={1}
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
                    <div className="bg-gray-800/90 rounded-2xl p-6 shadow-sm ">
                        <h2 className="text-xl font-semibold text-gray-200 mb-4">
                            Need Help?
                        </h2>
                        <div className=" grid  grid-cols-4 sm:grid-cols-4 lg:grid-cols-2 gap-4 ">
                            {helpOptions.map((option) => {
                                const Icon = option.icon;
                                return (
                                    <button
                                        key={option.id}
                                        className={`${option.color} p-4 rounded-xl text-white text-left hover:opacity-90 transition-opacity `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={29}></Icon>
                                            <div className="hidden sm:block">
                                                <h3 className="font-semibold ">{option.title}</h3>
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
                            Most Productive Today
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

                    {/* Quick Stats { Your Progress }*/}
                    <div className="bg-gray-700/70 rounded-2xl p-6 text-white">
                        <h3 className="font-semibold mb-4">Your Progress</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="opacity-90">Tasks Done Today</span>
                                <span className="font-bold">{todoStats.completed}/{todoStats.total}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="opacity-90">Streak</span>
                                <span className="font-bold"> {userStats?.streak || 0} days</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="opacity-90">Points Earned</span>
                                <span className="font-bold">+{userStats?.todayPoints || 0} pts</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
);
}