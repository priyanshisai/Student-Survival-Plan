"use client";

import { useState } from "react";
import Grainient from "@/components/active/Grainient";
import {MapPinned, Star, SquarePen,Library,NotebookPen,Pizza,Volleyball,Drama,Store, } from "lucide-react";

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
  { id: "2", name: "Nescafe", type: "food", rating: 4.2, reviews: 89, description: "Great coffee and snacks", explored: true },
  { id: "3", name: "Sports Complex", type: "sports", rating: 4.8, reviews: 156, description: "Place to play if you have equipments", explored: false },
  { id: "4", name: "Cafeteria", type: "food", rating: 4.0, reviews: 45, description: "Ice-cream and beverages", explored: true },
  { id: "5", name: "Open Air Theatre", type: "venue", rating: 4.6, reviews: 78, description: "Perfect for events and shows", explored: false },
  { id: "6", name: "Stationary", type: "store", rating: 4.7, reviews: 34, description: "Only place to get statinoary stuff without instamart or blinkit", explored: false },
];

const blogPosts: BlogPost[] = [
  { id: "1", title: "My First Hackathon Experience", author: "Rahul S.", excerpt: "It was 3 AM and we were still debugging...", likes: 45, date: "2024-02-10" },
  { id: "2", title: "Best Study Spots on Campus", author: "Priya K.", excerpt: "After 3 years, here are my top picks...", likes: 89, date: "2024-02-08" },
  { id: "3", title: "Surviving Mid-Sems: A Guide", author: "Amit M.", excerpt: "Tips and tricks that actually work...", likes: 123, date: "2024-02-05" },
];

const typeIcons: Record<string, any> = {
  study: Library,
  food: Pizza,
  sports: Volleyball,
  venue: Drama,
  store: Store,
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

      {/* Header */}
      <div className="mb-5 flex flex-col md:flex-row  gap-4 ">
        <div className="flex flex-col">
        <h1 className="text-2xl text-white/90">Explore Campus 🗺️</h1>
        <p className="text-gray-400 mt-1">Discover hidden gems and share your experiences!</p>
        </div>


        {/* Exploration Progress Bar */}
        <div className="bg-gray-800/60 rounded-2xl p-4 text-white mb-3 w-full">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-md font-semibold">Area Explored</h2>
              <p className="opacity-80 text-sm">Keep exploring to unlock badges!</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold">{exploredCount}/{locations.length}</span>
              <p className="text-sm opacity-80">locations</p>
            </div>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${explorationProgress}%` }}
            />
          </div>
        </div>
      </div>


      {/* Tabs */}
      <div className="flex flex-row gap-2 mb-4 border-b border-gray-200">
        {[
          { id: "map", label: "Campus Map", icon: MapPinned },
          { id: "best", label: "What's Best?", icon: Star },
          { id: "blog", label: "Student Blogs", icon: SquarePen},
        ].map((tab) => {
          const Icon = tab.icon;
          return (
              <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex flex-row items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === tab.id
                          ? "border-indigo-600 text-indigo-600"
                          : "border-transparent text-white/80 hover:text-gray-700"
                  }`}
              ><Icon size={17}/>
                <span className="hidden md:block "> {tab.label}
            </span>
              </button>
          );
        })}
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
            {Object.entries(typeIcons).map(([type, Icon]) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex flex-row gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === type
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <Icon/>
                <span className="hidden md:block ">{type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              </button>
            ))}
          </div>

          {/* Top Rated Locations */}
          <div className="space-y-4">
            {filteredLocations
              .sort((a, b) => b.rating - a.rating)
              .map((location, index) => {
                const Icon = typeIcons[location.type];
                return (
                    <div key={location.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-indigo-800">#{index + 1}</span>
                        <Icon />
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
                );
              })}
          </div>
        </div>
      )}

      {/* Blog Tab */}
      {activeTab === "blog" && (
        <div >
          {/* Write a blog button */}
          <div className="flex justify-end-safe items-center mb-4">
            <button className=" flex flex-row gap-2 items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
             <NotebookPen size={18} />
              <span > Write a blog </span>
            </button>
          </div>

          <div className="flex md:flex-row flex-col h-full gap-2 justify-between">
            {blogPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl p-3 w-full shadow-sm border border-gray-100">
                <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-lg mb-2">{post.title}</h3>
                <p className="text-gray-600 mb-2 text-md">{post.excerpt}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-gray-500">
                    <span className="text-black/70 text-xs"> ~{post.author}</span>
                    <span className="text-xs text-black/60">{post.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-500">
                    <span>♥️</span>
                    <span>{post.likes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
      </div>
  );
}
