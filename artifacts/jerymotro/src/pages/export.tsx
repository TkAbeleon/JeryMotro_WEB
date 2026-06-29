import { useState, useMemo } from "react";
import { useGetMe, useListDetections } from "@workspace/api-client-react";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import { subDays, format } from "date-fns";
import { Download, FileText, FileJson, Lock, Calendar as CalendarIcon } from "lucide-react";

function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ExportPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const meQ = useGetMe();
  const profile = meQ.data ?? user ?? {
    id: 0,
    email: "",
    full_name: "",
    organization: "",
    role: "standard",
    is_active: false,
  };

  const isPremium = profile?.role === "admin" || profile?.role === "premium";

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const now = new Date();
    return {
      from: subDays(now, 30),
      to: now
    };
  });

  const [exportFormat, setExportFormat] = useState<"csv" | "json" | "pdf">("csv");
  const [isExporting, setIsExporting] = useState(false);

  const { dateFrom, dateTo } = useMemo(() => {
    return {
      dateFrom: formatDateForAPI(dateRange.from),
      dateTo: formatDateForAPI(dateRange.to)
    };
  }, [dateRange]);

  const detectionsQ = useListDetections({ 
    limit: 10000, 
    date_from: dateFrom,
    date_to: dateTo 
  });

  const detections = detectionsQ.data?.detections || [];

  const exportToCSV = () => {
    if (!detections.length) return;
    
    const headers = ["Date", "Region", "Latitude", "Longitude", "Risk Score", "Confidence", "Brightness", "Source", "FRP"];
    const rows = detections.map(d => [
      d.inserted_at || d.acq_date || "",
      d.region || "",
      d.latitude?.toFixed(6) || "",
      d.longitude?.toFixed(6) || "",
      d.risk_score?.toFixed(2) || "",
      d.confidence || "",
      d.brightness || "",
      d.source || "",
      d.frp?.toFixed(2) || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `fires_export_${dateFrom}_to_${dateTo}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (!detections.length) return;

    const jsonContent = JSON.stringify(detections, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `fires_export_${dateFrom}_to_${dateTo}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    // Pour l'export PDF, nous allons créer un simple rapport texte
    if (!detections.length) return;

    const regionMap = detections.reduce((map, d) => {
      const region = d.region || "Autre";
      map[region] = (map[region] || 0) + 1;
      return map;
    }, {} as Record<string, number>);

    const regionSummary = Object.entries(regionMap)
      .map(([region, count]) => `${region}: ${count}`)
      .join("\n");

    const sourceMap = detections.reduce((map, d) => {
      const source = d.source || "Autre";
      map[source] = (map[source] || 0) + 1;
      return map;
    }, {} as Record<string, number>);

    const sourceSummary = Object.entries(sourceMap)
      .map(([source, count]) => `${source}: ${count}`)
      .join("\n");

    const reportContent = `
Rapport d'Export des Feux
=========================
Période: ${dateFrom} à ${dateTo}
Nombre total de détections: ${detections.length}

Résumé par région:
------------------
${regionSummary}

Résumé par niveau de risque:
----------------------------
Critique (>=0.7): ${detections.filter(d => (d.risk_score ?? 0) >= 0.7).length}
Élevé (0.5-0.7): ${detections.filter(d => (d.risk_score ?? 0) >= 0.5 && (d.risk_score ?? 0) < 0.7).length}
Moyen (0.3-0.5): ${detections.filter(d => (d.risk_score ?? 0) >= 0.3 && (d.risk_score ?? 0) < 0.5).length}
Faible (<0.3): ${detections.filter(d => (d.risk_score ?? 0) < 0.3).length}

Résumé par source:
------------------
${sourceSummary}
`;

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `fires_report_${dateFrom}_to_${dateTo}.txt`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    if (!isPremium) return;
    
    setIsExporting(true);
    try {
      await detectionsQ.refetch();
      
      switch (exportFormat) {
        case "csv":
          exportToCSV();
          break;
        case "json":
          exportToJSON();
          break;
        case "pdf":
          exportToPDF();
          break;
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-card-border rounded-xl p-8 text-center">
            <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-heading text-2xl font-bold mb-2">{t("export.title")}</h1>
            <p className="text-muted-foreground mb-6">{t("export.premiumRequired")}</p>
            <a href="/subscriptions" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              {t("export.upgradeToPremium")}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t("export.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("export.subtitle")}</p>
      </div>

      {/* Date Range Selection */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h2 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          {t("export.dateRange")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("export.dateFrom")}</label>
            <input
              type="date"
              value={formatDateForAPI(dateRange.from)}
              min="2020-01-01"
              max={formatDateForAPI(new Date())}
              onChange={(e) => {
                const [year, month, day] = e.target.value.split('-').map(Number);
                const newFrom = new Date(year, month - 1, day);
                setDateRange({ ...dateRange, from: newFrom, to: dateRange.to < newFrom ? newFrom : dateRange.to });
              }}
              className="w-full px-3 py-2 text-sm rounded border border-border bg-card"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("export.dateTo")}</label>
            <input
              type="date"
              value={formatDateForAPI(dateRange.to)}
              min={formatDateForAPI(dateRange.from)}
              max={formatDateForAPI(new Date())}
              onChange={(e) => {
                const [year, month, day] = e.target.value.split('-').map(Number);
                const newTo = new Date(year, month - 1, day);
                setDateRange({ ...dateRange, to: newTo, from: dateRange.from > newTo ? newTo : dateRange.from });
              }}
              className="w-full px-3 py-2 text-sm rounded border border-border bg-card"
            />
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          {t("export.range")}: {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
          <span className="ml-2 text-muted-foreground/60">
            ({Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} {t("export.days")})
          </span>
        </div>
      </div>

      {/* Format Selection */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h2 className="font-heading font-semibold mb-4">{t("export.format")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: "csv", icon: FileText, label: "CSV", desc: "Excel compatible" },
            { id: "json", icon: FileJson, label: "JSON", desc: "Developer friendly" },
            { id: "pdf", icon: FileText, label: "PDF", desc: "Printable report" }
          ].map(format => {
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                onClick={() => setExportFormat(format.id as any)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  exportFormat === format.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-border/50"
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${exportFormat === format.id ? "text-primary" : "text-muted-foreground"}`} />
                <div className="font-medium text-sm">{format.label}</div>
                <div className="text-xs text-muted-foreground">{format.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Export Button */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-semibold">{t("export.ready")}</h2>
            <p className="text-sm text-muted-foreground">
              {detectionsQ.isLoading ? t("export.loading") : t("export.available", { count: detections.length })}
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting || detectionsQ.isLoading || detections.length === 0}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isExporting ? t("export.exporting") : t("export.export")}
          </button>
        </div>
      </div>
    </div>
  );
}
