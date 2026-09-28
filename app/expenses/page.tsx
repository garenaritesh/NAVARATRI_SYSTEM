import { sql } from "@/lib/db";
import Link from "next/link";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseHistory from "@/components/ExpenseHistory";

export default async function ExpensesPage() {
    const expenses = await sql`
    SELECT
      id,
      title,
      amount,
      spent_at
    FROM expenses
    ORDER BY spent_at DESC;
  `;

    const expenseData = expenses.map((expense) => ({
        id: Number(expense.id),
        title: String(expense.title),
        amount: Number(expense.amount),
        spent_at: String(expense.spent_at),
    }));

    const totalExpenses = expenseData.reduce(
        (sum, expense) => sum + expense.amount,
        0
    );

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="text-sm font-medium text-slate-500 hover:text-slate-900"
                    >
                        ← Back to Dashboard
                    </Link>

                    <div className="mt-5">
                        <p className="text-sm font-medium text-slate-500">
                            SUMANDHAM SOCIETY
                        </p>

                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                            Expenses
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Add and manage society expenses
                        </p>
                    </div>
                </div>

                {/* Total */}
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                        Total Expenses
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        ₹{totalExpenses.toLocaleString("en-IN")}
                    </p>
                </div>

                {/* Add Expense */}
                <div className="mb-6">
                    <ExpenseForm />
                </div>

                {/* Expense History */}
                <ExpenseHistory expenses={expenseData} />

            </div>
        </main>
    );
}