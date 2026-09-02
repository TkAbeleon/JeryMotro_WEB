import { useMemo, useState } from "react";
import { useGetMe, useListDetections } from "@workspace/api-client-react";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import { subDays, format } from "date-fns";
import { Download, FileJson, FileText, Lock, Calendar as CalendarIcon, Loader2 } from "lucide-react";

function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ExportPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const meQ = useGetMe();
  const profile = meQ.data ?? user ?? { role: "standard" };
  const isPremium = profile?.role === "admin" || profile?.role === "premium";
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const now = new Date();
    return { from: subDays(now, 30), to: now };
  });
  const [exportFormat, setExportFormat] = useState<"csv" | "json" | "pdf">("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const { dateFrom, dateTo } = useMemo(() => ({ dateFrom: formatDateForAPI(dateRange.from), dateTo: formatDateForAPI(dateRange.to) }), [dateRange]);
  const detectionsQ = useListDetections({ limit: 10000, date_from: dateFrom, date_to: dateTo });
  const detections = detectionsQ.data?.detections || [];

  const downloadBlob = (content: BlobPart, type: string, filename: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportToCSV = () => {
    const headers = ["Date", "Region", "Latitude", "Longitude", "Risk Score", "Confidence", "Brightness", "Source", "FRP"];
    const escapeCSV = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = detections.map((d) => [d.acq_date || d.inserted_at || "", d.region || "", d.latitude?.toFixed(6) || "", d.longitude?.toFixed(6) || "", d.risk_score?.toFixed(2) || "", d.confidence ?? d.confidence_num ?? "", d.brightness || "", d.source || "", d.frp?.toFixed(2) || ""]);
    downloadBlob([headers.map(escapeCSV).join(","), ...rows.map((row) => row.map(escapeCSV).join(","))].join("\n"), "text/csv;charset=utf-8;", `fires_export_${dateFrom}_to_${dateTo}.csv`);
  };

  const exportToJSON = () => {
    downloadBlob(JSON.stringify({ generated_at: new Date().toISOString(), period: { from: dateFrom, to: dateTo }, count: detections.length, detections }, null, 2), "application/json;charset=utf-8;", `fires_export_${dateFrom}_to_${dateTo}.json`);
  };

  const exportToPDF = async () => {
    const { generateJeryMotroPdf } = await import("@/lib/pdf-report");
    const blob = await generateJeryMotroPdf(detections, dateFrom, dateTo);
    downloadBlob(blob, "application/pdf", `jerymotro_rapport_${dateFrom}_to_${dateTo}.pdf`);
  };

  const handleExport = async () => {
    if (!isPremium || !detections.length || isExporting) return;
    setIsExporting(true);
    setExportError(null);
    try {
      if (exportFormat === "csv") exportToCSV();
      else if (exportFormat === "json") exportToJSON();
      else await exportToPDF();
    } catch (error) {
      console.error("JeryMotro export failed:", error);
      setExportError("La génération du PDF a échoué. Aucun fichier incomplet n’a été téléchargé.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isPremium) return <div className="p-4 sm:p-6"><div className="mx-auto max-w-2xl rounded-xl border border-card-border bg-card p-6 text-center sm:p-8"><Lock className="mx-auto mb-4 h-14 w-14 text-muted-foreground sm:h-16 sm:w-16" /><h1 className="mb-2 font-heading text-2xl font-bold">{t("export.title")}</h1><p className="mb-6 text-muted-foreground">{t("export.premiumRequired")}</p><a href="/subscriptions" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90 sm:w-auto">{t("export.upgradeToPremium")}</a></div></div>;

  return <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:space-y-6 sm:p-6">
    <div><h1 className="font-heading text-2xl font-bold">{t("export.title")}</h1><p className="mt-1 text-sm text-muted-foreground">{t("export.subtitle")}</p></div>
    <div className="rounded-xl border border-card-border bg-card p-5 sm:p-6"><h2 className="mb-4 flex items-center gap-2 font-heading font-semibold"><CalendarIcon className="h-4 w-4" />{t("export.dateRange")}</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="space-y-2"><label className="text-sm font-medium">{t("export.dateFrom")}</label><input type="date" value={formatDateForAPI(dateRange.from)} min="2020-01-01" max={formatDateForAPI(new Date())} onChange={e => { const [y,m,d] = e.target.value.split("-").map(Number); const from = new Date(y,m-1,d); setDateRange({ ...dateRange, from, to: dateRange.to < from ? from : dateRange.to }); }} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" /></div><div className="space-y-2"><label className="text-sm font-medium">{t("export.dateTo")}</label><input type="date" value={formatDateForAPI(dateRange.to)} min={formatDateForAPI(dateRange.from)} max={formatDateForAPI(new Date())} onChange={e => { const [y,m,d] = e.target.value.split("-").map(Number); const to = new Date(y,m-1,d); setDateRange({ ...dateRange, to, from: dateRange.from > to ? to : dateRange.from }); }} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" /></div></div><div className="mt-3 text-xs text-muted-foreground">{t("export.range")}: {format(dateRange.from,"dd/MM/yyyy")} - {format(dateRange.to,"dd/MM/yyyy")} <span className="ml-1 text-muted-foreground/60">({Math.ceil((dateRange.to.getTime()-dateRange.from.getTime())/86400000)} {t("export.days")})</span></div></div>
    <div className="rounded-xl border border-card-border bg-card p-5 sm:p-6"><h2 className="mb-4 font-heading font-semibold">{t("export.format")}</h2><div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{[{id:"csv",icon:FileText,label:"CSV",desc:"Excel compatible"},{id:"json",icon:FileJson,label:"JSON",desc:"Developer friendly"},{id:"pdf",icon:FileText,label:"PDF",desc:"PDF professionnel"}].map(item => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => { setExportFormat(item.id as "csv"|"json"|"pdf"); setExportError(null); }} className={`min-h-24 rounded-lg border-2 p-4 text-left transition-all ${exportFormat===item.id ? "border-primary bg-primary/5" : "border-border hover:border-border/60"}`}><Icon className={`mb-2 h-5 w-5 ${exportFormat===item.id ? "text-primary" : "text-muted-foreground"}`} /><div className="text-sm font-medium">{item.label}</div><div className="text-xs text-muted-foreground">{item.desc}</div></button>; })}</div></div>
    {exportError && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{exportError}</div>}
    <div className="rounded-xl border border-card-border bg-card p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h2 className="font-heading font-semibold">{t("export.ready")}</h2><p className="mt-1 text-sm text-muted-foreground">{detectionsQ.isLoading ? t("export.loading") : t("export.available", {count:detections.length})}</p></div><button type="button" onClick={handleExport} disabled={isExporting || detectionsQ.isLoading || detections.length===0} className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{isExporting ? <><Loader2 className="h-4 w-4 animate-spin" />Génération du fichier…</> : <><Download className="h-4 w-4" />{t("export.export")}</>}</button></div></div>
  </div>;
}
