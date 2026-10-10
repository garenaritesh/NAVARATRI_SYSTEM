
"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type FlatReport = {
    flatNumber: string;
    floorNumber: number;
    isClosed: boolean;
    amount: number;
};

export default function BuildingReportButton({
    building,
    flats,
    totalFund,
}: {
    building: string;
    flats: FlatReport[];
    totalFund: number;
}) {
    const [downloading, setDownloading] = useState(false);

    function downloadReport() {
        setDownloading(true);

        try {
            const doc = new jsPDF();

            const sortedFlats = [...flats].sort(
                (a, b) =>
                    a.floorNumber - b.floorNumber ||
                    Number(a.flatNumber) - Number(b.flatNumber)
            );

            const activeFlats = sortedFlats.filter(
                (flat) => !flat.isClosed
            );

            const collectedFlats = activeFlats.filter(
                (flat) => flat.amount > 0
            ).length;

            const pendingFlats = activeFlats.length - collectedFlats;

            doc.setFontSize(18);
            doc.text("SUMANDHAM SOCIETY", 105, 18, {
                align: "center",
            });

            doc.setFontSize(14);
            doc.text(`BUILDING ${building} - FUND REPORT`, 105, 28, {
                align: "center",
            });

            doc.setFontSize(10);
            doc.text(
                `Generated: ${new Date().toLocaleDateString("en-IN")}`,
                14,
                40
            );

            doc.text(
                `Total Active Flats: ${activeFlats.length}`,
                14,
                49
            );

            doc.text(
                `Collected Flats: ${collectedFlats}`,
                14,
                56
            );

            doc.text(
                `Pending Flats: ${pendingFlats}`,
                14,
                63
            );

            doc.text(
                `Total Fund Received: Rs. ${totalFund.toLocaleString("en-IN")}`,
                14,
                70
            );

            autoTable(doc, {
                startY: 79,
                head: [
                    [
                        "Sr. No.",
                        "Floor",
                        "Flat Number",
                        "Fund Paid (Rs.)",
                        "Status",
                    ],
                ],
                body: sortedFlats.map((flat, index) => [
                    index + 1,
                    flat.floorNumber,
                    flat.flatNumber,
                    flat.isClosed
                        ? "-"
                        : flat.amount.toLocaleString("en-IN"),
                    flat.isClosed
                        ? "Flat Closed"
                        : flat.amount > 0
                            ? "Collected"
                            : "Pending",
                ]),
                theme: "grid",
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                },
                headStyles: {
                    fillColor: [88, 28, 135],
                    textColor: 255,
                    fontStyle: "bold",
                },
                columnStyles: {
                    0: { cellWidth: 18 },
                    1: { cellWidth: 18 },
                    2: { cellWidth: 28 },
                    3: { cellWidth: 35 },
                    4: { cellWidth: 35 },
                },
                didDrawPage: () => {
                    const pageCount = doc.getNumberOfPages();

                    doc.setFontSize(8);
                    doc.text(
                        `SUMANDHAM SOCIETY | Page ${pageCount}`,
                        105,
                        290,
                        { align: "center" }
                    );
                },
            });

            doc.save(`Building-${building}-Fund-Report.pdf`);
        } catch (error) {
            console.error("PDF DOWNLOAD ERROR:", error);
            alert("Unable to generate PDF report.");
        } finally {
            setDownloading(false);
        }
    }

    return (
        <button
            type="button"
            onClick={downloadReport}
            disabled={downloading}
            className="rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-50"
        >
            {downloading ? "Generating PDF..." : "Download PDF Report"}
        </button>
    );
}
