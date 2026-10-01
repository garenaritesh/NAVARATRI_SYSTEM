"use client";

import { useState } from "react";

type Fund = {
    id: number;
    flat_id: number;
    amount: string | number;
    payment_mode: "cash" | "online";
    note: string | null;
    collected_at: string;
    flat_number: string;
    building: string;
    floor_number: number;
};

export default function AdminPanel() {
    // =========================
    // ADMIN PASSWORD
    // =========================
    const [password, setPassword] = useState("");
    const [authorized, setAuthorized] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    // =========================
    // SEARCH
    // =========================
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<Fund[]>([]);
    const [searching, setSearching] = useState(false);

    // =========================
    // EDIT
    // =========================
    const [editing, setEditing] = useState<Fund | null>(null);
    const [amount, setAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState<
        "cash" | "online"
    >("cash");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    // =========================
    // CLEAR DATA
    // =========================
    const [clearing, setClearing] = useState(false);

    // =========================
    // ADMIN LOGIN
    // =========================
    function unlockAdmin(e: React.FormEvent) {
        e.preventDefault();

        if (password === "2007") {
            setAuthorized(true);
            setPasswordError("");
            return;
        }

        setPasswordError("Incorrect password.");
        setPassword("");
    }

    // =========================
    // SEARCH FUNDS
    // =========================
    async function searchFunds() {
        if (!search.trim()) {
            setResults([]);
            return;
        }

        setSearching(true);

        try {
            const response = await fetch(
                `/api/admin/funds?flat=${encodeURIComponent(
                    search.trim()
                )}`
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Search failed.");
                return;
            }

            setResults(data);
        } catch (error) {
            console.error("SEARCH FUND ERROR:", error);
            alert("Unable to search fund records.");
        } finally {
            setSearching(false);
        }
    }

    // =========================
    // OPEN EDIT
    // =========================
    function openEdit(fund: Fund) {
        setEditing(fund);
        setAmount(String(fund.amount));
        setPaymentMode(fund.payment_mode);
        setNote(fund.note || "");
    }

    // =========================
    // CLOSE EDIT
    // =========================
    function closeEdit() {
        if (saving) return;

        setEditing(null);
        setAmount("");
        setPaymentMode("cash");
        setNote("");
    }

    // =========================
    // SAVE EDIT
    // =========================
    async function saveEdit() {
        if (!editing) return;

        if (!amount || Number(amount) <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch("/api/admin/funds", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pin: "1818",
                    id: editing.id,
                    amount: Number(amount),
                    paymentMode,
                    note,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to update fund.");
                return;
            }

            alert("Fund record updated successfully.");

            closeEdit();

            await searchFunds();
        } catch (error) {
            console.error("UPDATE FUND ERROR:", error);
            alert("Something went wrong.");
        } finally {
            setSaving(false);
        }
    }

    // =========================
    // CLEAR ALL DATA
    // =========================
    async function clearAllData() {
        const confirmed = window.confirm(
            "Are you sure you want to clear ALL Navratri data?\n\nAll fund records and expense records will be permanently deleted."
        );

        if (!confirmed) return;

        setClearing(true);

        try {
            const response = await fetch("/api/admin/clear", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pin: "1818",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to clear data.");
                return;
            }

            alert("All Navratri data cleared successfully.");

            setSearch("");
            setResults([]);

            window.location.reload();
        } catch (error) {
            console.error("CLEAR DATA ERROR:", error);
            alert("Something went wrong.");
        } finally {
            setClearing(false);
        }
    }

    // =========================
    // PASSWORD SCREEN
    // =========================
    if (!authorized) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">

                <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">

                    <div className="text-center">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-black text-white">
                            A
                        </div>

                        <h1 className="mt-5 text-2xl font-bold text-slate-900">
                            Admin Panel
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Enter admin password to continue
                        </p>

                    </div>

                    <form
                        onSubmit={unlockAdmin}
                        className="mt-6"
                    >

                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={password}
                            onChange={(e) => {
                                const value = e.target.value.replace(
                                    /\D/g,
                                    ""
                                );

                                setPassword(value);
                                setPasswordError("");
                            }}
                            placeholder="••••"
                            autoFocus
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                        />

                        {passwordError && (
                            <p className="mt-3 text-center text-sm font-semibold text-red-500">
                                {passwordError}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={password.length !== 4}
                            className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Enter Admin
                        </button>

                    </form>

                    <p className="mt-5 text-center text-xs text-slate-400">
                        SUMANDHAM SOCIETY
                    </p>

                </div>

            </main>
        );
    }

    // =========================
    // ADMIN PANEL
    // =========================
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8">

            <div className="mx-auto max-w-4xl">

                {/* HEADER */}
                <div className="mb-8">

                    <p className="text-sm font-medium text-slate-500">
                        SUMANDHAM SOCIETY
                    </p>

                    <h1 className="mt-1 text-3xl font-bold text-slate-900">
                        Admin Panel
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Manage Navratri fund records
                    </p>

                </div>

                {/* =========================
            CLEAR ALL DATA
        ========================= */}
                <section className="mb-6 rounded-2xl border border-red-200 bg-white p-6 shadow-sm">

                    <div className="flex items-start gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg">
                            🗑️
                        </div>

                        <div className="flex-1">

                            <h2 className="text-lg font-bold text-slate-900">
                                Clear Navratri Data
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Delete all fund and expense records from the system.
                            </p>

                            <p className="mt-2 text-xs font-medium text-red-500">
                                This action cannot be undone.
                            </p>

                            <button
                                type="button"
                                onClick={clearAllData}
                                disabled={clearing}
                                className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {clearing
                                    ? "Clearing..."
                                    : "Clear All Navratri Data"}
                            </button>

                        </div>

                    </div>

                </section>

                {/* =========================
            EDIT FUND
        ========================= */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="mb-5">

                        <div className="flex items-start gap-4">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                                ✏️
                            </div>

                            <div>

                                <h2 className="text-lg font-bold text-slate-900">
                                    Edit Fund Record
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Search by flat number to edit a fund entry.
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* SEARCH */}
                    <div className="flex flex-col gap-3 sm:flex-row">

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    searchFunds();
                                }
                            }}
                            placeholder="Enter flat number e.g. 101"
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                        />

                        <button
                            type="button"
                            onClick={searchFunds}
                            disabled={searching}
                            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {searching
                                ? "Searching..."
                                : "Search"}
                        </button>

                    </div>

                    {/* SEARCH RESULTS */}
                    <div className="mt-5 space-y-3">

                        {results.length === 0 &&
                            search &&
                            !searching && (
                                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">

                                    <p className="text-sm text-slate-500">
                                        No fund record found.
                                    </p>

                                </div>
                            )}

                        {results.map((fund) => (

                            <button
                                key={fund.id}
                                type="button"
                                onClick={() => openEdit(fund)}
                                className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-400 hover:bg-slate-50"
                            >

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                    <div>

                                        <p className="font-bold text-slate-900">
                                            Flat {fund.flat_number}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Building {fund.building}
                                            {" • "}
                                            Floor {fund.floor_number}
                                        </p>

                                    </div>

                                    <div className="text-left sm:text-right">

                                        <p className="font-bold text-slate-900">
                                            ₹
                                            {Number(
                                                fund.amount
                                            ).toLocaleString("en-IN")}
                                        </p>

                                        <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
                                            {fund.payment_mode}
                                        </p>

                                    </div>

                                </div>

                            </button>

                        ))}

                    </div>

                </section>

            </div>

            {/* =========================
          EDIT MODAL
      ========================= */}
            {editing && (

                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closeEdit();
                        }
                    }}
                >

                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

                        {/* MODAL HEADER */}
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">

                            <div>

                                <p className="text-xs font-medium text-slate-500">
                                    Building {editing.building}
                                    {" • "}
                                    Floor {editing.floor_number}
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    Flat {editing.flat_number}
                                </h2>

                            </div>

                            <button
                                type="button"
                                onClick={closeEdit}
                                disabled={saving}
                                className="text-2xl leading-none text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
                            >
                                ×
                            </button>

                        </div>

                        {/* MODAL BODY */}
                        <div className="space-y-5 px-6 py-5">

                            {/* AMOUNT */}
                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Fund Amount
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    value={amount}
                                    onChange={(e) =>
                                        setAmount(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400"
                                />

                            </div>

                            {/* PAYMENT MODE */}
                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Payment Mode
                                </label>

                                <div className="grid grid-cols-2 gap-3">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPaymentMode("cash")
                                        }
                                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${paymentMode === "cash"
                                                ? "border-slate-900 bg-slate-900 text-white"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        Cash
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPaymentMode("online")
                                        }
                                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${paymentMode === "online"
                                                ? "border-slate-900 bg-slate-900 text-white"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        Online
                                    </button>

                                </div>

                            </div>

                            {/* NOTE */}
                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Note
                                </label>

                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) =>
                                        setNote(e.target.value)
                                    }
                                    placeholder="Optional note"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                />

                            </div>

                        </div>

                        {/* MODAL FOOTER */}
                        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">

                            <button
                                type="button"
                                onClick={closeEdit}
                                disabled={saving}
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={saveEdit}
                                disabled={saving}
                                className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </main>
    );
}