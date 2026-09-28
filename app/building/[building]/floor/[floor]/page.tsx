import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import FundCollection from "@/components/FundCollection";
import FlatStatusButton from "@/components/FlatStatusButton";

type Props = {
    params: Promise<{
        building: string;
        floor: string;
    }>;
};

type Flat = {
    id: number;
    flat_number: string;
    total_fund: number;
    online: number;
    cash: number;
    is_closed: boolean;
};

export default async function FloorPage({ params }: Props) {
    const { building, floor } = await params;

    const buildingName = building.toUpperCase();
    const floorNumber = Number(floor);

    // Validate building and floor
    if (
        (buildingName !== "C" && buildingName !== "D") ||
        !Number.isInteger(floorNumber)
    ) {
        notFound();
    }

    // --------------------------------------------------
    // GET BUILDING
    // --------------------------------------------------

    const buildings = await sql`
    SELECT
      id,
      name,
      total_floors,
      flats_per_floor
    FROM buildings
    WHERE name = ${buildingName}
    LIMIT 1;
  `;

    if (buildings.length === 0) {
        notFound();
    }

    const currentBuilding = buildings[0];

    // --------------------------------------------------
    // GET FLOOR
    // --------------------------------------------------

    const floors = await sql`
    SELECT
      id,
      floor_number
    FROM floors
    WHERE building_id = ${currentBuilding.id}
      AND floor_number = ${floorNumber}
    LIMIT 1;
  `;

    if (floors.length === 0) {
        notFound();
    }

    const currentFloor = floors[0];

    // --------------------------------------------------
    // GET FLATS + FUND DETAILS
    // --------------------------------------------------

    const flatRows = await sql`
    SELECT
      f.id,
      f.flat_number,
      f.is_closed,

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

    FROM flats f

    LEFT JOIN funds fd
      ON fd.flat_id = f.id

    WHERE f.floor_id = ${currentFloor.id}

    GROUP BY
      f.id,
      f.flat_number,
      f.is_closed

    ORDER BY
      f.flat_number;
  `;

    // --------------------------------------------------
    // CONVERT DATABASE VALUES
    // --------------------------------------------------

    const flats: Flat[] = flatRows.map((flat) => ({
        id: Number(flat.id),
        flat_number: String(flat.flat_number),
        total_fund: Number(flat.total_fund),
        online: Number(flat.online),
        cash: Number(flat.cash),
        is_closed: Boolean(flat.is_closed),
    }));

    // --------------------------------------------------
    // SEPARATE ACTIVE + CLOSED FLATS
    // --------------------------------------------------

    const activeFlats = flats.filter(
        (flat) => !flat.is_closed
    );

    const closedFlats = flats.filter(
        (flat) => flat.is_closed
    );

    // --------------------------------------------------
    // SORT ACTIVE FLATS
    // Pending → Collected
    // --------------------------------------------------

    activeFlats.sort((a, b) => {
        const aCollected = a.total_fund > 0;
        const bCollected = b.total_fund > 0;

        // Pending first
        if (aCollected !== bCollected) {
            return Number(aCollected) - Number(bCollected);
        }

        // Same status → flat number order
        return a.flat_number.localeCompare(
            b.flat_number,
            undefined,
            {
                numeric: true,
            }
        );
    });

    // --------------------------------------------------
    // SORT CLOSED FLATS
    // --------------------------------------------------

    closedFlats.sort((a, b) =>
        a.flat_number.localeCompare(
            b.flat_number,
            undefined,
            {
                numeric: true,
            }
        )
    );

    // --------------------------------------------------
    // FINAL ORDER
    //
    // Pending
    // Collected
    // Closed
    // --------------------------------------------------

    const sortedFlats = [
        ...activeFlats,
        ...closedFlats,
    ];

    // --------------------------------------------------
    // FLOOR FUND CALCULATION
    //
    // CLOSED FLATS ARE COMPLETELY IGNORED
    // --------------------------------------------------

    const totalFund = activeFlats.reduce(
        (sum, flat) => sum + flat.total_fund,
        0
    );

    const onlineFund = activeFlats.reduce(
        (sum, flat) => sum + flat.online,
        0
    );

    const cashFund = activeFlats.reduce(
        (sum, flat) => sum + flat.cash,
        0
    );

    // --------------------------------------------------
    // COLLECTION STATUS
    // --------------------------------------------------

    const collectedCount = activeFlats.filter(
        (flat) => flat.total_fund > 0
    ).length;

    const pendingCount =
        activeFlats.length - collectedCount;

    /*
      Closed flats are ignored.
  
      Example:
      8 total flats
      2 closed
      6 collected
  
      Result:
      6 / 6
      All Funds Collected
    */

    const allCollected =
        activeFlats.length > 0 &&
        collectedCount === activeFlats.length;

    // --------------------------------------------------
    // UI
    // --------------------------------------------------

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="mx-auto max-w-7xl">

                {/* BACK BUTTON */}
                <Link
                    href={`/building/${buildingName}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                >
                    ← Back to Building {buildingName}
                </Link>

                {/* HEADER */}
                <div className="mt-6">
                    <div className="flex flex-wrap items-center gap-3">

                        <h1 className="text-3xl font-bold text-slate-900">
                            Building {buildingName} - Floor {floorNumber}
                        </h1>

                        {allCollected && (
                            <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                                ✓ All Funds Collected
                            </span>
                        )}

                    </div>

                    <p className="mt-2 text-slate-500">
                        Manage fund collection for all flats on this floor.
                    </p>
                </div>

                {/* ------------------------------------------------ */}
                {/* SUMMARY CARDS */}
                {/* ------------------------------------------------ */}

                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    {/* TOTAL FUND */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Total Fund
                        </p>

                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                            ₹{totalFund.toLocaleString("en-IN")}
                        </h2>
                    </div>

                    {/* ONLINE */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Online
                        </p>

                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                            ₹{onlineFund.toLocaleString("en-IN")}
                        </h2>
                    </div>

                    {/* CASH */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Cash
                        </p>

                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                            ₹{cashFund.toLocaleString("en-IN")}
                        </h2>
                    </div>

                    {/* COLLECTION STATUS */}
                    <div
                        className={`rounded-2xl border p-5 shadow-sm ${allCollected
                                ? "border-green-200 bg-green-50"
                                : "border-orange-200 bg-orange-50"
                            }`}
                    >
                        <p
                            className={`text-sm ${allCollected
                                    ? "text-green-700"
                                    : "text-orange-700"
                                }`}
                        >
                            Collection Status
                        </p>

                        <h2
                            className={`mt-2 text-2xl font-bold ${allCollected
                                    ? "text-green-700"
                                    : "text-orange-700"
                                }`}
                        >
                            {collectedCount} / {activeFlats.length}
                        </h2>

                        <p
                            className={`mt-1 text-xs ${allCollected
                                    ? "text-green-600"
                                    : "text-orange-600"
                                }`}
                        >
                            {allCollected
                                ? "All funds collected"
                                : `${pendingCount} flat${pendingCount !== 1 ? "s" : ""
                                } pending`}
                        </p>
                    </div>
                </div>

                {/* ------------------------------------------------ */}
                {/* FLATS */}
                {/* ------------------------------------------------ */}

                <div className="mt-10">

                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Flats
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Pending flats first, collected flats next, closed flats last.
                            </p>
                        </div>

                        {pendingCount > 0 && !allCollected && (
                            <span className="w-fit rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
                                {pendingCount} Pending
                            </span>
                        )}

                    </div>

                    {/* FLATS GRID */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                        {sortedFlats.map((flat) => {

                            const collected =
                                !flat.is_closed &&
                                flat.total_fund > 0;

                            {/* ---------------------------------------- */ }
                            {/* CLOSED FLAT */ }
                            {/* ---------------------------------------- */ }

                            if (flat.is_closed) {
                                return (
                                    <div
                                        key={flat.id}
                                        className="rounded-2xl border border-slate-300 bg-slate-100 p-5 shadow-sm"
                                    >

                                        {/* TOP */}
                                        <div className="flex items-center justify-between">

                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-lg font-bold text-slate-500">
                                                {flat.flat_number}
                                            </div>

                                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                                                Closed
                                            </span>

                                        </div>

                                        {/* NAME */}
                                        <h3 className="mt-4 text-lg font-bold text-slate-700">
                                            Flat {flat.flat_number}
                                        </h3>

                                        <p className="mt-2 text-sm text-slate-500">
                                            No resident / Flat closed
                                        </p>

                                        {/* FUND */}
                                        <div className="mt-4 rounded-xl bg-white px-4 py-3">

                                            <p className="text-xs text-slate-400">
                                                Fund
                                            </p>

                                            <p className="mt-1 font-bold text-slate-400">
                                                Not Included
                                            </p>

                                        </div>

                                        {/* OPEN FLAT */}
                                        <div className="mt-4">
                                            <FlatStatusButton
                                                flatId={flat.id}
                                                isClosed={true}
                                            />
                                        </div>

                                    </div>
                                );
                            }

                            {/* ---------------------------------------- */ }
                            {/* ACTIVE FLAT */ }
                            {/* ---------------------------------------- */ }

                            return (
                                <div
                                    key={flat.id}
                                    className={`rounded-2xl border bg-white p-5 shadow-sm transition ${collected
                                            ? "border-green-200"
                                            : "border-slate-200 hover:-translate-y-1 hover:shadow-md"
                                        }`}
                                >

                                    {/* TOP */}
                                    <div className="flex items-center justify-between">

                                        <div
                                            className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold ${collected
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-purple-100 text-purple-700"
                                                }`}
                                        >
                                            {flat.flat_number}
                                        </div>

                                        {collected ? (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                                ✓ Collected
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                                                Pending
                                            </span>
                                        )}

                                    </div>

                                    {/* FLAT NAME */}
                                    <h3 className="mt-4 text-lg font-bold text-slate-900">
                                        Flat {flat.flat_number}
                                    </h3>

                                    {/* FUND DETAILS */}
                                    <div className="mt-4 space-y-2">

                                        <div className="flex items-center justify-between">

                                            <span className="text-sm text-slate-500">
                                                Total Fund
                                            </span>

                                            <span
                                                className={`font-bold ${collected
                                                        ? "text-green-700"
                                                        : "text-slate-900"
                                                    }`}
                                            >
                                                ₹{flat.total_fund.toLocaleString("en-IN")}
                                            </span>

                                        </div>

                                        {collected && (
                                            <>
                                                <div className="flex items-center justify-between">

                                                    <span className="text-xs text-slate-500">
                                                        Online
                                                    </span>

                                                    <span className="text-xs font-semibold text-slate-700">
                                                        ₹{flat.online.toLocaleString("en-IN")}
                                                    </span>

                                                </div>

                                                <div className="flex items-center justify-between">

                                                    <span className="text-xs text-slate-500">
                                                        Cash
                                                    </span>

                                                    <span className="text-xs font-semibold text-slate-700">
                                                        ₹{flat.cash.toLocaleString("en-IN")}
                                                    </span>

                                                </div>
                                            </>
                                        )}

                                    </div>

                                    {/* COLLECT FUND */}
                                    <div className="mt-5">
                                        <FundCollection
                                            flatId={flat.id}
                                            flatNumber={flat.flat_number}
                                            collected={collected}
                                        />
                                    </div>

                                    {/* MARK CLOSED */}
                                    <div className="mt-2">
                                        <FlatStatusButton
                                            flatId={flat.id}
                                            isClosed={false}
                                        />
                                    </div>

                                </div>
                            );
                        })}

                    </div>

                    {/* NO FLATS */}
                    {flats.length === 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">

                            <p className="font-semibold text-slate-700">
                                No flats found.
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                No flats are configured for this floor.
                            </p>

                        </div>
                    )}

                </div>
            </div>
        </main>
    );
}