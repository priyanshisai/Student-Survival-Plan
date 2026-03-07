"use client";

import { useState } from "react";
import Grainient from "@/components/active/Grainient";
import {Building2,Trophy,Library,Rocket,X,MapPinPlus,UserRoundPlus } from "lucide-react";

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  members: number;
  tags: string[];
}

interface CampusSpot {
  id: string;
  name: string;
  isOpen: boolean;
  type: string;
}

{/*Mock data */}
const studyGroups: StudyGroup[] = [
  { id: "1", name: "DSA Warriors", description: "Crack coding interviews together!", members: 45, tags: ["DSA", "Coding", "Interviews"] },
  { id: "2", name: "ML Enthusiasts", description: "Explore machine learning projects", members: 32, tags: ["ML", "AI", "Python"] },
  { id: "3", name: "Web Dev Squad", description: "Build awesome web apps", members: 28, tags: ["React", "Next.js", "Web"] },
  { id: "4", name: "CP Grinders", description: "Competitive programming practice", members: 56, tags: ["CP", "Codeforces", "LeetCode"] },
];

const campusSpots: CampusSpot[] = [
  { id: "1", name: "Nescafe", isOpen: true, type: "cafe" },
  { id: "2", name: "Cafeteria", isOpen: true, type: "cafeteria" },
  { id: "3", name: "OAT", isOpen: false, type: "venue" },
  { id: "4", name: "LRC", isOpen: true, type: "study" },
  { id: "5", name: "Sports Complex", isOpen: false, type: "sports" },
  { id: "6", name: "Fruit Shop", isOpen: false, type: "shop" },
  { id: "7", name: "Stationary", isOpen: false, type: "shop" },
];

const leaderboardData = [
  { rank: 1, name: "Rahul Sharma", points: 2450, avatar: "🥇", badge: "Code Ninja" },
  { rank: 2, name: "Priya Kapoor", points: 2380, avatar: "🥈", badge: "Study Master" },
  { rank: 3, name: "Amit Mishra", points: 2120, avatar: "🥉", badge: "Helper Pro" },
  { rank: 4, name: "Sneha Roy", points: 1890, avatar: "4️⃣", badge: "Rising Star" },
  { rank: 5, name: "Vikram Jain", points: 1750, avatar: "5️⃣", badge: "Consistent" },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"groups" | "leaderboard" | "spots">("groups");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = studyGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const [showBanner, setShowBanner] = useState(true);

  const toggleBanner = () => {
    setShowBanner(prev => !prev);
  };
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

        <main className="flex-1 pb-24">
    {/* Floating section (main) */}
    <div className="md:m-10 m-3 relative z-10 md:p-10 p-4
            border-1 border-gray-400 rounded-3xl bg-gray-700/30
            animate-float mb-20">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl invisible md:block font-bold text-white">Our Community </h1>
        <p className="text-gray-200/70 mt-1">Connect, collaborate, and grow together!</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { id: "groups", label: "Your People", icon: Rocket},
          { id: "leaderboard", label: "Leaderboard", icon: Trophy },
          { id: "spots", label: "Is it Open?", icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
              <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === tab.id
                          ? "border-indigo-600 text-indigo-600"
                          : "border-transparent text-gray-300 hover:text-gray-700"
                  }`}
              >
                <Icon />
                <span className="hidden md:block ">{tab.label}
                </span>
              </button>
          );
        })}
      </div>

      {/* Study Groups Tab */}
      {activeTab === "groups" && (
        <div>

          {/* Search & Create */}
          <div className="flex flex-row sm:flex-row gap-4 mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups by name or tag..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-white focus:outline-none focus:border-indigo-500"
            />
            {!showBanner && (
                /* Find Your People Button */
                <button
                    onClick={() => setShowBanner(true)}
                    className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium font-medium flex items-center gap-2"
                >
                  <Rocket size={17} />
                  <span className="hidden md:block "> Find your People
                  </span>
                </button>
            )}
            {/* Create Group */}
            <button className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2">
              <UserRoundPlus size={17}/>
              <span className="hidden md:block ">
                Create Group
              </span>
            </button>
          </div>

          {/* Find Your People Quiz popup*/}
          {showBanner && (
              <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl p-8 mb-8 shadow-lg overflow-hidden">

                {/* Close Button */}
                <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBanner(false);
                    }}
                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-all z-50 cursor-pointer active:scale-90"
                    style={{ pointerEvents: 'auto' }}
                    aria-label="Close banner"
                >
                  <X size={20} className="text-white/80 group-hover:text-white" />
                </button>

                {/* Banner Content */}
                <div className="relative z-10 ">
                  <h2 className="text-xl md:text-md font-bold text-white mb-1.5 flex items-center gap-2">
                    Find Your People !
                  </h2>
                  <p className="text-indigo-100 mb-4 md:mb-3 max-w-md text-sm">
                    Tell us your interests and we'll match you with like-minded students!
                  </p>
                  {/* Take quiz button */}
                  <button className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 shadow-md transition-all active:scale-95">
                    <span className="text-md md:text-sm"> Take Interest Quiz </span>
                  </button>
                </div>

              </div>
          )}

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGroups.map((group) => (
              <div key={group.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-800 text-lg">{group.name}</h3>
                  <span className="text-sm text-gray-500">{group.members} members</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{group.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {group.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="w-full py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium">
                  Join Group
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Community Champions 🏆</h2>
          <div className="space-y-4">
            {leaderboardData.map((user) => (
              <div
                key={user.rank}
                className={`flex items-center gap-4 p-4 rounded-xl ${
                  user.rank <= 3
                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200"
                    : "bg-gray-50"
                }`}
              >
                <span className="text-3xl">{user.avatar}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.badge}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-600">{user.points.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campus Spots Tab {Is OPEN status} */}
      {activeTab === "spots" && (
        <div className="flex justify-center flex-col">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Campus Status 🏫</h2>
            <p className="text-gray-600 mb-4">Real-time status of campus facilities updated by students</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campusSpots.map((spot) => (
                <div
                  key={spot.id}
                  className={`p-4 rounded-xl border-2 ${
                    spot.isOpen
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{spot.name}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        spot.isOpen
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {spot.isOpen ? "OPEN" : "CLOSED"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="self-center px-3 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2">
            <MapPinPlus />
            <span>
              Update a Location Status
            </span>
          </button>
        </div>


      )}
    </div>
        </main>
      </div>
  );
}

