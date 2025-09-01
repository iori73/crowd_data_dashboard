import Papa from 'papaparse';

export interface CrowdData {
  datetime: string;
  date: string;
  time: string;
  hour: number;
  weekday: string;
  count: number;
  status_label: string;
  status_code: number;
  status_min: number;
  status_max: number;
  raw_text: string;
}

export interface ProcessedData {
  weekday: string;
  hour: number;
  avgCount: number;
  dataPoints: number;
}

export class DataLoader {
  private static instance: DataLoader;
  private cachedData: CrowdData[] = [];
  private lastLoadTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): DataLoader {
    if (!DataLoader.instance) {
      DataLoader.instance = new DataLoader();
    }
    return DataLoader.instance;
  }

  async loadCSVData(forceReload = false): Promise<CrowdData[]> {
    const now = Date.now();

    if (!forceReload && this.cachedData.length > 0 && now - this.lastLoadTime < this.CACHE_DURATION) {
      console.log('📋 Using cached data');
      return this.cachedData;
    }

    try {
      console.log('📥 Loading CSV data...');
      const response = await fetch('/fit_place24_data.csv');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvText = await response.text();

      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim(),
          transform: (value: string) => value.trim(),
          complete: (results) => {
            if (results.errors.length > 0) {
              console.warn('⚠️ CSV parsing warnings:', results.errors);
            }

            const data = results.data as CrowdData[];
            const cleanedData = this.cleanAndValidateData(data);

            this.cachedData = cleanedData;
            this.lastLoadTime = now;

            console.log(`✅ Loaded ${cleanedData.length} records`);
            resolve(cleanedData);
          },
          error: (error: unknown) => {
            console.error('❌ CSV parsing error:', error);
            reject(error);
          },
        });
      });
    } catch (error) {
      console.error('❌ Failed to load CSV data:', error);
      throw error;
    }
  }

  private cleanAndValidateData(data: CrowdData[]): CrowdData[] {
    return data
      .filter((item) => {
        // Basic validation
        if (!item.date || !item.time || item.count === undefined) {
          return false;
        }

        // Date format validation (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(item.date)) {
          return false;
        }

        // Time format validation (HH:MM)
        const timeRegex = /^\d{1,2}:\d{2}$/;
        if (!timeRegex.test(item.time)) {
          return false;
        }

        return true;
      })
      .map((item) => {
        // Convert numeric fields
        return {
          ...item,
          hour: typeof item.hour === 'string' ? parseInt(item.hour) : item.hour,
          count: typeof item.count === 'string' ? parseInt(item.count) : item.count,
          status_code: typeof item.status_code === 'string' ? parseInt(item.status_code) : item.status_code,
          status_min: typeof item.status_min === 'string' ? parseInt(item.status_min) : item.status_min,
          status_max: typeof item.status_max === 'string' ? parseInt(item.status_max) : item.status_max,
        };
      });
  }

  getCachedData(): CrowdData[] {
    return this.cachedData;
  }

  clearCache(): void {
    this.cachedData = [];
    this.lastLoadTime = 0;
    console.log('🧹 Cache cleared');
  }
}
