"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";

export async function updateFlatStatus(
    flatId: number,
    isClosed: boolean
) {
    try {
        if (!Number.isInteger(flatId) || flatId <= 0) {
            return {
                success: false,
                error: "Invalid flat ID.",
            };
        }

        const result = await sql`
      UPDATE flats
      SET is_closed = ${isClosed}
      WHERE id = ${flatId}
      RETURNING id, flat_number, is_closed;
    `;

        if (result.length === 0) {
            return {
                success: false,
                error: "Flat not found.",
            };
        }

        // Refresh floor pages
        revalidatePath("/building/C", "page");
        revalidatePath("/building/D", "page");

        return {
            success: true,
            isClosed: Boolean(result[0].is_closed),
        };
    } catch (error) {
        console.error("UPDATE FLAT STATUS ERROR:", error);

        return {
            success: false,
            error: "Failed to update flat status.",
        };
    }
}