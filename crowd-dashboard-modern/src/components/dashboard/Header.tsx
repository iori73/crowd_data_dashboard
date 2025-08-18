import { useEffect, useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { HeaderIcon } from '../ui/HeaderIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { RotateCcw, FileDown, FileText, Filter, X, ChevronDown } from 'lucide-react';
import { ExportUtils } from '../../lib/exportUtils';
import type { FilterState } from '../../types/filter';

interface HeaderProps {
  onRefresh: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onFilterChange: (filter: FilterState) => void;
  isLoading?: boolean;
  currentFilter?: FilterState;
}

export function Header({
  onRefresh,
  onExportJSON,
  onExportCSV,
  onFilterChange,
  isLoading = false,
  currentFilter = { period: 'all', startDate: null, endDate: null },
}: HeaderProps) {
  const [localFilter, setLocalFilter] = useState<FilterState>(currentFilter);
  const [showCustomDateRange, setShowCustomDateRange] = useState(currentFilter.period === 'custom');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const periodOptions = [
    { value: 'all', label: '全期間（累積平均）' },
    { value: 'week', label: '直近1週間' },
    { value: 'twoWeeks', label: '直近2週間' },
    { value: 'month', label: '直近1ヶ月' },
    { value: 'custom', label: 'カスタム期間' },
  ];

  const handleKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      } else if (e.ctrlKey) {
        if (e.key === 'r') {
          e.preventDefault();
          onRefresh();
        } else if (e.key === 's') {
          e.preventDefault();
          onExportJSON();
        }
      }
    },
    [onRefresh, onExportJSON],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  useEffect(() => {
    setLocalFilter(currentFilter);
    setShowCustomDateRange(currentFilter.period === 'custom');
  }, [currentFilter]);

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = event.target.value as FilterState['period'];
    const newFilter = { ...localFilter, period: newPeriod };

    if (newPeriod === 'custom') {
      setShowCustomDateRange(true);
      // Set default dates for custom range
      if (!newFilter.startDate || !newFilter.endDate) {
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        newFilter.startDate = oneMonthAgo.toISOString().split('T')[0];
        newFilter.endDate = today.toISOString().split('T')[0];
      }
    } else {
      setShowCustomDateRange(false);
      newFilter.startDate = null;
      newFilter.endDate = null;
    }

    setLocalFilter(newFilter);

    // Apply filter immediately for preset periods
    if (newPeriod !== 'custom') {
      onFilterChange(newFilter);
    }
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newFilter = { ...localFilter, [field]: value };
    setLocalFilter(newFilter);
  };

  const handleApplyFilter = () => {
    if (localFilter.period === 'custom') {
      if (!localFilter.startDate || !localFilter.endDate) {
        ExportUtils.showToast('開始日と終了日を指定してください', 'warning');
        return;
      }

      const start = new Date(localFilter.startDate);
      const end = new Date(localFilter.endDate);

      if (start > end) {
        ExportUtils.showToast('開始日は終了日より前である必要があります', 'warning');
        return;
      }
    }

    onFilterChange(localFilter);
  };

  const getPeriodLabel = () => {
    const labels = {
      all: '全期間（累積平均）',
      week: '直近1週間',
      twoWeeks: '直近2週間',
      month: '直近1ヶ月',
      custom: 'カスタム期間',
    };
    return labels[currentFilter.period];
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-auto min-h-14 max-w-screen-2xl flex-col space-y-2 p-4 md:p-6">
        {/* Top row - Brand and controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <HeaderIcon size="md" />
              <span className="font-bold text-sm sm:text-base">Crowd Data Dashboard</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={onRefresh}
              disabled={isLoading}
              aria-label={isLoading ? "データを更新中" : "データを更新"}
              className="min-h-[44px] px-4 text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="mr-2 w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              ) : (
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
              )}
              更新
            </Button>

            <Button
              variant="outline"
              size="default"
              onClick={onExportJSON}
              className="min-h-[44px] px-4 text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <FileText className="mr-2 h-3.5 w-3.5" />
              JSON
            </Button>

            <Button
              variant="outline"
              size="default"
              onClick={onExportCSV}
              className="min-h-[44px] px-4 text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <FileDown className="mr-2 h-3.5 w-3.5" />
              CSV
            </Button>
          </nav>

          {/* Mobile Hamburger Menu */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`relative w-8 h-8 flex items-center justify-center transition-all duration-300 bg-gray-100 rounded-full ${
                isMobileMenuOpen ? 'hamburger-open' : ''
              }`}
              aria-label="メニュー"
              aria-expanded={isMobileMenuOpen}
            >
              <div className="hamburger-line"></div>
              <div className="hamburger-line"></div>
              <div className="hamburger-line"></div>
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-end md:justify-between md:space-y-0">
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-4 md:space-y-0">
            {/* Period Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium whitespace-nowrap">表示期間:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-between whitespace-nowrap rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {periodOptions.find((option) => option.value === localFilter.period)?.label}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {periodOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() =>
                        handlePeriodChange({ target: { value: option.value } } as React.ChangeEvent<HTMLSelectElement>)
                      }
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Custom Date Range */}
            {showCustomDateRange && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={localFilter.startDate || ''}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[140px] min-h-[44px] ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <span className="text-sm text-muted-foreground">〜</span>
                <input
                  type="date"
                  value={localFilter.endDate || ''}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[140px] min-h-[44px] ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
            )}

            {/* Apply Filter Button */}
            {(showCustomDateRange ||
              localFilter.period !== currentFilter.period ||
              localFilter.startDate !== currentFilter.startDate ||
              localFilter.endDate !== currentFilter.endDate) && (
              <Button 
                size="default" 
                onClick={handleApplyFilter} 
                className="min-h-[44px] px-4 text-sm font-medium transition-all duration-200 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Filter className="mr-2 h-3.5 w-3.5" />
                適用
              </Button>
            )}
          </div>

          {/* Filter Status */}
          {currentFilter.period !== 'all' && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="px-2 py-1 text-label-small text-optimized">
                フィルター適用中: {getPeriodLabel()}
                {currentFilter.period === 'custom' && currentFilter.startDate && currentFilter.endDate && (
                  <span className="ml-1">
                    ({currentFilter.startDate} 〜 {currentFilter.endDate})
                  </span>
                )}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay - Outside of header */}
      <div
        className="fixed top-0 left-0 w-full h-screen z-50 flex items-start justify-start md:hidden"
        style={{
          pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
          opacity: isMobileMenuOpen ? 1 : 0,
          transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
          background: 'linear-gradient(rgb(255, 255, 255) 33%, rgba(255, 255, 255, 0.5) 100%)',
          backdropFilter: 'blur(16px)',
          transition: isMobileMenuOpen ? 'all 0.8s ease' : 'all 0.8s ease',
          visibility: isMobileMenuOpen ? 'visible' : 'hidden',
          transitionProperty: 'opacity, transform, visibility',
        }}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div className="container mx-auto px-6 pt-8" onClick={(e) => e.stopPropagation()}>
          {/* Close Button - Right aligned */}
          <div className="flex items-center justify-end mb-8">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-900 hover:text-gray-700 transition-colors duration-200"
              aria-label="メニューを閉じる"
              style={{
                opacity: isMobileMenuOpen ? 1 : 0,
                transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(20px)',
                transition: isMobileMenuOpen ? 'all 0.8s ease' : 'all 0.2s ease',
                transitionDelay: isMobileMenuOpen ? '0.1s' : '0s',
              }}
            >
              <X className="h-7 w-7" />
            </button>
          </div>

          {/* Menu Label */}
          <div className="mb-6">
            <span
              className="text-lg text-gray-500 font-medium"
              style={{
                opacity: isMobileMenuOpen ? 1 : 0,
                transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-10px)',
                transition: isMobileMenuOpen ? 'all 0.8s ease' : 'all 0.2s ease',
                transitionDelay: isMobileMenuOpen ? '0.2s' : '0s',
              }}
            >
              Menu
            </span>
          </div>

          <nav className="flex flex-col space-y-6">
            {[
              { icon: RotateCcw, label: '更新', action: onRefresh, disabled: isLoading },
              { icon: FileText, label: 'JSONエクスポート', action: onExportJSON, disabled: false },
              { icon: FileDown, label: 'CSVエクスポート', action: onExportCSV, disabled: false },
            ].map((item, index) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    item.action();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={item.disabled}
                  className="flex items-center gap-3 w-full px-0 py-3 text-left whitespace-nowrap rounded-md text-headline-large text-optimized font-bold tracking-tight text-gray-900 hover:text-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none"
                  style={{
                    opacity: isMobileMenuOpen ? 1 : 0,
                    transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-20px)',
                    transition: isMobileMenuOpen ? 'all 0.8s ease' : 'all 0.2s ease',
                    transitionDelay: isMobileMenuOpen ? `${index * 0.15 + 0.3}s` : '0s',
                  }}
                >
                  <IconComponent className={`h-5 w-5 ${item.disabled ? 'animate-spin' : ''}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
