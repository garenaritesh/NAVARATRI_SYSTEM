"use client";

import { useMemo, useState } from "react";

type Expense = {
    id: number;
    title: string;
    amount: number;
    spent_at: string;
};

type Props = {
    expenses: Expense[];
};

export default function ExpenseHistory({ expenses }: Props) {
    const [search, setSearch] = useState("");
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [saving, setSaving] = useState(false);

    const filteredExpenses = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return expenses;

        return expenses.filter((expense) =>
            expense.title.toLowerCase().includes(query)
        );
    }, [expenses, search]);

    const filteredTotal = filteredExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
    );

    function formatDate(date: string) {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function openEdit(expense: Expense) {
        setEditingExpense(expense);
        setEditTitle(expense.title);
        setEditAmount(String(expense.amount));
    }

    function closeEdit() {
        if (saving) return;

        setEditingExpense(null);
        setEditTitle("");
        setEditAmount("");
    }

    async function updateExpense() {
        if (!editingExpense) return;

        if (!editTitle.trim()) {
            alert("Please enter expense title.");
            return;
        }

        if (!editAmount || Number(editAmount) <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(
                `/api/expenses/${editingExpense.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title: editTitle.trim(),
                        amount: Number(editAmount),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to update expense.");
                return;
            }

            window.location.reload();
        } catch (error) {
            console.error("UPDATE EXPENSE ERROR:", error);
            alert("Something went wrong.");
        } finally {
            setSaving(false);
        }
    }

    async function deleteExpense(id: number) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this expense?"
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/expenses/${id}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to delete expense.");
                return;
            }

            window.location.reload();
        } catch (error) {
            console.error("DELETE EXPENSE ERROR:", error);
            alert("Something went wrong.");
        }
    }

    return (
        <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Expense History
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage all society expenses
                        </p>
                    </div>

                    {/* Search */}
                    <div className="w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Search expense..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
                        />
                    </div>
                </div>

                {/* Summary */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-medium text-slate-500">
                            {search ? "Filtered Total" : "Total Expenses"}
                        </p>

                        <p className="mt-1 text-xl font-bold text-slate-900">
                            ₹{filteredTotal.toLocaleString("en-IN")}
                        </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-medium text-slate-500">
                            {search ? "Matching Expenses" : "Total Entries"}
                        </p>

                        <p className="mt-1 text-xl font-bold text-slate-900">
                            {filteredExpenses.length}
                        </p>
                    </div>
                </div>

                {/* Expense List */}
                <div className="mt-5 space-y-3">
                    {filteredExpenses.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                            <p className="text-sm font-medium text-slate-500">
                                {search
                                    ? "No matching expenses found."
                                    : "No expenses added yet."}
                            </p>
                        </div>
                    ) : (
                        filteredExpenses.map((expense) => (
                            <div
                                key={expense.id}
                                className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <h3 className="truncate font-semibold text-slate-900">
                                        {expense.title}
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {formatDate(expense.spent_at)}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between gap-4 sm:justify-end">
                                    <p className="text-base font-bold text-slate-900">
                                        ₹{Number(expense.amount).toLocaleString("en-IN")}
                                    </p>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(expense)}
                                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => deleteExpense(expense.id)}
                                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Edit Modal */}
            {editingExpense && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closeEdit();
                        }
                    }}
                >
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Edit Expense
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Update expense details
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeEdit}
                                disabled={saving}
                                className="text-2xl leading-none text-slate-400 hover:text-slate-700 disabled:opacity-50"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4 px-6 py-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Expense Title
                                </label>

                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Amount
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={closeEdit}
                                disabled={saving}
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={updateExpense}
                                disabled={saving}
                                className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}