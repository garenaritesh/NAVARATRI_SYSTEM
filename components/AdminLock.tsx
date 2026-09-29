"use client";

import { useEffect, useState } from "react";

type Props = {
    children: React.ReactNode;
};

export default function AdminLock({ children }: Props) {
    const [pin, setPin] = useState("");
    const [unlocked, setUnlocked] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const savedAccess = localStorage.getItem(
            "sumandham_admin_access"
        );

        if (savedAccess === "true") {
            setUnlocked(true);
        }

        setChecking(false);
    }, []);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (pin === "1818") {
            localStorage.setItem(
                "sumandham_admin_access",
                "true"
            );

            setUnlocked(true);
            setError("");
        } else {
            setError("Incorrect PIN");
            setPin("");
        }
    }

    // Browser localStorage check hone tak
    if (checking) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="text-sm font-medium text-white">
                    Loading...
                </div>
            </main>
        );
    }

    // Already verified
    if (unlocked) {
        return <>{children}</>;
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">

                <div className="mb-6 text-center">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-black text-white">
                        SN
                    </div>

                    <h1 className="mt-5 text-2xl font-bold text-slate-900">
                        SUMANDHAM SOCIETY
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Enter admin PIN to continue
                    </p>

                </div>

                <form onSubmit={handleSubmit}>

                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        autoFocus
                        value={pin}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");

                            setPin(value);
                            setError("");
                        }}
                        placeholder="••••"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                    />

                    {error && (
                        <p className="mt-3 text-center text-sm font-semibold text-red-500">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={pin.length !== 4}
                        className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Unlock Dashboard
                    </button>

                </form>

                <p className="mt-5 text-center text-xs text-slate-400">
                    Admin Access
                </p>

            </div>
        </main>
    );
}