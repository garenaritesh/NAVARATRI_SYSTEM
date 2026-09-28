"use client";

export default function PrintReportButton() {
    function printReport() {
        window.print();
    }

    return (
        <button
            type="button"
            onClick={printReport}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
            Download PDF
        </button>
    );
}