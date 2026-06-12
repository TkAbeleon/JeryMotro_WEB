import {
  DetectionList,
  DashboardSummary,
  DailyStatsResponse,
  ClusterList,
  PredictionList,
  AlertList,
  Zone,
  UserProfile,
  ChatResponse
} from "@workspace/api-client-react";

export const generateMockDetections = (): DetectionList => {
  const regions = ["Analamanga", "Boeny", "Diana", "Itasy", "Atsinanana"];
  const sources = ["MODIS", "VIIRS"];
  const detections = Array.from({ length: 50 }).map((_, i) => ({
    id: i + 1,
    latitude: -12 - Math.random() * 13,
    longitude: 43 + Math.random() * 7,
    brightness: 300 + Math.random() * 100,
    frp: 10 + Math.random() * 490,
    frp_log: null,
    confidence: Math.random() > 0.5 ? "nominal" : "high",
    confidence_num: 50 + Math.random() * 50,
    acq_date: new Date().toISOString().split("T")[0],
    acq_time: "12:00:00",
    source: sources[Math.floor(Math.random() * sources.length)],
    risk_score: 0.1 + Math.random() * 0.85,
    cluster_id: Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 1 : null,
    cluster_size: null,
    region: regions[Math.floor(Math.random() * regions.length)],
    landcover: "Forest",
    is_noise: 0,
    satellite: "Aqua",
    daynight: "D",
    temperature_2m: 25 + Math.random() * 10,
    wind_speed: 2 + Math.random() * 15,
    ndvi_10m: 0.6
  }));

  return {
    detections,
    count: detections.length,
    total: detections.length,
    limit: 50,
    offset: 0
  };
};

export const mockDashboardSummary: DashboardSummary = {
  total_detections_today: 127,
  active_clusters: 23,
  critical_alerts: 8,
  ai_response_time_ms: 245,
  xgboost_accuracy: 0.89,
  regions_affected_today: ["Analamanga", "Boeny", "Diana"],
  pipeline_status: "operational"
};

export const generateMockDailyStats = (): DailyStatsResponse => {
  const stats = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      date: d.toISOString().split("T")[0],
      total_detections: Math.floor(50 + Math.random() * 250),
      high_risk_count: Math.floor(5 + Math.random() * 45),
      avg_frp: 45 + Math.random() * 20,
      max_frp: 150 + Math.random() * 200,
      active_clusters: Math.floor(5 + Math.random() * 20),
      regions_affected: ["Analamanga", "Boeny"]
    };
  });
  return { stats };
};

export const generateMockClusters = (): ClusterList => {
  const regions = ["Analamanga", "Boeny", "Diana", "Itasy", "Atsinanana"];
  const statuses = ["active", "cooling", "closed"];
  const clusters = Array.from({ length: 15 }).map((_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    return {
      id: i + 1,
      center_latitude: -12 - Math.random() * 13,
      center_longitude: 43 + Math.random() * 7,
      radius_km: 1 + Math.random() * 5,
      region: regions[Math.floor(Math.random() * regions.length)],
      cluster_size: Math.floor(2 + Math.random() * 20),
      cluster_frp_total: 50 + Math.random() * 1000,
      cluster_frp_max: 20 + Math.random() * 300,
      risk_score_max: 0.4 + Math.random() * 0.5,
      risk_level: status === "active" ? (Math.random() > 0.5 ? "CRITICAL" : "HIGH") : "LOW",
      first_seen: new Date(Date.now() - 86400000 * 2).toISOString(),
      last_seen: new Date().toISOString(),
      duration_hours: Math.floor(1 + Math.random() * 48),
      cluster_status: status,
      reactivation_count: Math.floor(Math.random() * 3)
    };
  });

  return {
    clusters,
    count: clusters.length,
    total: clusters.length
  };
};

export const generateMockPredictions = (): PredictionList => {
  const regions = ["Analamanga", "Boeny", "Diana", "Itasy", "Atsinanana"];
  const predictions = Array.from({ length: 30 }).map((_, i) => ({
    id: i + 1,
    prediction_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    latitude: -12 - Math.random() * 13,
    longitude: 43 + Math.random() * 7,
    risk_score_j1: 0.2 + Math.random() * 0.75,
    confidence: 0.6 + Math.random() * 0.3,
    model_version: "v2.1",
    region: regions[Math.floor(Math.random() * regions.length)],
    created_at: new Date().toISOString()
  }));

  return {
    predictions,
    count: predictions.length
  };
};

export const generateMockAlerts = (): AlertList => {
  const levels = ["critical", "high", "medium"];
  const channels = ["email", "whatsapp", "sms"];
  const regions = ["Analamanga", "Boeny", "Diana", "Itasy", "Atsinanana"];
  const alerts = Array.from({ length: 20 }).map((_, i) => ({
    id: i + 1,
    alert_level: levels[Math.floor(Math.random() * levels.length)],
    region: regions[Math.floor(Math.random() * regions.length)],
    latitude: -12 - Math.random() * 13,
    longitude: 43 + Math.random() * 7,
    risk_score: 0.5 + Math.random() * 0.45,
    frp: 50 + Math.random() * 200,
    message: "High risk fire detected.",
    channel: channels[Math.floor(Math.random() * channels.length)],
    status: Math.random() > 0.2 ? "sent" : "failed",
    sent_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  }));

  return {
    alerts,
    count: alerts.length,
    total: alerts.length
  };
};

export const mockZones: Zone[] = [
  {
    id: 1,
    user_id: 1,
    name: "Parc National Ankarafantsika",
    latitude: -16.3,
    longitude: 46.2,
    radius_km: 25,
    min_risk: 0.5,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    user_id: 1,
    name: "Corridor Ankeniheny-Zahamena",
    latitude: -18.5,
    longitude: 48.5,
    radius_km: 30,
    min_risk: 0.7,
    created_at: new Date().toISOString()
  }
];

export const mockUserProfile: UserProfile = {
  id: 1,
  email: "demo@jerymotro.mg",
  full_name: "Demo User",
  organization: "JeryMotro Demo",
  role: "admin",
  is_active: true,
  phone_number: "+261 34 00 000 00",
  whatsapp_number: "+261 34 00 000 00"
};

export const mockChatResponse = (msg: string): ChatResponse => {
  return {
    response: `Based on the latest satellite data from MODIS and VIIRS, the fire situation in Madagascar is critical in the western regions. Your query: "${msg}" has been analyzed. There are currently 23 active clusters.`,
    sources: ["MODIS Terra", "VIIRS Suomi-NPP", "Météo Madagascar"],
    model_used: "gpt-4o-jerymotro-tuned",
    response_time_ms: 1240
  };
};
