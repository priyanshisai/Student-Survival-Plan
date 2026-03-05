"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {signOut} from "next-auth/react";
import {useState} from "react";
import {LogOut,CircleQuestionMark,Snail,ArrowLeft,ArrowRight, } from "lucide-react";
import {navItems} from "@/constants/navigation";

export default function Sidebar() {
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (

        /* size of sidebar when collapsed */
        <aside
            className={`${
                isCollapsed ? "min-w-12" : "w-9%"
            } hidden lg:flex bg-black/87 min-h-screen p-4 flex flex-col transition-all duration-300`}
        >

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                {/* {!isCollapsed && (
                    <h1 className="text-xl font-bold text-white">
                        Student<span className="text-blue-700">Survival</span>
                    </h1>
                )} */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="text-white hover:bg-white/10 p-2 rounded-lg "
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
                                            ? "border-1 border-blue-400 text-blue-400 font-semibold"
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
                <div className="bg-gray-200 rounded-lg w-2/3">
                <button
                    onClick={() => signOut({callbackUrl: "/login"})}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 text-lg hover:bg-red-500/20 transition-all w-full ${
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

export function MobileNav(){
    const pathname = usePathname();
    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-white/10 px-6 py-3 z-50 bg-[oklch(27.5%_0.011_216.9)]">
            <ul className="flex justify-between items-center list-none">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return(
                        <li key={item.name}>
                    <Link href={item.href} className="flex flex-col items-center gap-1">
                            <Icon className={`size-6 ${isActive? "border-1 border-blue-400 text-blue-400 font-semibold"
                                : "text-white hover:bg-white/10"}`} />
                    <span className={`text-[10px] ${isActive ? "text-white font-bold" : "text-gray-400"}`}>
                        {item.name}
                    </span>
                    </Link>
                </li>
                );
            })}
            </ul>
        </nav>
    );
};
