export interface FilterState {
  period: 'all' | 'week' | 'twoWeeks' | 'month' | 'custom';
  startDate: string | null;
  endDate: string | null;
}
