import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const title = body.title?.trim();
        const amount = Number(body.amount);

        if (!title) {
            return NextResponse.json(
                { error: "Please enter expense title." },
                { status: 400 }
            );
        }

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: "Please enter a valid amount." },
                { status: 400 }
            );
        }

        const result = await sql`
      INSERT INTO expenses (
        title,
        amount
      )
      VALUES (
        ${title},
        ${amount}
      )
      RETURNING
        id,
        title,
        amount,
        spent_at;
    `;

        return NextResponse.json({
            success: true,
            message: "Expense added successfully.",
            expense: result[0],
        });
    } catch (error) {
        console.error("Expense save error:", error);

        return NextResponse.json(
            { error: "Failed to add expense." },
            { status: 500 }
        );
    }
}