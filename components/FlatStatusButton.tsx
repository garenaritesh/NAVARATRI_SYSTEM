"use client";

import { useState } from "react";
import { updateFlatStatus } from "@/app/actions/flats";

type Props = {
    flatId: number;
    isClosed: boolean;
};

export default function FlatStatusButton({
    flatId,
    isClosed,
}: Props) {
    const [loading, setLoading] = useState(false);

    async function changeStatus() {
        if (loading) return;

        setLoading(true);

        try {
            const result = await updateFlatStatus(
                flatId,
                !isClosed
            );

            if (!result.success) {
                alert(result.error || "Failed to update flat.");
                return;
            }

            // Refresh current page
            window.location.reload();
        } catch (error) {
            console.error("FLAT STATUS ERROR:", error);

            alert("Something went wrong while updating flat.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            type="button"
            onClick={changeStatus}
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {loading
                ? "Updating..."
                : isClosed
                    ? "Open Flat"
                    : "Mark as Closed"}
        </button>
    );
}