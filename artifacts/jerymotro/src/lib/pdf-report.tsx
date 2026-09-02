import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

export type PdfDetection = {
  id?: string | number;
  acq_date?: string | null;
  detected_at?: string | null;
  inserted_at?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  risk_score?: number | null;
  confidence?: string | number | null;
  confidence_num?: number | null;
  source?: string | null;
  frp?: number | null;
};

const MAX_PDF_ROWS = 2000;
const ROWS_PER_PAGE = 36;

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica", fontSize: 8, color: "#172033", backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#172033", borderRadius: 10, padding: 16, marginBottom: 14, color: "#FFFFFF", flexDirection: "row", justifyContent: "space-between" },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  subtitle: { marginTop: 4, fontSize: 8, color: "#CBD5E1" },
  headerRight: { textAlign: "right", fontSize: 8, color: "#E2E8F0" },
  kpis: { flexDirection: "row", marginBottom: 12 },
  kpi: { flex: 1, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 9, marginRight: 7 },
  kpiLast: { marginRight: 0 },
  kpiLabel: { color: "#64748B", fontSize: 7, marginBottom: 4 },
  kpiValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  summary: { flexDirection: "row", marginBottom: 12 },
  summaryBox: { flex: 1, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 10, marginRight: 8 },
  summaryLast: { marginRight: 0 },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 7 },
  statRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  statName: { fontSize: 7, color: "#64748B" },
  statValue: { fontSize: 7, fontFamily: "Helvetica-Bold" },
  table: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: "#EEF2F7", paddingVertical: 6, paddingHorizontal: 4 },
  row: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  headCell: { fontSize: 6.2, fontFamily: "Helvetica-Bold", color: "#334155" },
  cell: { fontSize: 6.1 },
  date: { width: "11%" },
  region: { width: "18%" },
  coord: { width: "12%" },
  risk: { width: "10%" },
  conf: { width: "10%" },
  source: { width: "17%" },
  frp: { width: "10%" },
  footer: { position: "absolute", bottom: 16, left: 30, right: 30, flexDirection: "row", justifyContent: "space-between", color: "#94A3B8", fontSize: 6.2 }
});

function safe(value: unknown, max = 28): string {
  return String(value ?? "-").replace(/[\r\n]+/g, " ").slice(0, max);
}

function dateValue(d: PdfDetection): string {
  return safe(d.acq_date || d.detected_at || d.inserted_at || "-", 10);
}

function numberValue(value: unknown, digits: number): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits) : "-";
}

function Table({ rows }: { rows: PdfDetection[] }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader} fixed>
        <Text style={[styles.headCell, styles.date]}>DATE</Text>
        <Text style={[styles.headCell, styles.region]}>REGION</Text>
        <Text style={[styles.headCell, styles.coord]}>LATITUDE</Text>
        <Text style={[styles.headCell, styles.coord]}>LONGITUDE</Text>
        <Text style={[styles.headCell, styles.risk]}>RISQUE</Text>
        <Text style={[styles.headCell, styles.conf]}>CONF.</Text>
        <Text style={[styles.headCell, styles.source]}>SOURCE</Text>
        <Text style={[styles.headCell, styles.frp]}>FRP</Text>
      </View>
      {rows.map((d, index) => {
        const risk = Number(d.risk_score ?? 0);
        return (
          <View key={`${d.id ?? "detection"}-${index}`} style={styles.row} wrap={false}>
            <Text style={[styles.cell, styles.date]}>{dateValue(d)}</Text>
            <Text style={[styles.cell, styles.region]}>{safe(d.region || "Inconnue")}</Text>
            <Text style={[styles.cell, styles.coord]}>{numberValue(d.latitude, 4)}</Text>
            <Text style={[styles.cell, styles.coord]}>{numberValue(d.longitude, 4)}</Text>
            <Text style={[styles.cell, styles.risk]}>{Number.isFinite(risk) ? `${(risk * 100).toFixed(1)}%` : "-"}</Text>
            <Text style={[styles.cell, styles.conf]}>{safe(d.confidence ?? d.confidence_num ?? "-", 9)}</Text>
            <Text style={[styles.cell, styles.source]}>{safe(d.source || "-", 20)}</Text>
            <Text style={[styles.cell, styles.frp]}>{numberValue(d.frp, 2)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function PdfReport({ detections, dateFrom, dateTo }: { detections: PdfDetection[]; dateFrom: string; dateTo: string }) {
  const limited = detections.slice(0, MAX_PDF_ROWS);
  const chunks: PdfDetection[][] = [];
  for (let index = 0; index < limited.length; index += ROWS_PER_PAGE) chunks.push(limited.slice(index, index + ROWS_PER_PAGE));
  if (!chunks.length) chunks.push([]);

  const risk = limited.reduce((acc, d) => {
    const score = Number(d.risk_score ?? 0);
    if (score >= 0.7) acc.critical += 1;
    else if (score >= 0.5) acc.high += 1;
    else if (score >= 0.3) acc.medium += 1;
    else acc.low += 1;
    return acc;
  }, { critical: 0, high: 0, medium: 0, low: 0 });

  const regions = limited.reduce<Record<string, number>>((acc, d) => {
    const name = safe(d.region || "Inconnue", 24);
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const sources = limited.reduce<Record<string, number>>((acc, d) => {
    const name = safe(d.source || "Inconnue", 20);
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  return (
    <Document title={`JeryMotro - Rapport ${dateFrom} - ${dateTo}`} author="JeryMotro" subject="Rapport de detections JeryMotro">
      {chunks.map((rows, pageIndex) => (
        <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page} wrap>
          {pageIndex === 0 && (
            <>
              <View style={styles.header}>
                <View>
                  <Text style={styles.brand}>JERYMOTRO</Text>
                  <Text style={styles.subtitle}>Rapport des detections de feux a Madagascar</Text>
                </View>
                <View style={styles.headerRight}>
                  <Text>Periode</Text>
                  <Text>{dateFrom} - {dateTo}</Text>
                  <Text>{new Date().toLocaleDateString("fr-FR")}</Text>
                </View>
              </View>
              <View style={styles.kpis}>
                {[
                  ["Detections", limited.length],
                  ["Critiques", risk.critical],
                  ["Elevees", risk.high],
                  ["Moyennes", risk.medium],
                  ["Faibles", risk.low]
                ].map(([label, value], index, all) => (
                  <View key={String(label)} style={[styles.kpi, index === all.length - 1 ? styles.kpiLast : undefined]}>
                    <Text style={styles.kpiLabel}>{String(label)}</Text>
                    <Text style={styles.kpiValue}>{String(value)}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.summary}>
                <View style={styles.summaryBox}>
                  <Text style={styles.sectionTitle}>Par region</Text>
                  {Object.entries(regions).slice(0, 6).map(([name, count]) => (
                    <View key={name} style={styles.statRow}><Text style={styles.statName}>{name}</Text><Text style={styles.statValue}>{String(count)}</Text></View>
                  ))}
                </View>
                <View style={[styles.summaryBox, styles.summaryLast]}>
                  <Text style={styles.sectionTitle}>Par source</Text>
                  {Object.entries(sources).slice(0, 6).map(([name, count]) => (
                    <View key={name} style={styles.statRow}><Text style={styles.statName}>{name}</Text><Text style={styles.statValue}>{String(count)}</Text></View>
                  ))}
                </View>
              </View>
            </>
          )}

          {pageIndex > 0 && (
            <View style={[styles.header, { marginBottom: 14 }]}>
              <View><Text style={styles.brand}>JERYMOTRO</Text><Text style={styles.subtitle}>Suite du rapport des detections</Text></View>
              <View style={styles.headerRight}><Text>{dateFrom} - {dateTo}</Text></View>
            </View>
          )}

          <Table rows={rows} />
          {detections.length > MAX_PDF_ROWS && pageIndex === chunks.length - 1 && (
            <Text style={{ marginTop: 7, fontSize: 6.5, color: "#64748B" }}>Export PDF limite aux {MAX_PDF_ROWS} premieres detections pour proteger le navigateur. Les exports CSV et JSON conservent toutes les donnees.</Text>
          )}
          <View style={styles.footer} fixed>
            <Text>JeryMotro - Plateforme d'aide a la detection et a l'analyse des feux</Text>
            <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
          </View>
        </Page>
      ))}
    </Document>
  );
}

export async function generateJeryMotroPdf(detections: PdfDetection[], dateFrom: string, dateTo: string): Promise<Blob> {
  return pdf(<PdfReport detections={detections} dateFrom={dateFrom} dateTo={dateTo} />).toBlob();
}
