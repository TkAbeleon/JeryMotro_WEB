import { useMemo, useState } from "react";
import { useGetMe, useListDetections } from "@workspace/api-client-react";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import { subDays, format } from "date-fns";
import { Download, FileJson, FileText, Lock, Calendar as CalendarIcon } from "lucide-react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const pdfStyles = StyleSheet.create({
  page: { padding: 32, fontFamily: "Helvetica", fontSize: 8, color: "#172033", backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#172033", borderRadius: 10, padding: 18, marginBottom: 16, color: "#FFFFFF", flexDirection: "row", justifyContent: "space-between" },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  subtitle: { marginTop: 5, fontSize: 8, color: "#CBD5E1" },
  headerRight: { textAlign: "right", fontSize: 8, color: "#E2E8F0" },
  kpiGrid: { flexDirection: "row", gap: 8, marginBottom: 14 },
  kpi: { flex: 1, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 10 },
  kpiLabel: { color: "#64748B", fontSize: 7, marginBottom: 5 },
  kpiValue: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#172033" },
  section: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 12, marginBottom: 14 },
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 9, color: "#172033" },
  split: { flexDirection: "row", gap: 20 },
  splitItem: { flex: 1 },
  statRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#F1F5F9", paddingVertical: 5 },
  statName: { color: "#64748B", fontSize: 7.5 },
  statValue: { fontFamily: "Helvetica-Bold", fontSize: 7.5 },
  table: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: "#EEF2F7", paddingVertical: 7, paddingHorizontal: 5 },
  row: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingVertical: 6, paddingHorizontal: 5 },
  cellDate: { width: "12%" },
  cellRegion: { width: "19%" },
  cellCoord: { width: "12%" },
  cellRisk: { width: "10%" },
  cellConf: { width: "10%" },
  cellSource: { width: "17%" },
  cellFrp: { width: "10%" },
  cell: { fontSize: 6.5 },
  headCell: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: "#334155" },
  footer: { position: "absolute", bottom: 18, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", color: "#94A3B8", fontSize: 6.5 },
});

function PdfReport({ detections, dateFrom, dateTo }: { detections: any[]; dateFrom: string; dateTo: string }) {
  const risk = detections.reduce((acc, d) => {
    const score = Number(d.risk_score ?? 0);
    if (score >= 0.7) acc.critical += 1;
    else if (score >= 0.5) acc.high += 1;
    else if (score >= 0.3) acc.medium += 1;
    else acc.low += 1;
    return acc;
  }, { critical: 0, high: 0, medium: 0, low: 0 });

  const regions = detections.reduce((acc, d) => {
    const key = String(d.region || "Inconnue");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sources = detections.reduce((acc, d) => {
    const key = String(d.source || "Inconnue");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const kpis = [
    ["Détections", detections.length],
    ["Critiques", risk.critical],
    ["Élevées", risk.high],
    ["Moyennes", risk.medium],
    ["Faibles", risk.low],
  ];

  return (
    <Document title={`JeryMotro - Rapport ${dateFrom} - ${dateTo}`} author="JeryMotro">
      <Page size="A4" orientation="landscape" style={pdfStyles.page} wrap>
        <View style={pdfStyles.header}>
          <View>
            <Text style={pdfStyles.brand}>JERYMOTRO</Text>
            <Text style={pdfStyles.subtitle}>Rapport d’analyse des détections de feux à Madagascar</Text>
          </View>
          <View style={pdfStyles.headerRight}>
            <Text>Période analysée</Text>
            <Text>{dateFrom} → {dateTo}</Text>
            <Text>{format(new Date(), "dd/MM/yyyy HH:mm")}</Text>
          </View>
        </View>

        <View style={pdfStyles.kpiGrid}>
          {kpis.map(([label, value]) => (
            <View key={String(label)} style={pdfStyles.kpi}>
              <Text style={pdfStyles.kpiLabel}>{label}</Text>
              <Text style={pdfStyles.kpiValue}>{String(value)}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Synthèse des données</Text>
          <View style={pdfStyles.split}>
            <View style={pdfStyles.splitItem}>
              {Object.entries(regions).slice(0, 8).map(([name, count]) => (
                <View key={name} style={pdfStyles.statRow}><Text style={pdfStyles.statName}>{name}</Text><Text style={pdfStyles.statValue}>{String(count)}</Text></View>
              ))}
            </View>
            <View style={pdfStyles.splitItem}>
              {Object.entries(sources).slice(0, 8).map(([name, count]) => (
                <View key={name} style={pdfStyles.statRow}><Text style={pdfStyles.statName}>{name}</Text><Text style={pdfStyles.statValue}>{String(count)}</Text></View>
              ))}
            </View>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader} fixed>
            <Text style={[pdfStyles.headCell, pdfStyles.cellDate]}>DATE</Text>
            <Text style={[pdfStyles.headCell, pdfStyles.cellRegion]}>RÉGION</Text>
            <Text style={[pdfStyles.headCell, pdfStyles.cellCoord]}>LATITUDE</Text>
            <Text style={[pdfStyles.headCell, pdfStyles.cellCoord]}>LONGITUDE</Text>
            <Text style={[pdfStyles.headCell, pdfStyles.cellRisk]}>RISQUE</Text>
            <Text style={[pdfStyles.headCell, pdfStyles.cellConf]}>CONF.</Text>
            <Text style={[pdfStyles.headCell, pdfStyles.cellSource]}>SOURCE</Text>
            <Text style={[pdfStyles.headCell, pdfStyles.cellFrp]}>FRP</Text>
          </View>
          {detections.map((d, index) => {
            const riskScore = Number(d.risk_score ?? 0);
            return (
              <View key={`${d.id ?? "detection"}-${index}`} style={pdfStyles.row} wrap={false}>
                <Text style={[pdfStyles.cell, pdfStyles.cellDate]}>{String(d.acq_date || d.detected_at || d.inserted_at || "-").slice(0, 10)}</Text>
                <Text style={[pdfStyles.cell, pdfStyles.cellRegion]}>{String(d.region || "Inconnue").slice(0, 24)}</Text>
                <Text style={[pdfStyles.cell, pdfStyles.cellCoord]}>{Number(d.latitude).toFixed(4)}</Text>
                <Text style={[pdfStyles.cell, pdfStyles.cellCoord]}>{Number(d.longitude).toFixed(4)}</Text>
                <Text style={[pdfStyles.cell, pdfStyles.cellRisk]}>{(riskScore * 100).toFixed(1)}%</Text>
                <Text style={[pdfStyles.cell, pdfStyles.cellConf]}>{String(d.confidence ?? d.confidence_num ?? "-").slice(0, 9)}</Text>
                <Text style={[pdfStyles.cell, pdfStyles.cellSource]}>{String(d.source || "-").slice(0, 20)}</Text>
                <Text style={[pdfStyles.cell, pdfStyles.cellFrp]}>{Number.isFinite(Number(d.frp)) ? Number(d.frp).toFixed(2) : "-"}</Text>
              </View>
            );
          })}
        </View>

        <View style={pdfStyles.footer} fixed>
          <Text>JeryMotro · Plateforme d’aide à la détection et à l’analyse des feux</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
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
  const { dateFrom, dateTo } = useMemo(() => ({
    dateFrom: formatDateForAPI(dateRange.from),
    dateTo: formatDateForAPI(dateRange.to),
  }), [dateRange]);
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
    if (!detections.length) return;
    const headers = ["Date", "Region", "Latitude", "Longitude", "Risk Score", "Confidence", "Brightness", "Source", "FRP"];
    const escapeCSV = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = detections.map((d) => [d.acq_date || d.inserted_at || "", d.region || "", d.latitude?.toFixed(6) || "", d.longitude?.toFixed(6) || "", d.risk_score?.toFixed(2) || "", d.confidence ?? d.confidence_num ?? "", d.brightness || "", d.source || "", d.frp?.toFixed(2) || ""]);
    downloadBlob([headers.map(escapeCSV).join(","), ...rows.map((row) => row.map(escapeCSV).join(","))].join("\n"), "text/csv;charset=utf-8;", `fires_export_${dateFrom}_to_${dateTo}.csv`);
  };

  const exportToJSON = () => {
    if (!detections.length) return;
    downloadBlob(JSON.stringify({ generated_at: new Date().toISOString(), period: { from: dateFrom, to: dateTo }, count: detections.length, detections }, null, 2), "application/json;charset=utf-8;", `fires_export_${dateFrom}_to_${dateTo}.json`);
  };

  const exportToPDF = async () => {
    if (!detections.length) return;
    const blob = await pdf(<PdfReport detections={detections} dateFrom={dateFrom} dateTo={dateTo} />).toBlob();
    downloadBlob(blob, "application/pdf", `jerymotro_rapport_${dateFrom}_to_${dateTo}.pdf`);
  };

  const handleExport = async () => {
    if (!isPremium || !detections.length) return;
    setIsExporting(true);
    try {
      switch (exportFormat) {
        case "csv": exportToCSV(); break;
        case "json": exportToJSON(); break;
        case "pdf": await exportToPDF(); break;
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
    <div className="rounded-xl border border-card-border bg-card p-5 sm:p-6"><h2 className="mb-4 flex items-center gap-2 font-heading font-semibold"><CalendarIcon className="h-4 w-4" />{t("export.dateRange")}</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="space-y-2"><label className="text-sm font-medium">{t("export.dateFrom")}</label><input type="date" value={formatDateForAPI(dateRange.from)} min="2020-01-01" max={formatDateForAPI(new Date())} onChange={e => { const [y,m,d] = e.target.value.split("-").map(Number); const from = new Date(y,m-1,d); setDateRange({ ...dateRange, from, to: dateRange.to < from ? from : dateRange.to }); }} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" /></div><div className="space-y-2"><label className="text-sm font-medium">{t("export.dateTo")}</label><input type="date" value={formatDateForAPI(dateRange.to)} min={formatDateForAPI(dateRange.from)} max={formatDateForAPI(new Date())} onChange={e => { const [y,m,d] = e.target.value.split("-").map(Number); const to = new Date(y,m-1,d); setDateRange({ ...dateRange, to, from: dateRange.from > to ? to : dateRange.from }); }} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" /></div></div><div className="mt-3 text-xs text-muted-foreground">{t("export.range")}: {format(dateRange.from,"dd/MM/yyyy")} - {format(dateRange.to,"dd/MM/yyyy")} <span className="ml-1 text-muted-foreground/60">({Math.ceil((dateRange.to.getTime()-dateRange.from.getTime())/86400000)} {t("export.days")})</span></div></div>
    <div className="rounded-xl border border-card-border bg-card p-5 sm:p-6"><h2 className="mb-4 font-heading font-semibold">{t("export.format")}</h2><div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{[{id:"csv",icon:FileText,label:"CSV",desc:"Excel compatible"},{id:"json",icon:FileJson,label:"JSON",desc:"Developer friendly"},{id:"pdf",icon:FileText,label:"PDF",desc:"Rapport professionnel"}].map(item => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => setExportFormat(item.id as "csv"|"json"|"pdf")} className={`min-h-24 rounded-lg border-2 p-4 text-left transition-all ${exportFormat===item.id ? "border-primary bg-primary/5" : "border-border hover:border-border/60"}`}><Icon className={`mb-2 h-5 w-5 ${exportFormat===item.id ? "text-primary" : "text-muted-foreground"}`} /><div className="text-sm font-medium">{item.label}</div><div className="text-xs text-muted-foreground">{item.desc}</div></button>; })}</div></div>
    <div className="rounded-xl border border-card-border bg-card p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h2 className="font-heading font-semibold">{t("export.ready")}</h2><p className="mt-1 text-sm text-muted-foreground">{detectionsQ.isLoading ? t("export.loading") : t("export.available", {count:detections.length})}</p></div><button type="button" onClick={handleExport} disabled={isExporting || detectionsQ.isLoading || detections.length===0} className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"><Download className="h-4 w-4" />{isExporting ? t("export.exporting") : t("export.export")}</button></div></div>
  </div>;
}
