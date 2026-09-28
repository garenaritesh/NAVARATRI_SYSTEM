import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const flatId = Number(body.flatId);
        const amount = Number(body.amount);
        const paymentMode = body.paymentMode;
        const note = body.note?.trim() || null;

        // Validation
        if (!flatId || !Number.isInteger(flatId)) {
            return NextResponse.json(
                { error: "Invalid flat." },
                { status: 400 }
            );
        }

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: "Invalid amount." },
                { status: 400 }
            );
        }

        if (
            paymentMode !== "cash" &&
            paymentMode !== "online"
        ) {
            return NextResponse.json(
                { error: "Invalid payment mode." },
                { status: 400 }
            );
        }

        // Check flat exists
        const flat = await sql`
      SELECT id
      FROM flats
      WHERE id = ${flatId}
      LIMIT 1;
    `;

        if (flat.length === 0) {
            return NextResponse.json(
                { error: "Flat not found." },
                { status: 404 }
            );
        }

        // Save fund
        const result = await sql`
      INSERT INTO funds (
        flat_id,
        amount,
        payment_mode,
        note
      )
      VALUES (
        ${flatId},
        ${amount},
        ${paymentMode},
        ${note}
      )
      RETURNING
        id,
        flat_id,
        amount,
        payment_mode,
        note,
        collected_at;
    `;

        return NextResponse.json({
            success: true,
            message: "Fund saved successfully.",
            fund: result[0],
        });

    } catch (error) {
        console.error("Fund save error:", error);

        return NextResponse.json(
            { error: "Failed to save fund." },
            { status: 500 }
        );
    }
}