import { useState, useMemo } from "react";
import { useGetMe, useListDetections } from "@workspace/api-client-react";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import { subDays, format } from "date-fns";
import { Download, FileText, FileJson, Lock, Calendar as CalendarIcon } from "lucide-react";

function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pdfText(value: unknown, maxLength = 60): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/[\\()]/g, (char) => `\\${char}`)
    .slice(0, maxLength);
}

function pdfNumber(value: unknown, fallback = "-") {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : fallback;
}

function buildPdf(pages: string[]): Blob {
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [PAGE_REFS] /Count PAGE_COUNT >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  const pageRefs: string[] = [];
  pages.forEach((content) => {
    const contentObject = objects.length + 2;
    const pageObject = objects.length + 3;
    objects.push(`<< /Length ${content.length} >>\\nstream\\n${content}\\nendstream`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObject} 0 R >>`);
    pageRefs.push(`${pageObject} 0 R`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pages.length} >>`;

  let pdf = "%PDF-1.4\\n%\\xE2\\xE3\\xCF\\xD3\\n";
  const offsets: number[] = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length;
    pdf += `${index + 1} 0 obj\\n${object}\\nendobj\\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\\n0 ${objects.length + 1}\\n0000000000 65535 f \\n`;
  for (let i = 1; i <= objects.length; i++) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \\n`;
  pdf += `trailer\\n<< /Size ${objects.length + 1} /Root 1 0 R >>\\nstartxref\\n${xrefOffset}\\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function buildPdfContent(detections: any[], dateFrom: string, dateTo: string): string[] {
  const pageWidth = 842;
  const margin = 32;
  const regionMap = detections.reduce((map, d) => { const key = d.region || "Autre"; map[key] = (map[key] || 0) + 1; return map; }, {} as Record<string, number>);
  const sourceMap = detections.reduce((map, d) => { const key = d.source || "Autre"; map[key] = (map[key] || 0) + 1; return map; }, {} as Record<string, number>);
  const riskCounts = {
    critical: detections.filter((d) => (d.risk_score ?? 0) >= 0.7).length,
    high: detections.filter((d) => (d.risk_score ?? 0) >= 0.5 && (d.risk_score ?? 0) < 0.7).length,
    medium: detections.filter((d) => (d.risk_score ?? 0) >= 0.3 && (d.risk_score ?? 0) < 0.5).length,
    low: detections.filter((d) => (d.risk_score ?? 0) < 0.3).length,
  };

  const pageRows = 26;
  const chunks: any[][] = [];
  for (let i = 0; i < detections.length; i += pageRows) chunks.push(detections.slice(i, i + pageRows));
  if (!chunks.length) chunks.push([]);

  return chunks.map((rows, pageIndex) => {
    const commands: string[] = [];
    const text = (x: number, y: number, value: string, size = 9, bold = false) => {
      commands.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${pdfText(value)}) Tj ET`);
    };
    const rect = (x: number, y: number, w: number, h: number, fill = false) => commands.push(`${fill ? "0.97 0.98 0.99 rg" : "0.82 0.84 0.87 RG"} ${x} ${y} ${w} ${h} re ${fill ? "f" : "S"}`);
    const line = (x1: number, y1: number, x2: number, y2: number) => commands.push(`0.88 0.89 0.91 RG ${x1} ${y1} m ${x2} ${y2} l S`);

    rect(0, 0, pageWidth, 595, true);
    commands.push("0.10 0.12 0.16 rg");
    commands.push(`32 520 778 45 re f`);
    text(margin + 14, 545, "JERYMOTRO", 18, true);
    text(margin + 14, 530, "Rapport d'export des donnees de detections", 9, false);
    text(680, 545, `Page ${pageIndex + 1}/${chunks.length}`, 9, true);
    text(680, 530, `${dateFrom} -> ${dateTo}`, 8, false);

    if (pageIndex === 0) {
      const kpis = [
        ["Detections", String(detections.length)],
        ["Critiques", String(riskCounts.critical)],
        ["Eleves", String(riskCounts.high)],
        ["Moyens", String(riskCounts.medium)],
        ["Faibles", String(riskCounts.low)],
      ];
      kpis.forEach(([label, value], index) => {
        const x = margin + index * 155;
        rect(x, 462, 142, 42, false);
        text(x + 10, 488, label, 8, false);
        text(x + 10, 471, value, 15, true);
      });
      rect(32, 382, 380, 62, false);
      rect(430, 382, 380, 62, false);
      text(44, 425, "Repartition par region", 9, true);
      text(442, 425, "Repartition par source", 9, true);
      Object.entries(regionMap).slice(0, 6).forEach(([region, count], index) => text(44, 409 - index * 12, `${region}: ${count}`, 8));
      Object.entries(sourceMap).slice(0, 6).forEach(([source, count], index) => text(442, 409 - index * 12, `${source}: ${count}`, 8));
    }

    const tableTop = pageIndex === 0 ? 350 : 505;
    const headers = ["Date", "Region", "Latitude", "Longitude", "Risque", "Conf.", "Source", "FRP"];
    const widths = [88, 128, 72, 72, 58, 55, 72, 55];
    let x = margin;
    headers.forEach((header, index) => { rect(x, tableTop, widths[index], 22, true); text(x + 5, tableTop + 8, header, 7.5, true); x += widths[index]; });
    let y = tableTop - 13;
    rows.forEach((d) => {
      x = margin;
      const dateValue = d.acq_date || d.detected_at || d.inserted_at || "";
      const risk = Number(d.risk_score ?? 0);
      const values = [
        String(dateValue).slice(0, 10),
        String(d.region || "Inconnue"),
        Number(d.latitude).toFixed(4),
        Number(d.longitude).toFixed(4),
        `${(risk * 100).toFixed(1)}%`,
        String(d.confidence ?? d.confidence_num ?? "-").slice(0, 8),
        String(d.source || "-").slice(0, 10),
        pdfNumber(d.frp, "-")
      ];
      values.forEach((value, index) => { text(x + 5, y, value, 7); x += widths[index]; });
      line(margin, y - 4, pageWidth - margin, y - 4);
      y -= 17;
    });

    text(32, 22, "JeryMotro - Aide a la detection et a l'analyse des feux a Madagascar", 7, false);
    return commands.join("\\n");
  });
}

export default function ExportPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const meQ = useGetMe();
  const profile = meQ.data ?? user ?? { id: 0, email: "", full_name: "", organization: "", role: "standard", is_active: false };
  const isPremium = profile?.role === "admin" || profile?.role === "premium";
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => { const now = new Date(); return { from: subDays(now, 30), to: now }; });
  const [exportFormat, setExportFormat] = useState<"csv" | "json" | "pdf">("csv");
  const [isExporting, setIsExporting] = useState(false);
  const { dateFrom, dateTo } = useMemo(() => ({ dateFrom: formatDateForAPI(dateRange.from), dateTo: formatDateForAPI(dateRange.to) }), [dateRange]);
  const detectionsQ = useListDetections({ limit: 10000, date_from: dateFrom, date_to: dateTo });
  const detections = detectionsQ.data?.detections || [];

  const downloadBlob = (content: BlobPart, type: string, filename: string) => {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportToCSV = () => {
    if (!detections.length) return;
    const headers = ["Date", "Region", "Latitude", "Longitude", "Risk Score", "Confidence", "Brightness", "Source", "FRP"];
    const escapeCSV = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = detections.map(d => [d.acq_date || d.inserted_at || "", d.region || "", d.latitude?.toFixed(6) || "", d.longitude?.toFixed(6) || "", d.risk_score?.toFixed(2) || "", d.confidence ?? d.confidence_num ?? "", d.brightness || "", d.source || "", d.frp?.toFixed(2) || ""]);
    downloadBlob([headers.map(escapeCSV).join(","), ...rows.map(row => row.map(escapeCSV).join(","))].join("\n"), "text/csv;charset=utf-8;", `fires_export_${dateFrom}_to_${dateTo}.csv`);
  };

  const exportToJSON = () => {
    if (detections.length) downloadBlob(JSON.stringify({ generated_at: new Date().toISOString(), period: { from: dateFrom, to: dateTo }, count: detections.length, detections }, null, 2), "application/json;charset=utf-8;", `fires_export_${dateFrom}_to_${dateTo}.json`);
  };

  const exportToPDF = () => {
    if (!detections.length) return;
    const pages = buildPdfContent(detections, dateFrom, dateTo);
    const blob = buildPdf(pages);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jerymotro_rapport_${dateFrom}_to_${dateTo}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExport = async () => {
    if (!isPremium || !detections.length) return;
    setIsExporting(true);
    try {
      await detectionsQ.refetch();
      switch (exportFormat) {
        case "csv": exportToCSV(); break;
        case "json": exportToJSON(); break;
        case "pdf": exportToPDF(); break;
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isPremium) return <div className="p-4 sm:p-6"><div className="mx-auto max-w-2xl rounded-xl border border-card-border bg-card p-6 text-center sm:p-8"><Lock className="mx-auto mb-4 h-14 w-14 text-muted-foreground sm:h-16 sm:w-16" /><h1 className="mb-2 font-heading text-2xl font-bold">{t("export.title")}</h1><p className="mb-6 text-muted-foreground">{t("export.premiumRequired")}</p><a href="/subscriptions" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90 sm:w-auto">{t("export.upgradeToPremium")}</a></div></div>;

  return <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:space-y-6 sm:p-6">
    <div><h1 className="font-heading text-2xl font-bold">{t("export.title")}</h1><p className="mt-1 text-sm text-muted-foreground">{t("export.subtitle")}</p></div>
    <div className="rounded-xl border border-card-border bg-card p-5 sm:p-6"><h2 className="mb-4 flex items-center gap-2 font-heading font-semibold"><CalendarIcon className="h-4 w-4" />{t("export.dateRange")}</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="space-y-2"><label className="text-sm font-medium">{t("export.dateFrom")}</label><input type="date" value={formatDateForAPI(dateRange.from)} min="2020-01-01" max={formatDateForAPI(new Date())} onChange={e => { const [y,m,d] = e.target.value.split('-').map(Number); const from = new Date(y,m-1,d); setDateRange({ ...dateRange, from, to: dateRange.to < from ? from : dateRange.to }); }} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" /></div><div className="space-y-2"><label className="text-sm font-medium">{t("export.dateTo")}</label><input type="date" value={formatDateForAPI(dateRange.to)} min={formatDateForAPI(dateRange.from)} max={formatDateForAPI(new Date())} onChange={e => { const [y,m,d] = e.target.value.split('-').map(Number); const to = new Date(y,m-1,d); setDateRange({ ...dateRange, to, from: dateRange.from > to ? to : dateRange.from }); }} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" /></div></div><div className="mt-3 text-xs text-muted-foreground">{t("export.range")}: {format(dateRange.from,"dd/MM/yyyy")} - {format(dateRange.to,"dd/MM/yyyy")} <span className="ml-1 text-muted-foreground/60">({Math.ceil((dateRange.to.getTime()-dateRange.from.getTime())/86400000)} {t("export.days")})</span></div></div>
    <div className="rounded-xl border border-card-border bg-card p-5 sm:p-6"><h2 className="mb-4 font-heading font-semibold">{t("export.format")}</h2><div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{[{id:"csv",icon:FileText,label:"CSV",desc:"Excel compatible"},{id:"json",icon:FileJson,label:"JSON",desc:"Developer friendly"},{id:"pdf",icon:FileText,label:"PDF",desc:"Vrai fichier PDF"}].map(item => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => setExportFormat(item.id as "csv"|"json"|"pdf")} className={`min-h-24 rounded-lg border-2 p-4 text-left transition-all ${exportFormat===item.id ? "border-primary bg-primary/5" : "border-border hover:border-border/60"}`}><Icon className={`mb-2 h-5 w-5 ${exportFormat===item.id ? "text-primary" : "text-muted-foreground"}`} /><div className="text-sm font-medium">{item.label}</div><div className="text-xs text-muted-foreground">{item.desc}</div></button>; })}</div></div>
    <div className="rounded-xl border border-card-border bg-card p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h2 className="font-heading font-semibold">{t("export.ready")}</h2><p className="mt-1 text-sm text-muted-foreground">{detectionsQ.isLoading ? t("export.loading") : t("export.available", {count:detections.length})}</p></div><button type="button" onClick={handleExport} disabled={isExporting || detectionsQ.isLoading || detections.length===0} className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"><Download className="h-4 w-4" />{isExporting ? t("export.exporting") : t("export.export")}</button></div></div>
  </div>;
}
