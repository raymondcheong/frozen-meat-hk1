export interface FehdHistoryPoint {
  date: string;
  supply: {
    mainland: number;
    local: number;
    total: number;
  };
  prices: {
    highest: number;
    lowest: number;
    average: number;
  };
}

export interface FehdChartPoint {
  date: string;
  label: string;
  average: number;
  highest: number;
  lowest: number;
  supply: number;
  mainland: number;
  local: number;
}

export function formatChartLabel(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${parseInt(month, 10)}/${parseInt(day, 10)}`;
}

export function toChartData(history: FehdHistoryPoint[]): FehdChartPoint[] {
  return history.map((row) => ({
    date: row.date,
    label: formatChartLabel(row.date),
    average: row.prices.average,
    highest: row.prices.highest,
    lowest: row.prices.lowest,
    supply: row.supply.total || row.supply.mainland + row.supply.local,
    mainland: row.supply.mainland,
    local: row.supply.local,
  }));
}
