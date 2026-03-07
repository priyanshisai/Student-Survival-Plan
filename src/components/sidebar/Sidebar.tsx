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

        <aside
            className={`${
                isCollapsed ? "min-w-10" : "w-[14%]"
            } hidden lg:flex bg-black/87 min-h-screen p-4 flex flex-col transition-all duration-300`}
        >

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                {/* Arrow button */}
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
                        className="w-full px-4 py-1 text-sm rounded-lg bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-blue-400"
                    />
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1">
                <ul className="space-y-2 list-none">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <li key={item.name} >
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                        isActive
                                            ? "border-1 border-blue-400 text-blue-400 font-semibold"
                                            : "text-white hover:bg-white/10"
                                    }`}
                                >
                                    <Icon className="text-xl size-4"></Icon>
                                    {!isCollapsed && <span className="text-sm">{item.name}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom Actions */}
            <div className="mt-auto space-y-2 ">
                {!isCollapsed && (
                    <>
                        <Link
                            href="/query z-50"
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-white hover:bg-white/10 transition-all"
                        >
                            <CircleQuestionMark size={17}></CircleQuestionMark>
                            <span className="text-sm">Raise a Query</span>
                        </Link>
                        <Link
                            href="/community"
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-white hover:bg-white/10 transition-all"
                        >
                            <Snail size={17}></Snail>
                            <span className="text-sm ">Join Community</span>
                        </Link>
                    </>
                )}

                {/* Log Out */}
                <div className="bg-gray-200 rounded-lg w-2/3 justify-center items-center w-full">
                <button
                    onClick={() => signOut({callbackUrl: "/login"})}
                    className={`flex items-center gap-3 px-2 py-2 rounded-xl text-red-500 text-lg hover:bg-red-500/20 justify-center items-center transition-all w-full ${
                        isCollapsed ? "justify-center" : ""
                    }`}
                >
                    <LogOut size={17}/>
                    {!isCollapsed && <span className="text-sm">Logout</span>}
                </button>
                </div>
            </div>
        </aside>
    );
}

{/* Mobile Nav Bar*/}
export function MobileNav(){
    const pathname = usePathname();
    return (
        <nav className="lg:hidden fixed -bottom-[1px] left-0 right-0   border-white/10 px-6 py-4 z-50 bg-[oklch(27.5%_0.011_216.9)]">
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
