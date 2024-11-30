import Papa from 'papaparse';

export interface StatsData {
  'Primary Stat': string;
  'Derived Stat': string;
  [className: string]: string | number;
}

export async function loadStatsData(): Promise<StatsData[]> {
  try {
    const response = await fetch('/data/lotro-stats.csv');
    const text = await response.text();
    
    const parsed = Papa.parse<StatsData>(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    if (parsed.errors.length > 0) {
      console.error('CSV parsing errors:', parsed.errors);
    }

    return parsed.data;
  } catch (error) {
    console.error('Error loading stats data:', error);
    throw error;
  }
}

export function getClassList(data: StatsData[]): string[] {
  if (!data.length) return [];
  return Object.keys(data[0]).slice(2);
}

export function getPrimaryStats(data: StatsData[]): string[] {
  return [...new Set(data.map(row => row['Primary Stat']))];
}

export function getDerivedStats(data: StatsData[]): string[] {
  return [...new Set(data.map(row => row['Derived Stat']))];
}