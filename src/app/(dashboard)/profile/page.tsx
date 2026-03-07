"use client";

import {useState} from "react";
import {useSession} from "next-auth/react";
import {GridScan} from "@/components/active/GridScan";
import Grainient from "@/components/active/Grainient";

interface MoodEntry {
    date: string;
    emoji: string;
    note?: string;
}

interface DayRecap {
    tasksCompleted: number;
    totalTasks: number;
    pointsEarned: number;
    timeStudied: string;
}

// Mock data
const moodHistory: MoodEntry[] = [
    {date: "2024-02-10", emoji: "😊", note: "Great day!"},
    {date: "2024-02-09", emoji: "🙂"},
    {date: "2024-02-08", emoji: "😤", note: "Assignment stress"},
    {date: "2024-02-07", emoji: "😊"},
    {date: "2024-02-06", emoji: "😐"},
    {date: "2024-02-05", emoji: "😊", note: "Aced the quiz!"},
    {date: "2024-02-04", emoji: "🙂"},
];

const todayRecap: DayRecap = {
    tasksCompleted: 5,
    totalTasks: 8,
    pointsEarned: 75,
    timeStudied: "4h 30m",
};

const interests = ["Web Development", "Machine Learning", "Photography", "Gaming", "Music"];

const personalBlogs = [
    {id: "1", title: "My Journey into Coding", date: "2024-02-08", views: 156},
    {id: "2", title: "Tips for Campus Placement", date: "2024-01-25", views: 423},
];

export default function ProfilePage() {
    const {data: session} = useSession();
    const [activeTab, setActiveTab] = useState<"about" | "mood" | "recap" | "blogs">("about");
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState("Passionate about technology and learning new things. Love to help fellow students!");

    const productivityStreak = 12; // days

    return (
        <div className="relative overflow-x-hidden w-full min-h-screen z-0 bg-black/80 flex flex-col">
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

            {/* Profile Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Profile Picture */}
                    <div className="relative">
                        <div
                            className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-4xl text-white font-bold">
                            {session?.user?.name?.charAt(0) || "S"}
                        </div>
                        <button
                            className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm hover:bg-indigo-700">
                            📷
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {session?.user?.name || "Student"}
                        </h1>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-3">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                🔥 {productivityStreak} day streak
              </span>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                🏆 Top 10%
              </span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 text-center">
                        <div>
                            <p className="text-2xl font-bold text-indigo-600">1,250</p>
                            <p className="text-sm text-gray-500">Points</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">48</p>
                            <p className="text-sm text-gray-500">Tasks Done</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-purple-600">5</p>
                            <p className="text-sm text-gray-500">Badges</p>
                        </div>
                    </div>
                </div>

                {/* Interests */}
                <div className="flex flex-col bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Interests</h2>
                        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                            + Add
                        </button>
                    </div>
                    <div className="flex gap-2">
                        {interests.map((interest) => (
                            <span
                                key={interest}
                                className="px-4 py-2 md:bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                            >
                  {interest},
                </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                {[
                    {id: "about", label: "About", icon: "👤"},
                    {id: "mood", label: "Mood History", icon: "📊"},
                    {id: "recap", label: "Your Day", icon: "📅"},
                    {id: "blogs", label: "My Blogs", icon: "📝"},
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
                            activeTab === tab.id
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* About Tab */}
            {activeTab === "about" && (
                <div className="space-y-6">
                    {/* Bio */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">About Me</h2>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                            >
                                {isEditing ? "Save" : "Edit"}
                            </button>
                        </div>
                        {isEditing ? (
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
                                rows={3}
                            />
                        ) : (
                            <p className="text-gray-600">{bio}</p>
                        )}
                    </div>

                </div>
            )}

            {/* Mood History Tab */}
            {activeTab === "mood" && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Emoji Check-ins</h2>

                    {/* Week View */}
                    <div className="grid grid-cols-7 gap-2 mb-6">
                        {moodHistory.slice(0, 7).reverse().map((entry, index) => (
                            <div
                                key={index}
                                className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                            >
                                <p className="text-xs text-gray-500 mb-1">
                                    {new Date(entry.date).toLocaleDateString("en-US", {weekday: "short"})}
                                </p>
                                <span className="text-2xl">{entry.emoji}</span>
                            </div>
                        ))}
                    </div>

                    {/* Detailed List */}
                    <div className="space-y-3">
                        {moodHistory.map((entry, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                            >
                                <span className="text-3xl">{entry.emoji}</span>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">
                                        {new Date(entry.date).toLocaleDateString("en-US", {
                                            weekday: "long",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </p>
                                    {entry.note && (
                                        <p className="text-sm text-gray-500">{entry.note}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Daily Recap Tab */}
            {activeTab === "recap" && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                        <h2 className="text-xl font-semibold mb-4">Today&apos;s Recap 📅</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/20 rounded-xl p-4 text-center">
                                <p className="text-3xl font-bold">
                                    {todayRecap.tasksCompleted}/{todayRecap.totalTasks}
                                </p>
                                <p className="text-sm opacity-80">Tasks Done</p>
                            </div>
                            <div className="bg-white/20 rounded-xl p-4 text-center">
                                <p className="text-3xl font-bold">+{todayRecap.pointsEarned}</p>
                                <p className="text-sm opacity-80">Points</p>
                            </div>
                            <div className="bg-white/20 rounded-xl p-4 text-center">
                                <p className="text-3xl font-bold">{todayRecap.timeStudied}</p>
                                <p className="text-sm opacity-80">Study Time</p>
                            </div>
                            <div className="bg-white/20 rounded-xl p-4 text-center">
                                <p className="text-3xl font-bold">🔥</p>
                                <p className="text-sm opacity-80">{productivityStreak} Day Streak</p>
                            </div>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-4">Activity Timeline</h3>
                        <div className="space-y-4">
                            {[
                                {time: "09:00 AM", action: "Completed morning check-in", emoji: "☀️"},
                                {time: "10:30 AM", action: "Finished DSA assignment", emoji: "✅"},
                                {time: "02:00 PM", action: "Joined ML Study Group", emoji: "👥"},
                                {time: "04:00 PM", action: "Explored Library", emoji: "📚"},
                                {time: "06:30 PM", action: "Helped 2 students", emoji: "🤝"},
                            ].map((activity, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <span className="text-sm text-gray-400 w-20">{activity.time}</span>
                                    <span className="text-xl">{activity.emoji}</span>
                                    <span className="text-gray-700">{activity.action}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* My Blogs Tab */}
            {activeTab === "blogs" && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-800">Personal Blog</h2>
                        <button
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                            + New Post
                        </button>
                    </div>

                    {personalBlogs.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                            <span className="text-6xl">📝</span>
                            <p className="text-gray-600 mt-4">You haven&apos;t written any blogs yet.</p>
                            <button
                                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                Write Your First Blog
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {personalBlogs.map((blog) => (
                                <div
                                    key={blog.id}
                                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between"
                                >
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{blog.title}</h3>
                                        <p className="text-sm text-gray-500">
                                            {blog.date} • {blog.views} views
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="px-3 py-1 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm">
                                            Edit
                                        </button>
                                        <button className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
        </div>
    );
}
