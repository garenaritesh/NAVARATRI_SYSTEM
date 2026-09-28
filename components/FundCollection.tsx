"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";

type Props = {
    flatId: number;
    flatNumber: string;
    collected: boolean;
};

export default function FundCollection({
    flatId,
    flatNumber,
    collected,
}: Props) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState<"cash" | "online">("cash");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [mounted, setMounted] = useState(false);

    // Apni actual UPI ID yaha rakho
    const upiId = "YOUR-UPI-ID@upi";

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    const upiUrl =
        amount && Number(amount) > 0 && upiId
            ? `upi://pay?pa=${encodeURIComponent(
                upiId
            )}&pn=${encodeURIComponent(
                "SUMANDHAM SOCIETY"
            )}&am=${Number(amount).toFixed(2)}&cu=INR`
            : "";

    async function saveFund() {
        setMessage("");

        if (!amount || Number(amount) <= 0) {
            setMessage("Please enter a valid amount.");
            return;
        }

        if (paymentMode === "online" && !upiId.trim()) {
            setMessage("Please set the society UPI ID first.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch("/api/funds", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    flatId,
                    amount: Number(amount),
                    paymentMode,
                    note,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Failed to save fund.");
                return;
            }

            setMessage("Fund saved successfully!");

            setAmount("");
            setNote("");
            setPaymentMode("cash");

            setTimeout(() => {
                window.location.reload();
            }, 700);
        } catch (error) {
            console.error(error);
            setMessage("Unable to save fund.");
        } finally {
            setSaving(false);
        }
    }

    function closeModal() {
        if (saving) return;

        setOpen(false);
        setAmount("");
        setNote("");
        setPaymentMode("cash");
        setMessage("");
    }

    if (collected) {
        return (
            <div className="flex w-full items-center justify-center rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                ✓ Fund Collected
            </div>
        );
    }

    const modal = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    closeModal();
                }
            }}
        >
            <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            SUMANDHAM SOCIETY
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-slate-900">
                            Flat {flatNumber}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={closeModal}
                        disabled={saving}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-600 hover:bg-slate-200"
                    >
                        ×
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">

                    {/* Amount */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Fund Amount
                        </label>

                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-700">
                                ₹
                            </span>

                            <input
                                type="number"
                                min="1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                                autoFocus
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pl-9 text-base font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                            />
                        </div>
                    </div>

                    {/* Payment Mode */}
                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Payment Mode
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPaymentMode("cash")}
                                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${paymentMode === "cash"
                                        ? "border-green-500 bg-green-50 text-green-700"
                                        : "border-slate-200 bg-white text-slate-600"
                                    }`}
                            >
                                💵 Cash
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentMode("online")}
                                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${paymentMode === "online"
                                        ? "border-purple-500 bg-purple-50 text-purple-700"
                                        : "border-slate-200 bg-white text-slate-600"
                                    }`}
                            >
                                📱 Online
                            </button>
                        </div>
                    </div>

                    {/* QR */}
                    {paymentMode === "online" &&
                        amount &&
                        Number(amount) > 0 &&
                        upiUrl && (
                            <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50 p-4 text-center">
                                <p className="text-sm font-semibold text-slate-700">
                                    Scan to Pay
                                </p>

                                <p className="mt-1 text-2xl font-bold text-purple-700">
                                    ₹{Number(amount).toLocaleString("en-IN")}
                                </p>

                                <div className="mt-4 flex justify-center">
                                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                                        <QRCodeSVG
                                            value={upiUrl}
                                            size={190}
                                            level="M"
                                            marginSize={4}
                                        />
                                    </div>
                                </div>

                                <p className="mt-3 text-xs text-slate-500">
                                    Scan the QR using any UPI app.
                                </p>

                                <p className="mt-1 text-xs font-medium text-slate-600">
                                    After payment, click Save Fund.
                                </p>
                            </div>
                        )}

                    {/* Note */}
                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Note{" "}
                            <span className="font-normal text-slate-400">
                                (Optional)
                            </span>
                        </label>

                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Enter note..."
                            rows={3}
                            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                        />
                    </div>

                    {/* Message */}
                    {message && (
                        <div
                            className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${message.toLowerCase().includes("success")
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                        >
                            {message}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={closeModal}
                            disabled={saving}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={saveFund}
                            disabled={saving}
                            className="rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Saving..." : "Save Fund"}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );

    return (
        <>
            {/* Collect Fund Button */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
                Collect Fund
            </button>

            {/* Render modal directly in body */}
            {open && mounted
                ? createPortal(modal, document.body)
                : null}
        </>
    );
}