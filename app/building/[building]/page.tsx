import BuildingReportButton from "@/components/BuildingReportButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";

type Props = {
    params: Promise<{
        building: string;
    }>;
};

export default async function BuildingPage({ params }: Props) {
    const { building } = await params;

    const buildingName = building.toUpperCase();

    if (buildingName !== "C" && buildingName !== "D") {
        notFound();
    }

    // --------------------------------------------------
    // BUILDING
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
    // BUILDING TOTALS
    //
    // CLOSED FLATS ARE NOT INCLUDED
    // --------------------------------------------------

    const buildingTotals = await sql`
    SELECT
      COALESCE(
        SUM(
          CASE
            WHEN f.is_closed = FALSE
            THEN fd.amount
            ELSE 0
          END
        ),
        0
      ) AS total_fund,

      COALESCE(
        SUM(
          CASE
            WHEN f.is_closed = FALSE
              AND fd.payment_mode = 'online'
            THEN fd.amount
            ELSE 0
          END
        ),
        0
      ) AS online,

      COALESCE(
        SUM(
          CASE
            WHEN f.is_closed = FALSE
              AND fd.payment_mode = 'cash'
            THEN fd.amount
            ELSE 0
          END
        ),
        0
      ) AS cash

    FROM flats f

    LEFT JOIN funds fd
      ON fd.flat_id = f.id

    WHERE f.building_id = ${currentBuilding.id};
  `;

    const flatReportData = await sql`
  SELECT
    f.flat_number,
    f.is_closed,
    fl.floor_number,
    COALESCE(
      SUM(
        CASE
          WHEN f.is_closed = FALSE THEN fd.amount
          ELSE 0
        END
      ),
      0
    ) AS total_paid
  FROM flats f
  INNER JOIN floors fl
    ON fl.id = f.floor_id
  LEFT JOIN funds fd
    ON fd.flat_id = f.id
  WHERE f.building_id = ${currentBuilding.id}
  GROUP BY
    f.id,
    f.flat_number,
    f.is_closed,
    fl.floor_number
  ORDER BY
    fl.floor_number,
    f.flat_number;
`;

    // --------------------------------------------------
    // FLOOR DATA
    // --------------------------------------------------

    const floorData = await sql`
    SELECT

      fl.id,
      fl.floor_number,

      /* Total flats including closed */
      COUNT(DISTINCT f.id)::int AS total_flats,

      /* Only active flats */
      COUNT(
        DISTINCT CASE
          WHEN f.is_closed = FALSE
          THEN f.id
        END
      )::int AS active_flats,

      /* Active flats with fund */
      COUNT(
        DISTINCT CASE
          WHEN f.is_closed = FALSE
            AND fd.id IS NOT NULL
          THEN f.id
        END
      )::int AS collected_flats,

      /* Fund from active flats only */
      COALESCE(
        SUM(
          CASE
            WHEN f.is_closed = FALSE
            THEN fd.amount
            ELSE 0
          END
        ),
        0
      ) AS total_fund,

      /* Online from active flats only */
      COALESCE(
        SUM(
          CASE
            WHEN f.is_closed = FALSE
              AND fd.payment_mode = 'online'
            THEN fd.amount
            ELSE 0
          END
        ),
        0
      ) AS online,

      /* Cash from active flats only */
      COALESCE(
        SUM(
          CASE
            WHEN f.is_closed = FALSE
              AND fd.payment_mode = 'cash'
            THEN fd.amount
            ELSE 0
          END
        ),
        0
      ) AS cash

    FROM floors fl

    LEFT JOIN flats f
      ON f.floor_id = fl.id

    LEFT JOIN funds fd
      ON fd.flat_id = f.id

    WHERE fl.building_id = ${currentBuilding.id}

    GROUP BY
      fl.id,
      fl.floor_number

    ORDER BY
      fl.floor_number;
  `;

    const totalFund = Number(
        buildingTotals[0]?.total_fund ?? 0
    );

    const onlineFund = Number(
        buildingTotals[0]?.online ?? 0
    );

    const cashFund = Number(
        buildingTotals[0]?.cash ?? 0
    );

    // --------------------------------------------------
    // UI
    // --------------------------------------------------

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="mx-auto max-w-7xl">

                {/* Back */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                >
                    ← Back to Dashboard
                </Link>

                {/* Header */}
                <div className="mt-6 flex items-start justify-between">

                    <div>
                        <p className="text-sm font-semibold tracking-wide text-purple-600">
                            SUMANDHAM SOCIETY
                        </p>

                        <h1 className="mt-1 text-4xl font-bold text-slate-900">
                            Building {buildingName}
                        </h1>

                        <p className="mt-2 text-slate-500">
                            {currentBuilding.total_floors} Floors •{" "}
                            {currentBuilding.flats_per_floor} Flats per Floor
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
                        <BuildingReportButton
                            building={buildingName}
                            totalFund={totalFund}
                            flats={flatReportData.map((flat) => ({
                                flatNumber: String(flat.flat_number),
                                floorNumber: Number(flat.floor_number),
                                isClosed: flat.is_closed,
                                amount: Number(flat.total_paid),
                            }))}
                        />

                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-3xl font-bold text-purple-700">
                            {buildingName}
                        </div>
                    </div>
                </div>

                {/* Building Summary */}
                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">

                    {/* Total */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Total Fund Received
                        </p>

                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                            ₹{totalFund.toLocaleString("en-IN")}
                        </h2>
                    </div>

                    {/* Online */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Online Collection
                        </p>

                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                            ₹{onlineFund.toLocaleString("en-IN")}
                        </h2>
                    </div>

                    {/* Cash */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Cash Collection
                        </p>

                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                            ₹{cashFund.toLocaleString("en-IN")}
                        </h2>
                    </div>

                </div>

                {/* Floors */}
                <div className="mt-10">

                    <div className="mb-5">
                        <h2 className="text-2xl font-bold text-slate-900">
                            Floors
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Select a floor to view its flats and fund collection
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                        {floorData.map((floor) => {
                            const activeFlats = Number(
                                floor.active_flats
                            );

                            const collectedFlats = Number(
                                floor.collected_flats
                            );

                            const allCollected =
                                activeFlats > 0 &&
                                collectedFlats === activeFlats;

                            const pendingFlats =
                                activeFlats - collectedFlats;

                            const floorTotalFund = Number(
                                floor.total_fund
                            );

                            const floorOnline = Number(
                                floor.online
                            );

                            const floorCash = Number(
                                floor.cash
                            );

                            return (
                                <div
                                    key={floor.id}
                                    className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${allCollected
                                            ? "border-green-200"
                                            : "border-slate-200"
                                        }`}
                                >

                                    {/* Top */}
                                    <div className="flex items-center justify-between">

                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${allCollected
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-purple-100 text-purple-700"
                                                }`}
                                        >
                                            {floor.floor_number}
                                        </div>

                                        {allCollected ? (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                                ✓ Collected
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-500">
                                                {floor.total_flats} Flats
                                            </span>
                                        )}

                                    </div>

                                    {/* Floor Name */}
                                    <h3 className="mt-4 text-lg font-bold text-slate-900">
                                        Floor {floor.floor_number}
                                    </h3>

                                    {/* Status */}
                                    {allCollected ? (
                                        <p className="mt-1 text-xs font-semibold text-green-600">
                                            All funds collected
                                        </p>
                                    ) : (
                                        <p className="mt-1 text-xs text-orange-600">
                                            {pendingFlats} flat
                                            {pendingFlats !== 1 ? "s" : ""} pending
                                        </p>
                                    )}

                                    {/* Total Fund */}
                                    <div className="mt-5">
                                        <p className="text-xs text-slate-500">
                                            Total Fund
                                        </p>

                                        <p
                                            className={`mt-1 text-lg font-bold ${allCollected
                                                    ? "text-green-700"
                                                    : "text-slate-900"
                                                }`}
                                        >
                                            ₹{floorTotalFund.toLocaleString("en-IN")}
                                        </p>
                                    </div>

                                    {/* Online / Cash */}
                                    <div className="mt-4 grid grid-cols-2 gap-4">

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Online
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                ₹{floorOnline.toLocaleString("en-IN")}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Cash
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                ₹{floorCash.toLocaleString("en-IN")}
                                            </p>
                                        </div>

                                    </div>

                                    {/* Open Floor */}
                                    <Link
                                        href={`/building/${buildingName}/floor/${floor.floor_number}`}
                                        className={`mt-5 block text-sm font-semibold ${allCollected
                                                ? "text-green-700"
                                                : "text-purple-600"
                                            }`}
                                    >
                                        Open Floor →
                                    </Link>

                                </div>
                            );
                        })}

                    </div>

                </div>
            </div>
        </main>
    );
}