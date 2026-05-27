export interface MainlandHistoryPoint {
  date: string;
  label: string;
  pork: number;
  beef: number;
  pig: number;
}

export interface MainlandMeatSummary {
  weekLabel: string;
  dataDate: string;
  sourceUrl: string;
  monthlyLabel: string | null;
  monthlySourceUrl: string | null;
}

export interface MainlandMeatData {
  summary: MainlandMeatSummary;
  items: Array<{
    id: string;
    name: string;
    nameEn: string;
    price: number;
    unit: string;
    change: number;
    changePercent: number;
    source: string;
    updatedAt: string;
    meta?: { yoyPercent?: number; period?: string };
  }>;
  history: MainlandHistoryPoint[];
  updatedAt: string;
}

export interface MainlandChartPoint {
  date: string;
  label: string;
  pork: number;
  beef: number;
}

/** 橫軸顯示：如「3月第2周」，去掉「畜产品和饲料…」等後綴 */
export function formatMainlandWeekLabel(label: string): string {
  const m = label.match(/(\d{1,2}月第\d{1,2}周)/);
  if (m) return m[1];
  return label
    .replace(/畜产品和饲料.*$/, '')
    .replace(/畜产品.*$/, '')
    .trim();
}

export function toMainlandChartData(history: MainlandHistoryPoint[]): MainlandChartPoint[] {
  return history.map((row) => ({
    date: row.date,
    label: formatMainlandWeekLabel(row.label),
    pork: row.pork,
    beef: row.beef,
  }));
}

/** 人民幣 → 港元參考（供香港用戶對照） */
export function cnyToHkdRef(cny: number, rate = 1.08): number {
  return Math.round(cny * rate * 10) / 10;
}
