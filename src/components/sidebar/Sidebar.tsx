"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {signOut} from "next-auth/react";
import {useState} from "react";
import {LayoutDashboard, CheckCircle, Users, Map,UserCog,LogOut,CircleQuestionMark,Snail,ArrowLeft,ArrowRight, } from "lucide-react";

const navItems = [
    {name: "Home", href: "/home", icon: LayoutDashboard},
    {name: "Checklist", href: "/checklist", icon: CheckCircle},
    {name: "Community", href: "/community", icon: Users},
    {name: "Explore", href: "/explore", icon: Map},
    {name: "Profile", href: "/profile", icon: UserCog},
];

export default function Sidebar() {
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (

        /* size of sidebar when collapsed */
        <aside
            className={`${
                isCollapsed ? "min-w-12" : "w-9%"
            } bg-gradient-to-br from-gray-950 via-teal-950 to-gray-800 min-h-screen p-4 flex flex-col transition-all duration-300`}
        >

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                {!isCollapsed && (
                    <h1 className="text-xl font-bold text-white">
                        Student<span className="text-blue-700">Survival</span>
                    </h1>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="text-white hover:bg-white/10 p-2 rounded-lg"
                >
                    {isCollapsed ? <ArrowRight/> : <ArrowLeft/>}
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
                        const Icon = item.icon;

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

                                    <Icon className="text-xl size-5"></Icon>
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
                            <CircleQuestionMark className="text-xl"></CircleQuestionMark>
                            <span>Raise a Query</span>
                        </Link>
                        <Link
                            href="/community"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-all"
                        >
                            <Snail className="text-xl"></Snail>
                            <span>Join Community</span>
                        </Link>
                    </>
                )}
                <div className="bg-white rounded-lg">
                <button
                    onClick={() => signOut({callbackUrl: "/login"})}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 text-xl hover:bg-red-500/20 transition-all w-full ${
                        isCollapsed ? "justify-center" : ""
                    }`}
                >
                    <LogOut className={`size-5`}/>
                    {!isCollapsed && <span>Logout</span>}
                </button>
                </div>
            </div>
        </aside>
    );
}
