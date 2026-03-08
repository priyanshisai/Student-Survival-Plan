"use client";

import {useState, useEffect, useTransition,} from "react";
import {useSession} from "next-auth/react";
import {getMoodHistory} from "@/lib/actions/mood";
import {getProfileStats,getDailyRecap,getProfile,} from "@/lib/actions/profile";
import {updateUserBio} from "@/lib/actions/user";
import Grainient from "@/components/active/Grainient";
import LiveDate from "@/components/LiveDate";
import {Camera, UserPen, ChartColumnDecreasing, CalendarDays, NotebookPen, Check, } from "lucide-react";
import {moods} from "@/constants/moods";
import {getUserStats} from "@/lib/actions/leaderboard";
import {getTodoStats} from "@/lib/actions/todos";

interface DayRecap {
    tasksCompleted: number;
    totalTask: number;
    pointsEarned: number;
    timeStudied: string;
    mood?: string;
    activities: any[];
}

const interests = ["Web Development", "Machine Learning", "Photography", "Gaming", "Music"];

const personalBlogs = [
    {id: "1", title: "My Journey into Coding", date: "2024-02-08", views: 156},
    {id: "2", title: "Tips for Campus Placement", date: "2024-01-25", views: 423},
];

export default function ProfilePage() {

    const [moodHistory, setMoodHistory] = useState<any>([]);
    const [todayRecap, setTodayRecap] = useState<DayRecap | null>(null);
    const [loading, setLoading] = useState(true);
    const [todostats, setTodoStats] = useState<{ completed: number; total: number }>({completed: 0, total: 0});

    const [userStats, setUserStats] = useState<{
        totalPoints: number;
        todayPoints: number;
        tasksCompleted: number;
        streak: number;
        badges: number;
    } | null>(null);

    const {data: session} = useSession();
    const [activeTab, setActiveTab] = useState<"about" | "mood" | "recap" | "blogs">("about");
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [bio, setBio] = useState("Passionate about technology and learning new things. Love to help fellow students!");


    // Trigger the fetch when page opens
    useEffect(()=>{
        const syncData = async() => {
            try {
                const [stats, todostats, profile, history, recap] = await Promise.all([
                    getUserStats(),
                    getTodoStats(),
                    getProfile(),
                    getMoodHistory(),
                    getDailyRecap()
                ]);
                setUserStats(stats);
                setTodoStats(todostats);
                setMoodHistory(history || []);
                setTodayRecap(recap);

                if (profile?.bio) {
                    setBio(profile.bio)
                }
            }
            catch(error){
                console.error("Failed to sync profile data: ", error);
            }
            finally{
                setLoading(false);
            }
        };
        syncData();
    },[]);

    const handleSaveBio = async () => {
        startTransition(async () => {
            try {
                await updateUserBio(bio);
                setIsEditing(false);
            }
            catch(error){
                console.error("Failed to update bio: ", error);
            }
        });
    };


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
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">

                <div className="flex flex-col sm:flex-row items-center gap-6 ">

                    {/* Profile Picture */}
                    <div className="relative">
                        <div
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-3xl text-white font-bold">
                            {session?.user?.name?.charAt(0) || "S"}
                        </div>

                        {/*Change profile button*/}
                        <button
                            className="absolute bottom-0 right-0 w-8 h-8 bg-gray-800/85 rounded-full flex items-center justify-center text-white text-sm hover:bg-indigo-700">
                            <Camera size={16}/>
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-xl font-bold text-gray-800">
                            {session?.user?.name || "Student"}
                        </h1>

                        <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-2">
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
                            <p className="text-xl font-bold text-indigo-600">
                                {userStats?.totalPoints || 0}
                            </p>
                            <p className="text-sm text-gray-500">Points</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-indigo-600">
                                {userStats?.tasksCompleted || 0}
                            </p>
                            <p className="text-sm text-gray-500">Tasks done</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-indigo-600">
                                {userStats?.badges || 0}
                            </p>
                            <p className="text-sm text-gray-500"> Badges</p>
                        </div>
                    </div>
                </div>

                {/* Interests */}
                <div className="flex flex-col bg-white rounded-2xl p-3 shadow-sm border border-gray-100 mt-4">
                    <div className="flex justify-between items-center mb-2 md:mb-4">
                        <h2 className="text-md font-semibold text-gray-800">Interests</h2>
                        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                            + Add
                        </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {interests.map((interest) => (
                            <span
                                key={interest}
                                className="md:px-4 md:py-2 md:bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                            >
                            <span className="md:hidden ">•</span>{interest}
                </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200">
                {[
                    {id: "about", label: "About", icon: UserPen},
                    {id: "mood", label: "Mood History", icon: ChartColumnDecreasing},
                    {id: "recap", label: "Your Day", icon: CalendarDays},
                    {id: "blogs", label: "My Blogs", icon: NotebookPen},
                ].map((tab) => {
                    const Icon = tab.icon;
                    return(
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex flex-row gap-2 items-center px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
                            activeTab === tab.id
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent text-white hover:text-gray-400"
                        }`}
                    >
                    <Icon size={18}/>
                        <span className="text-sm hidden md:block"> {tab.label} </span>
                    </button>
                );})}
            </div>

            {/* About Tab */}
            {activeTab === "about" && (
                <div className="space-y-6">

                    {/* Bio */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">About Me</h2>

                            {/*Edit & Save Bio */}
                            <button
                                onClick={isEditing ? handleSaveBio : () => setIsEditing(true)}
                                disabled={isPending}
                                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                            >
                                {isPending? "Saving..." : isEditing ? "Save" : "Edit"}
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
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Emoji Check-ins</h2>

                            {/* Top Week View (7-Day Grid) */}
                            <div className="grid grid-cols-7 gap-2 mb-6">
                                {moodHistory.slice(0, 7).reverse().map((entry, index) => {
                                    const moodData = moods.find(m => m.label === entry.emoji) || moods[4];

                                    return (
                                        <div
                                            key={index}
                                            className="p-2 text-center flex flex-row bg-gray-50 rounded-xl border border-gray-100 hover:bg-indigo-50 transition-all cursor-pointer group"
                                        >
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">
                                                {new Date(entry.createdAt).toLocaleDateString("en-IN", { weekday: "short" })}
                                            </p>
                                            <div className="w-5 h-5 mx-auto group-hover:scale-110 transition-transform">
                                                {moodData.visual}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Detailed History List */}
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                {moodHistory.map((entry, index) => {
                                    const moodData = moods.find(m => m.label === entry.emoji) || moods[4];
                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:shadow-sm transition-shadow border border-transparent hover:border-gray-100"
                                        >
                                            <div className="w-10 h-10 flex-shrink-0">
                                                {moodData.visual}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800 text-sm">
                                                    {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                                                        weekday: "long",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </p>
                                                {entry.note && (
                                                    <p className="text-xs text-gray-500 line-clamp-1">{entry.note}</p>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">
                            {moodData.label}
                        </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

            {/* Daily Recap Tab */}
            {activeTab === "recap" && (

                <div className="space-y-5">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">

                        {/*Today's recap, date & time */}
                        <div className="flex flex-row items-center justify-between ">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-semibold mb-3"> Today&apos;s Recap </h2>
                                { /* <div className="flex gap-2 ">
                                    <span >{moods.find(m => m.label === todayRecap?.mood)?.visual}
                                    </span>
                                </div>
                                */}
                            </div>
                            <span className="flex items-center text-right">
                        <LiveDate />
                        </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                            {/*Tasks Done */}
                            <div className="bg-white/20 rounded-xl p-2 text-center">
                                <p className="text-xl font-bold">
                                    {todayRecap?.tasksCompleted || 0}/{todayRecap?.totalTasks || 0 }
                                </p>
                                <p className="text-sm opacity-80">Tasks Done</p>
                            </div>
                            {/*Today's points */}
                            <div className="bg-white/20 rounded-xl p-2 text-center">
                                <p className="text-xl font-bold">+{todayRecap?.pointsEarned || 0 }</p>
                                <p className="text-sm opacity-80">Points</p>
                            </div>
                            {/*Study Time */}
                            <div className="bg-white/20 rounded-xl p-2 text-center">
                                <p className="text-xl font-bold">{todayRecap?.timeStudied || 0 }</p>
                                <p className="text-sm opacity-80">Study Time</p>
                            </div>
                            {/*Productivity Streak */}
                            <div className="bg-white/20 rounded-xl p-2 text-center">
                                <p className="text-xl font-bold">🔥{productivityStreak} Day</p>
                                <p className="text-sm opacity-80"> Streak</p>
                            </div>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-4">Activity Timeline</h3>
                        <div className="space-y-4">
                            {todayRecap?.activities && todayRecap?.activities.length > 0 ? (
                                todayRecap?.activities.map((activity, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <span className="text-sm text-gray-400 w-20">
                                        {new Date(activity.time).toLocaleTimeString([],{ hour: '2-digit', minute: '2-digit'})}
                                    </span>
                                    <span className="text-xl">{activity.completed? <Check/> : <NotebookPen/>}</span>
                                    <span className="text-gray-700">{activity.title}</span>
                                </div>
                            ))
                            ):(
                                <p className="text-gray-500 text-sm italic">No activity recorded yet for today.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* My Blogs Tab */}
            {activeTab === "blogs" && (
                <div>
                    {/* Heading */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-200">Personal Blogs</h2>
                        {/*Write a blog button */}

                        <button
                            className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
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
                                        <h3 className="font-semibold text-gray-800 text-sm">{blog.title}</h3>
                                        <p className="text-xs text-gray-500">
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
