"use client";

import { useState } from "react";
import { FileSpreadsheet } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

export type PaymentExportItem = {
  receiptNumber?: string;
  staffCode: string;
  employeeName: string;
  departmentName: string;
  periodLabel: string;
  amount: number;
  paymentMethod: string;
  paymentKind?: string;
  dateStr: string;
  authorizedBy?: string | null;
};

export function ExportPaymentsExcelButton({
  items,
  filename = "AimHop_Disbursements.xlsx",
  label = "Export Excel (.xlsx)",
}: {
  items: PaymentExportItem[];
  filename?: string;
  label?: string;
}) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!items || items.length === 0) {
      alert("No disbursement records available to export.");
      return;
    }

    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const rows = items.map((p, idx) => ({
        "S.No": idx + 1,
        "Receipt No": p.receiptNumber || "-",
        "Staff Code": p.staffCode,
        "Employee Name": p.employeeName,
        "Department": p.departmentName,
        "Disbursement Period": p.periodLabel,
        "Amount (INR)": p.amount,
        "Payment Method": (p.paymentMethod || "").replace("_", " ").toUpperCase(),
        "Payment Type": (p.paymentKind || "salary").toUpperCase(),
        "Payment Date": p.dateStr,
        "Authorized By": p.authorizedBy || "Accounts Officer",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);

      // Auto column widths
      ws["!cols"] = [
        { wch: 6 },
        { wch: 18 },
        { wch: 14 },
        { wch: 24 },
        { wch: 18 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 20 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Salary Payments");
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error("Excel export failed", err);
      alert("Could not export Excel file.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exporting || items.length === 0}
      loading={exporting}
      className="gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 font-semibold cursor-pointer text-xs"
    >
      <FileSpreadsheet size={14} className="text-emerald-700" />
      <span>{exporting ? "Exporting..." : label}</span>
    </Button>
  );
}
