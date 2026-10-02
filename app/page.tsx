import Link from "next/link";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  // ========================================
  // BUILDING TOTALS
  // ========================================

  const buildingData = await sql`
    SELECT
      b.id,
      b.name,
      COUNT(DISTINCT f.id)::int AS flats,

      COALESCE(SUM(fd.amount), 0) AS total_fund,

      COALESCE(
        SUM(
          CASE
            WHEN fd.payment_mode = 'online'
            THEN fd.amount
            ELSE 0
          END
        ),
        0
      ) AS online,

      COALESCE(
        SUM(
          CASE
            WHEN fd.payment_mode = 'cash'
            THEN fd.amount
            ELSE 0
          END
        ),
        0
      ) AS cash

    FROM buildings b

    LEFT JOIN flats f
      ON f.building_id = b.id

    LEFT JOIN funds fd
      ON fd.flat_id = f.id

    GROUP BY b.id, b.name

    ORDER BY b.name;
  `;

  // ========================================
  // OVERALL FUND
  // ========================================

  const fundTotals = await sql`
    SELECT
      COALESCE(SUM(amount), 0) AS total_fund,

      COALESCE(
        SUM(
          CASE
            WHEN payment_mode = 'online'
            THEN amount
            ELSE 0
          END
        ),
        0
      ) AS online,

      COALESCE(
        SUM(
          CASE
            WHEN payment_mode = 'cash'
            THEN amount
            ELSE 0
          END
        ),
        0
      ) AS cash

    FROM funds;
  `;

  // ========================================
  // EXPENSES
  // ========================================

  const expenseTotal = await sql`
    SELECT
      COALESCE(SUM(amount), 0) AS total_expenses
    FROM expenses;
  `;

  const totalFund = Number(
    fundTotals[0]?.total_fund ?? 0
  );

  const onlineFund = Number(
    fundTotals[0]?.online ?? 0
  );

  const cashFund = Number(
    fundTotals[0]?.cash ?? 0
  );

  const totalExpenses = Number(
    expenseTotal[0]?.total_expenses ?? 0
  );

  const balance = totalFund - totalExpenses;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8">

          <p className="text-sm font-semibold tracking-wide text-purple-600">
            NAVRATRI MANAGEMENT
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900 md:text-4xl">
            SUMANDHAM SOCIETY
          </h1>

          <p className="mt-2 text-slate-500">
            Navratri Fund & Expense Management
          </p>

        </div>

        {/* OVERALL STATS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Total Fund Received"
            value={totalFund}
          />

          <StatCard
            title="Online Collection"
            value={onlineFund}
          />

          <StatCard
            title="Cash Collection"
            value={cashFund}
          />

          <StatCard
            title="Total Expenses"
            value={totalExpenses}
          />

        </div>

        {/* BALANCE */}
        <div className="mt-4 rounded-2xl bg-purple-600 p-6 text-white shadow-sm">

          <p className="text-sm text-purple-100">
            Available Balance
          </p>

          <h2 className="mt-1 text-3xl font-bold">
            ₹{balance.toLocaleString("en-IN")}
          </h2>

        </div>

        {/* BUILDINGS */}
        <div className="mt-10">

          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Buildings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select a building to manage fund collection
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {buildingData.map((building) => (
              <BuildingCard
                key={building.id}
                name={building.name}
                flats={building.flats}
                fund={Number(building.total_fund)}
                online={Number(building.online)}
                cash={Number(building.cash)}
              />
            ))}

          </div>

        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-10">

          <h2 className="mb-5 text-2xl font-bold text-slate-900">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <Link
              href="/"
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900">
                Collect Fund
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Open a building and collect fund
              </p>
            </Link>

            <Link
              href="/expenses"
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900">
                Add Expense
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add and manage society expenses
              </p>
            </Link>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">
                View Reports
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Coming next
              </p>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}


/* ========================================
   STAT CARD
======================================== */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <h3 className="mt-2 text-2xl font-bold text-slate-900">
        ₹{value.toLocaleString("en-IN")}
      </h3>

    </div>
  );
}


/* ========================================
   BUILDING CARD
======================================== */

function BuildingCard({
  name,
  flats,
  fund,
  online,
  cash,
}: {
  name: string;
  flats: number;
  fund: number;
  online: number;
  cash: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

      <div className="flex items-center justify-between">

        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 text-2xl font-bold text-purple-700">
          {name}
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {flats} Flats
        </span>

      </div>

      <h3 className="mt-5 text-xl font-bold text-slate-900">
        Building {name}
      </h3>

      <div className="mt-5 grid grid-cols-3 gap-3">

        <div>
          <p className="text-xs text-slate-500">
            Total Fund
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            ₹{fund.toLocaleString("en-IN")}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">
            Online
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            ₹{online.toLocaleString("en-IN")}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">
            Cash
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            ₹{cash.toLocaleString("en-IN")}
          </p>
        </div>

      </div>

      <Link
        href={`/building/${name}`}
        className="mt-6 block w-full rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Open Building
      </Link>

    </div>
  );
}