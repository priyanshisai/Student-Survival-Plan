"use client";

import {useState} from "react";
import {signIn} from "next-auth/react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import DotGrid from "@/components/DotGrid";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        // Validate college email
        if (!email.endsWith("@iiitm.ac.in")) {
            setError("Only @iiitm.ac.in emails are allowed");
            setIsLoading(false);
            return;
        }

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push("/home");
                router.refresh();
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center contents-center justify-center  p-4">
            <div className=" fixed z-0">
                <DotGrid
                    dotSize={5}
                    gap={15}
                    baseColor="#271E37"
                    activeColor="#5227FF"
                    proximity={120}
                    shockRadius={250}
                    shockStrength={5}
                    resistance={750}
                    returnDuration={1.5}
                />
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Welcome Back!
                    </h1>
                    <p className="text-white/70">Sign in to your Student Survival Plan</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div
                            className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-white/80 mb-2"
                        >
                            College Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="yourname@iiitm.ac.in"
                            required
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 transition-colors"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-white/80 mb-2"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                {/*  Forgot Password Section */}
                <div className={`flex flex-row gap-2`}>
                    <div className="flex h-10  w-1/2 "></div>
                    <div className="flex flex-row w-1/12 max"></div>
                    <div className="flex  items-center py-5 left-2">
                        <Link
                        href="/forgot-password"
                        className={`text-white/60 text-sm hover:underline`}>
                            Forgot Password ?
                        </Link>
                    </div>

                </div>

                <p className="text-center text-white/60 mt-6">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-yellow-400 hover:underline">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
}
