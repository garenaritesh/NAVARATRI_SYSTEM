"use client";

import { useState } from "react";

export default function ExpenseForm() {
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    async function addExpense() {
        setMessage("");

        if (!title.trim()) {
            setMessage("Please enter expense title.");
            return;
        }

        if (!amount || Number(amount) <= 0) {
            setMessage("Please enter a valid amount.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch("/api/expenses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: title.trim(),
                    amount: Number(amount),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Failed to add expense.");
                return;
            }

            setMessage("Expense added successfully!");

            setTitle("");
            setAmount("");

            setTimeout(() => {
                window.location.reload();
            }, 700);
        } catch (error) {
            console.error(error);
            setMessage("Unable to add expense.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* Title */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Expense Title
                    </label>

                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter expense title"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    />
                </div>

                {/* Amount */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Amount
                    </label>

                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-700">
                            ₹
                        </span>

                        <input
                            type="number"
                            min="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pl-9 text-base font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                        />
                    </div>
                </div>

            </div>

            {/* Message */}
            {message && (
                <div
                    className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${message.toLowerCase().includes("success")
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                >
                    {message}
                </div>
            )}

            {/* Button */}
            <div className="mt-5 flex justify-end">
                <button
                    type="button"
                    onClick={addExpense}
                    disabled={saving}
                    className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {saving ? "Adding..." : "Add Expense"}
                </button>
            </div>
        </div>
    );
}