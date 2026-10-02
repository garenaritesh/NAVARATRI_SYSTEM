import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const flatNumber = searchParams.get("flat")?.trim();

        if (!flatNumber) {
            return NextResponse.json([]);
        }

        const result = await sql`
      SELECT
        fu.id,
        fu.flat_id,
        fu.amount,
        fu.payment_mode,
        fu.note,
        fu.collected_at,
        f.flat_number,
        b.name AS building,
        fl.floor_number
      FROM funds fu
      INNER JOIN flats f
        ON f.id = fu.flat_id
      INNER JOIN buildings b
        ON b.id = f.building_id
      INNER JOIN floors fl
        ON fl.id = f.floor_id
      WHERE f.flat_number ILIKE ${"%" + flatNumber + "%"}
      ORDER BY fu.collected_at DESC;
    `;

        return NextResponse.json(result);
    } catch (error) {
        console.error("FUND SEARCH ERROR:", error);

        return NextResponse.json(
            { error: "Failed to search funds." },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();

        if (body.password !== "2007") {
            return NextResponse.json(
                { error: "Unauthorized." },
                { status: 401 }
            );
        }

        const id = Number(body.id);
        const amount = Number(body.amount);
        const paymentMode = body.paymentMode;
        const note = body.note?.trim() || null;

        if (!Number.isInteger(id) || id <= 0) {
            return NextResponse.json(
                { error: "Invalid fund ID." },
                { status: 400 }
            );
        }

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: "Please enter a valid amount." },
                { status: 400 }
            );
        }

        if (paymentMode !== "cash" && paymentMode !== "online") {
            return NextResponse.json(
                { error: "Invalid payment mode." },
                { status: 400 }
            );
        }

        const result = await sql`
      UPDATE funds
      SET
        amount = ${amount},
        payment_mode = ${paymentMode},
        note = ${note}
      WHERE id = ${id}
      RETURNING
        id,
        flat_id,
        amount,
        payment_mode,
        note,
        collected_at;
    `;

        if (result.length === 0) {
            return NextResponse.json(
                { error: "Fund record not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            fund: result[0],
        });
    } catch (error) {
        console.error("FUND UPDATE ERROR:", error);

        return NextResponse.json(
            { error: "Failed to update fund." },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const body = await request.json();

        if (body.password !== "2007") {
            return NextResponse.json(
                { error: "Unauthorized." },
                { status: 401 }
            );
        }

        const id = Number(body.id);

        if (!Number.isInteger(id) || id <= 0) {
            return NextResponse.json(
                { error: "Invalid fund ID." },
                { status: 400 }
            );
        }

        const result = await sql`
      DELETE FROM funds
      WHERE id = ${id}
      RETURNING id;
    `;

        if (result.length === 0) {
            return NextResponse.json(
                { error: "Fund record not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Fund record deleted successfully.",
        });
    } catch (error) {
        console.error("FUND DELETE ERROR:", error);

        return NextResponse.json(
            { error: "Failed to delete fund record." },
            { status: 500 }
        );
    }
}