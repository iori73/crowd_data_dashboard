import { useEffect } from 'react';

interface HeaderProps {
  onRefresh: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  isLoading?: boolean;
}

export function Header({ onRefresh, onExportJSON, onExportCSV, isLoading = false }: HeaderProps) {
  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    if (e.ctrlKey) {
      if (e.key === 'r') {
        e.preventDefault();
        onRefresh();
      } else if (e.key === 's') {
        e.preventDefault();
        onExportJSON();
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, []);

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Dashboard Icon"
              >
                <rect
                  x="4"
                  y="4"
                  width="20"
                  height="20"
                  rx="4"
                  fill="#3B82F6"
                />
                <rect x="8" y="8" width="4" height="12" rx="2" fill="white" />
                <rect x="16" y="10" width="4" height="10" rx="2" fill="white" />
              </svg>
            </div>
            <h1 className="logo-text">Crowd Data Dashboard</h1>
            <span className="version-badge">v2.0</span>
          </div>
          <div className="analytics-section">
            <div className="analytics-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Analytics Icon"
              >
                <path
                  d="M2 16L6 10L10 14L16 4"
                  stroke="#6B7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 4H16V8"
                  stroke="#6B7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="analytics-text">時間別分析</span>
          </div>
          
          {/* Control Panel */}
          <div className="control-panel">
            <button 
              className={`control-button ${isLoading ? 'loading' : ''}`} 
              data-action="refresh" 
              title="データを更新 (Ctrl+R)"
              aria-label="データを更新"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
              </svg>
              更新
            </button>
            
            <div className="export-group">
              <button 
                className="control-button" 
                data-action="export-json"
                title="JSONでエクスポート (Ctrl+S)"
                aria-label="JSONでエクスポート"
                onClick={onExportJSON}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M9.5 0h-3A1.5 1.5 0 0 0 5 1.5v13A1.5 1.5 0 0 0 6.5 16h3a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 9.5 0zM6.5 1h3a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 .5-.5z"/>
                  <path d="M8 4.5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5z"/>
                </svg>
                JSON
              </button>
              
              <button 
                className="control-button" 
                data-action="export-csv"
                title="CSVでエクスポート"
                aria-label="CSVでエクスポート"
                onClick={onExportCSV}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}