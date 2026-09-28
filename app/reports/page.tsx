import { sql } from "@/lib/db";
import Link from "next/link";
import PrintReportButton from "@/components/PrintReportButton";

export default async function ReportPage() {
    // =========================
    // OVERALL FUND SUMMARY
    // =========================
    const summary = await sql`
    SELECT
      COALESCE(SUM(fu.amount), 0) AS total_fund,

      COALESCE(
        SUM(
          CASE
            WHEN fu.payment_mode = 'online'
            THEN fu.amount
            ELSE 0
          END
        ),
        0
      ) AS online_fund,

      COALESCE(
        SUM(
          CASE
            WHEN fu.payment_mode = 'cash'
            THEN fu.amount
            ELSE 0
          END
        ),
        0
      ) AS cash_fund

    FROM funds fu

    INNER JOIN flats f
      ON f.id = fu.flat_id

    WHERE f.is_closed = FALSE;
  `;

    // =========================
    // EXPENSE TOTAL
    // =========================
    const expenseResult = await sql`
    SELECT
      COALESCE(SUM(amount), 0) AS total_expenses
    FROM expenses;
  `;

    // =========================
    // BUILDING-WISE COLLECTION
    // =========================
    const buildingData = await sql`
    SELECT
      b.name,

      COALESCE(
        SUM(
          CASE
            WHEN f.is_closed = FALSE
            THEN fu.amount
            ELSE 0
          END
        ),
        0
      ) AS total_fund,

      COALESCE(
        SUM(
          CASE
            WHEN f.is_closed = FALSE
              AND fu.payment_mode = 'online'
            THEN fu.amount
            ELSE 0
          END
        ),
        0
      ) AS online_fund,

      COALESCE(
        SUM(
          CASE
            WHEN f.is_closed = FALSE
              AND fu.payment_mode = 'cash'
            THEN fu.amount
            ELSE 0
          END
        ),
        0
      ) AS cash_fund

    FROM buildings b

    LEFT JOIN flats f
      ON f.building_id = b.id

    LEFT JOIN funds fu
      ON fu.flat_id = f.id

    GROUP BY
      b.id,
      b.name

    ORDER BY
      b.name;
  `;

    // =========================
    // EXPENSE LIST
    // =========================
    const expenses = await sql`
    SELECT
      id,
      title,
      amount,
      spent_at

    FROM expenses

    ORDER BY spent_at DESC;
  `;

    // =========================
    // FLAT-WISE FUND REPORT
    // =========================
    const flatFunds = await sql`
    SELECT
      b.name AS building,
      fl.floor_number,
      f.flat_number,
      f.is_closed,

      COALESCE(
        SUM(fu.amount),
        0
      ) AS total_fund,

      STRING_AGG(
        DISTINCT fu.payment_mode,
        ', '
      ) AS payment_modes

    FROM flats f

    INNER JOIN buildings b
      ON b.id = f.building_id

    INNER JOIN floors fl
      ON fl.id = f.floor_id

    LEFT JOIN funds fu
      ON fu.flat_id = f.id

    GROUP BY
      b.name,
      fl.floor_number,
      f.id,
      f.flat_number,
      f.is_closed

    ORDER BY
      b.name,
      fl.floor_number,
      f.flat_number;
  `;

    // =========================
    // CALCULATIONS
    // =========================
    const totalFund = Number(
        summary[0]?.total_fund || 0
    );

    const onlineFund = Number(
        summary[0]?.online_fund || 0
    );

    const cashFund = Number(
        summary[0]?.cash_fund || 0
    );

    const totalExpenses = Number(
        expenseResult[0]?.total_expenses || 0
    );

    const balance = totalFund - totalExpenses;

    // =========================
    // HELPERS
    // =========================
    const money = (value: number | string) =>
        `₹${Number(value).toLocaleString("en-IN")}`;

    const reportDate = new Date().toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }
    );

    return (
        <main className="min-h-screen bg-slate-100 py-8">

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* =========================
            ACTION BAR
        ========================= */}
                <div className="report-actions mb-5 flex items-center justify-between">

                    <Link
                        href="/"
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                    >
                        ← Dashboard
                    </Link>

                    <PrintReportButton />

                </div>

                {/* =========================
            REPORT PAPER
        ========================= */}
                <div className="report-paper overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">

                    {/* =========================
              PREMIUM HEADER
          ========================= */}
                    <header className="border-b border-slate-200 px-6 py-10 text-center sm:px-10">

                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-black text-white shadow-lg">
                            SN
                        </div>

                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                            SUMANDHAM SOCIETY
                        </p>

                        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            SUMANDHAM NAVARATRI REPORT
                        </h1>

                        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
                            Fund Collection & Expense Statement
                        </p>

                        <div className="mx-auto mt-5 h-px max-w-xs bg-slate-200" />

                        <p className="mt-4 text-xs font-medium text-slate-400">
                            Report generated on {reportDate}
                        </p>

                    </header>

                    <div className="px-6 py-8 sm:px-10">

                        {/* =========================
                OVERALL SUMMARY
            ========================= */}
                        <section className="mb-10">

                            <div className="mb-4">

                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                    Financial Overview
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    Overall Summary
                                </h2>

                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

                                {/* Total Fund */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Total Fund
                                    </p>

                                    <p className="mt-2 text-2xl font-black text-slate-900">
                                        {money(totalFund)}
                                    </p>

                                </div>

                                {/* Online */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Online
                                    </p>

                                    <p className="mt-2 text-2xl font-black text-slate-900">
                                        {money(onlineFund)}
                                    </p>

                                </div>

                                {/* Cash */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Cash
                                    </p>

                                    <p className="mt-2 text-2xl font-black text-slate-900">
                                        {money(cashFund)}
                                    </p>

                                </div>

                                {/* Expenses */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Expenses
                                    </p>

                                    <p className="mt-2 text-2xl font-black text-slate-900">
                                        {money(totalExpenses)}
                                    </p>

                                </div>

                                {/* Balance */}
                                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

                                    <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                                        Balance
                                    </p>

                                    <p className="mt-2 text-2xl font-black text-green-700">
                                        {money(balance)}
                                    </p>

                                </div>

                            </div>

                        </section>

                        {/* =========================
                BUILDING-WISE COLLECTION
            ========================= */}
                        <section className="mb-10">

                            <div className="mb-4">

                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                    Collection
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    Building-wise Collection
                                </h2>

                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-200">

                                <table className="w-full text-left text-sm">

                                    <thead className="bg-slate-900 text-white">

                                        <tr>

                                            <th className="px-5 py-4 font-semibold">
                                                Building
                                            </th>

                                            <th className="px-5 py-4 font-semibold">
                                                Total Fund
                                            </th>

                                            <th className="px-5 py-4 font-semibold">
                                                Online
                                            </th>

                                            <th className="px-5 py-4 font-semibold">
                                                Cash
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {buildingData.map((building) => (

                                            <tr
                                                key={String(building.name)}
                                                className="border-b border-slate-100 last:border-0"
                                            >

                                                <td className="px-5 py-4 font-bold text-slate-900">
                                                    Building {building.name}
                                                </td>

                                                <td className="px-5 py-4 font-bold">
                                                    {money(building.total_fund)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {money(building.online_fund)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {money(building.cash_fund)}
                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                        </section>

                        {/* =========================
                EXPENSE SUMMARY
            ========================= */}
                        <section className="mb-10">

                            <div className="mb-4">

                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                    Expenditure
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    Expense Summary
                                </h2>

                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-200">

                                <table className="w-full text-left text-sm">

                                    <thead className="bg-slate-900 text-white">

                                        <tr>

                                            <th className="px-5 py-4 font-semibold">
                                                Expense
                                            </th>

                                            <th className="px-5 py-4 font-semibold">
                                                Date
                                            </th>

                                            <th className="px-5 py-4 text-right font-semibold">
                                                Amount
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {expenses.map((expense) => (

                                            <tr
                                                key={Number(expense.id)}
                                                className="border-b border-slate-100 last:border-0"
                                            >

                                                <td className="px-5 py-4 font-semibold text-slate-900">
                                                    {expense.title}
                                                </td>

                                                <td className="px-5 py-4 text-slate-500">
                                                    {new Date(
                                                        String(expense.spent_at)
                                                    ).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        }
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-right font-bold">
                                                    {money(expense.amount)}
                                                </td>

                                            </tr>

                                        ))}

                                        {expenses.length === 0 && (

                                            <tr>

                                                <td
                                                    colSpan={3}
                                                    className="px-5 py-10 text-center text-slate-500"
                                                >
                                                    No expenses recorded.
                                                </td>

                                            </tr>

                                        )}

                                        {expenses.length > 0 && (

                                            <tr className="bg-slate-50">

                                                <td
                                                    colSpan={2}
                                                    className="px-5 py-4 text-right font-bold text-slate-600"
                                                >
                                                    Total Expenses
                                                </td>

                                                <td className="px-5 py-4 text-right text-base font-black text-slate-900">
                                                    {money(totalExpenses)}
                                                </td>

                                            </tr>

                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </section>


                        {/* =========================
                FOOTER
            ========================= */}
                        <footer className="mt-10 border-t border-slate-200 pt-6 text-center">

                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                SUMANDHAM SOCIETY
                            </p>

                            <p className="mt-2 text-xs text-slate-400">
                                Navaratri Fund Collection & Financial Statement
                            </p>

                        </footer>

                    </div>

                </div>

            </div>

        </main>
    );
}