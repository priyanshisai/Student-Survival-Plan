"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

const navItems = [
  { name: "Home", href: "/home", icon: "🏠" },
  { name: "Checklist", href: "/checklist", icon: "✅" },
  { name: "Community", href: "/community", icon: "👥" },
  { name: "Explore", href: "/explore", icon: "🗺️" },
  { name: "Profile", href: "/profile", icon: "👤" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-gradient-to-b from-indigo-900 to-purple-900 min-h-screen p-4 flex flex-col transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-white">
            Student<span className="text-yellow-400">Survival</span>
          </h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-white hover:bg-white/10 p-2 rounded-lg"
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      {/* Search Box */}
      {!isCollapsed && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-yellow-400"
          />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-yellow-400 text-indigo-900 font-semibold"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto space-y-2">
        {!isCollapsed && (
          <>
            <Link
              href="/query"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-all"
            >
              <span className="text-xl">❓</span>
              <span>Raise a Query</span>
            </Link>
            <Link
              href="/community"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-all"
            >
              <span className="text-xl">🤝</span>
              <span>Join Community</span>
            </Link>
          </>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-500/20 transition-all w-full ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <span className="text-xl">🚪</span>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
