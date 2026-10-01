import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (body.pin !== "1818") {
            return NextResponse.json(
                { error: "Unauthorized." },
                { status: 401 }
            );
        }

        await sql`BEGIN`;

        try {
            await sql`DELETE FROM funds`;
            await sql`DELETE FROM expenses`;

            await sql`
        UPDATE flats
        SET is_closed = FALSE
      `;

            await sql`COMMIT`;

            return NextResponse.json({
                success: true,
                message: "All Navratri data cleared successfully.",
            });
        } catch (error) {
            await sql`ROLLBACK`;
            throw error;
        }
    } catch (error) {
        console.error("CLEAR DATA ERROR:", error);

        return NextResponse.json(
            { error: "Failed to clear data." },
            { status: 500 }
        );
    }
}