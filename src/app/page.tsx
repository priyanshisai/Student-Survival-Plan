import Link from "next/link";

import LightRays from "@/components/active/LightRays";
import {LayoutDashboard, CheckCircle, Users, Map,Heart, Menu } from "lucide-react";

export default function Home() {

    // features array //
    const features = [
        {
            icon: LayoutDashboard,
            title: "Home Dashboard",
            description: "Daily mood checkins, help requests and leaderboard",
        },
        {
            icon: CheckCircle,
            title: "Smart Checklist",
            description: "Track health, study tasks, reminders and skills",
        },
        {
            icon: Users,
            title: "Community",
            description: "Find your people, join study groups and connect",
        },
        {
            icon: Map,
            title: "Explore Campus",
            description: "Discover spots, ratings & student blogs",
        }
    ]

    return (
        <div className="flex-1 w-full transition-all duration-300 min-h-screen bg-gradient-to-br from-black via-teal-950 to-gray-800">

            {/* Background LightRays */}
            <div className="fixed inset-0 z-0 h-full w-full overflow-hidden pointer-events-none">
                <LightRays
                    raysOrigin="top-center-offset"
                    raysColor="#5dfeca"
                    raysSpeed={0.5}
                    lightSpread={0.9}
                    rayLength={1.4}
                    followMouse={true}
                    mouseInfluence={0.02}
                    noiseAmount={0}
                    distortion={0.01}
                    pulsating={false}
                    fadeDistance={1}
                    saturation={1}
                />
            </div>

            {/* Header : Login and get started button link */}
            <div className=" mx-auto px-4 py-16 relative z-10">
                <nav className="flex justify-between items-center mb-16 w-full px-4 py-4">
                    <h1 className="md:text-2xl text-base font-bold text-white whitespace-nowrap">
                        Student<span className="text-blue-700">Survival</span>Plan
                    </h1>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="px-6 py-2 text-white hover:text-yellow-400 transition-colors"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className= "text-sm flex-shrink-0 px-3 py-2 bg-white text-indigo-900 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
                        >
                            Get Started
                        </Link>

                        <div className = " md:hidden">
                            <button className="p-2 text-white">
                                <Menu size={24}/>
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Headline and info */}
                <div className="flex flex-col justify-center items-center text-center max-w-4xl mx-auto z-2">
                    <h2 className="text-4xl md:text-7xl font-bold text-white mb-7">
                        Your Ultimate
                        <span className="text-blue-400"> College Survival </span>
                        Companion
                    </h2>
                    <p className="md:whitespace-nowrap text-center text-xl text-white mb-8">
                        Manage tasks, connect with peers, explore campus, track your mood,
                        and ace your college life - all in one place!
                    </p>

                    {/* Center buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="px-8 py-4 bg-white text-indigo-900 rounded-xl font-bold text-lg  hover:bg-gray-300 transition-colors"
                        >
                            Start Your Journey
                        </Link>
                        <Link
                            href="/login"
                            className="px-8 py-4 border-2 border-white/30 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
                        >
                            I Have an Account
                        </Link>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
                    {features.map((feature) => {
                        // 2. Assign the icon to a capitalized variable
                        const Icon = feature.icon;

                        return (
                            <div
                                key={feature.title}
                                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors"
                            >
                                <Icon className="w-10 h-10 text-blue-400" strokeWidth={1.5} />

                                <h3 className="text-xl font-semibold text-white mt-4 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-white/70">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>

                {/* CTA Section */}
                <div className="mt-20 text-center">
                    <div
                        className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-2xl mx-auto">
                        <h3 className="text-2xl font-bold text-white mb-4">
                             For IIITM Students Only
                        </h3>
                        <p className="text-white/80 mb-6">
                            Sign up with your @iiitm.ac.in email to join the exclusive
                            community of students helping each other survive and thrive!
                        </p>
                        <Link
                            href="/register"
                            className="inline-block px-8 py-3 bg-yellow-400 text-indigo-900 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
                        >
                            Join Now - It&apos;s Free!
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className=" flex mt-20 py-8">
                <div className="flex flex-col px-4 text-center text-white/60 w-full">
                    <p className="flex items-center justify-center whitespace-nowrap text-md gap-2">
                        Made with
                        <Heart className="w-4 h-4 text-red-500 inline-block"/>
                        for IIITM Students</p>
                </div>
            </footer>
            <div className="justify-baseline bottom-0 left-0 right-0 h-38 bg-gradient-to-t from-black/80 via-bg-black/30 to-transparent z-1" />
        </div>
    );
}
