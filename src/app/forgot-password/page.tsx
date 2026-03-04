"use client"
import React from "react";

export default function ForgotPasswordPage() {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("If an account exists, a reset link has been sent!");
    };
    return (
        <main className={`flex-center min-h-screen`}>
            <div className={` flex flex-col p-8 w-full max-w-md glass gap-6`}>
                <h1>Reset Password</h1>
                <p className={`text-light-100`}>Enter your email and we'll send you a link to get back into your account.</p>

                <form onSubmit={handleSubmit} className={`flex flex-col gap-2`}>
                        <input
                        type="email"
                        placeholder="Email Address"
                        className={`bg-dark px-5 py-2.5 text-white rounded-[6px]`}
                        required />
                        <button type={`submit`} className={`bg-primary px-4 py-2.5 rounded-[6px] font-semibold text-black`} >Send Reset Link</button>
                </form>
            </div>
        </main>
    )
}