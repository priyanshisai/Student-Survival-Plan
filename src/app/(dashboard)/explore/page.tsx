"use client";

import { useState } from "react";

interface Location {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  description: string;
  explored: boolean;
}

interface BlogPost {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  likes: number;
  date: string;
}

// Mock data
const locations: Location[] = [
  { id: "1", name: "Learning Resource Centre", type: "study", rating: 4.5, reviews: 120, description: "Best place for focused study", explored: true },
  { id: "2", name: "Nescafe Corner", type: "food", rating: 4.2, reviews: 89, description: "Great coffee and snacks", explored: true },
  { id: "3", name: "Sports Complex", type: "sports", rating: 4.8, reviews: 156, description: "Modern gym and sports facilities", explored: false },
  { id: "4", name: "Cafeteria", type: "food", rating: 4.0, reviews: 45, description: " XYZ", explored: true },
  { id: "5", name: "Open Air Theatre", type: "venue", rating: 4.6, reviews: 78, description: "Perfect for events and shows", explored: false },
  { id: "6", name: "Stationary", type: "store", rating: 4.7, reviews: 34, description: "Only place to get statinoary stuff without instamart or blinkit", explored: false },
];

const blogPosts: BlogPost[] = [
  { id: "1", title: "My First Hackathon Experience", author: "Rahul S.", excerpt: "It was 3 AM and we were still debugging...", likes: 45, date: "2024-02-10" },
  { id: "2", title: "Best Study Spots on Campus", author: "Priya K.", excerpt: "After 3 years, here are my top picks...", likes: 89, date: "2024-02-08" },
  { id: "3", title: "Surviving Mid-Sems: A Guide", author: "Amit M.", excerpt: "Tips and tricks that actually work...", likes: 123, date: "2024-02-05" },
];

const typeIcons: Record<string, string> = {
  study: "📚",
  food: "🍕",
  sports: "🏀",
  lab: "💻",
  venue: "🎭",
};

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<"map" | "best" | "blog">("map");
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredLocations = selectedType === "all" 
    ? locations 
    : locations.filter(loc => loc.type === selectedType);

  const exploredCount = locations.filter(loc => loc.explored).length;
  const explorationProgress = (exploredCount / locations.length) * 100;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Explore Campus 🗺️</h1>
        <p className="text-gray-600 mt-1">Discover hidden gems and share your experiences!</p>
      </div>

      {/* Exploration Progress */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white mb-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-xl font-semibold">Area Explored</h2>
            <p className="opacity-80">Keep exploring to unlock badges!</p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold">{exploredCount}/{locations.length}</span>
            <p className="text-sm opacity-80">locations</p>
          </div>
        </div>
        <div className="w-full bg-white/30 rounded-full h-3">
          <div 
            className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
            style={{ width: `${explorationProgress}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { id: "map", label: "Campus Map", icon: "🗺️" },
          { id: "best", label: "What's Best?", icon: "⭐" },
          { id: "blog", label: "Student Blogs", icon: "📝" },
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

      {/* Campus Map Tab */}
      {activeTab === "map" && (
        <div>
          {/* Map Placeholder */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center mb-4">
              <div className="text-center">
                <span className="text-6xl">🏫</span>
                <p className="text-gray-500 mt-2">Interactive Campus Map</p>
                <p className="text-sm text-gray-400">Coming soon with real-time locations!</p>
              </div>
            </div>
          </div>

          {/* Location Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <div 
                key={location.id} 
                className={`bg-white rounded-xl p-4 shadow-sm border ${
                  location.explored ? "border-green-200" : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{typeIcons[location.type]}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{location.name}</h3>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm text-gray-600">{location.rating}</span>
                      <span className="text-sm text-gray-400">({location.reviews})</span>
                    </div>
                  </div>
                  {location.explored && (
                    <span className="text-green-500 text-xl">✓</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{location.description}</p>
                <button className="w-full py-2 text-sm border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                  {location.explored ? "View Details" : "Mark as Explored"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What's Best Tab */}
      {activeTab === "best" && (
        <div>
          {/* Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedType("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              All
            </button>
            {Object.entries(typeIcons).map(([type, icon]) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === type
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {icon} {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Top Rated Locations */}
          <div className="space-y-4">
            {filteredLocations
              .sort((a, b) => b.rating - a.rating)
              .map((location, index) => (
                <div key={location.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-indigo-200">#{index + 1}</span>
                    <span className="text-3xl">{typeIcons[location.type]}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">{location.name}</h3>
                      <p className="text-sm text-gray-600">{location.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <span>★</span>
                        <span className="font-bold text-gray-800">{location.rating}</span>
                      </div>
                      <p className="text-sm text-gray-400">{location.reviews} reviews</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Blog Tab */}
      {activeTab === "blog" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Student Stories</h2>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              ✍️ Write a Blog
            </button>
          </div>

          <div className="space-y-4">
            {blogPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 text-lg mb-2">{post.title}</h3>
                <p className="text-gray-600 mb-3">{post.excerpt}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-gray-500">
                    <span>By {post.author}</span>
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-500">
                    <span>❤️</span>
                    <span>{post.likes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
