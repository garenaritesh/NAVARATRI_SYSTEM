import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(
    request: Request,
    { params }: Props
) {
    try {
        const { id } = await params;

        const expenseId = Number(id);

        if (!Number.isInteger(expenseId) || expenseId <= 0) {
            return NextResponse.json(
                { error: "Invalid expense ID." },
                { status: 400 }
            );
        }

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
      UPDATE expenses
      SET
        title = ${title},
        amount = ${amount}
      WHERE id = ${expenseId}
      RETURNING id, title, amount, spent_at;
    `;

        if (result.length === 0) {
            return NextResponse.json(
                { error: "Expense not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            expense: result[0],
        });
    } catch (error) {
        console.error("Expense update error:", error);

        return NextResponse.json(
            { error: "Failed to update expense." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: Props
) {
    try {
        const { id } = await params;

        const expenseId = Number(id);

        if (!Number.isInteger(expenseId) || expenseId <= 0) {
            return NextResponse.json(
                { error: "Invalid expense ID." },
                { status: 400 }
            );
        }

        const result = await sql`
      DELETE FROM expenses
      WHERE id = ${expenseId}
      RETURNING id;
    `;

        if (result.length === 0) {
            return NextResponse.json(
                { error: "Expense not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Expense deleted successfully.",
        });
    } catch (error) {
        console.error("Expense delete error:", error);

        return NextResponse.json(
            { error: "Failed to delete expense." },
            { status: 500 }
        );
    }
}