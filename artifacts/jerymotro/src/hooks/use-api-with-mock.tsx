import {
  useListDetections,
  useGetDashboardSummary,
  useGetDailyStats,
  useListClusters,
  useListPredictions,
  useListAlerts,
  useListZones,
  useGetMe,
  ListDetectionsParams,
  GetDailyStatsParams,
  ListClustersParams,
  ListPredictionsParams,
  ListAlertsParams
} from "@workspace/api-client-react";
import {
  generateMockDetections,
  mockDashboardSummary,
  generateMockDailyStats,
  generateMockClusters,
  generateMockPredictions,
  generateMockAlerts,
  mockZones,
  mockUserProfile
} from "../lib/mock-data";

export function useMockListDetections(params?: ListDetectionsParams) {
  const query = useListDetections(params, undefined);
  if (query.isError || (!query.isLoading && !query.data)) {
    return { ...query, data: generateMockDetections(), isLoading: false, isError: false };
  }
  return query;
}

export function useMockGetDashboardSummary() {
  const query = useGetDashboardSummary(undefined);
  if (query.isError || (!query.isLoading && !query.data)) {
    return { ...query, data: mockDashboardSummary, isLoading: false, isError: false };
  }
  return query;
}

export function useMockGetDailyStats(params?: GetDailyStatsParams) {
  const query = useGetDailyStats(params, undefined);
  if (query.isError || (!query.isLoading && !query.data)) {
    return { ...query, data: generateMockDailyStats(), isLoading: false, isError: false };
  }
  return query;
}

export function useMockListClusters(params?: ListClustersParams) {
  const query = useListClusters(params, undefined);
  if (query.isError || (!query.isLoading && !query.data)) {
    return { ...query, data: generateMockClusters(), isLoading: false, isError: false };
  }
  return query;
}

export function useMockListPredictions(params?: ListPredictionsParams) {
  const query = useListPredictions(params, undefined);
  if (query.isError || (!query.isLoading && !query.data)) {
    return { ...query, data: generateMockPredictions(), isLoading: false, isError: false };
  }
  return query;
}

export function useMockListAlerts(params?: ListAlertsParams) {
  const query = useListAlerts(params, undefined);
  if (query.isError || (!query.isLoading && !query.data)) {
    return { ...query, data: generateMockAlerts(), isLoading: false, isError: false };
  }
  return query;
}

export function useMockListZones() {
  const query = useListZones(undefined);
  if (query.isError || (!query.isLoading && !query.data)) {
    return { ...query, data: mockZones, isLoading: false, isError: false };
  }
  return query;
}

export function useMockGetMe() {
  const query = useGetMe(undefined);
  if (query.isError || (!query.isLoading && !query.data)) {
    return { ...query, data: mockUserProfile, isLoading: false, isError: false };
  }
  return query;
}
