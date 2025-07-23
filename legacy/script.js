// CSV file path
const CSV_FILE_PATH = 'fit_place24_data.csv';

// Load CSV data from file
async function loadCSVData() {
  try {
    console.log('📁 Loading CSV data from:', CSV_FILE_PATH);
    const response = await fetch(CSV_FILE_PATH);
    
    if (!response.ok) {
      // Provide helpful error message for common CORS/file access issues
      if (response.status === 404) {
        throw new Error(`CSV file not found: ${CSV_FILE_PATH}. Please ensure the file exists in the same directory as index.html`);
      } else if (response.status === 0 || window.location.protocol === 'file:') {
        throw new Error(`Cannot load CSV file due to CORS restrictions. Please run this page through a local server (e.g., 'python -m http.server' or 'npx serve')`);
      } else {
        throw new Error(`Failed to load CSV file: ${response.status} ${response.statusText}`);
      }
    }
    
    const csvText = await response.text();
    console.log('✅ CSV file loaded successfully');
    console.log('📊 CSV Data preview:', csvText.substring(0, 200) + '...');
    
    return csvText;
  } catch (error) {
    console.error('❌ Error loading CSV file:', error);
    
    // Check if this is a CORS/local file issue
    if (error.message.includes('CORS') || window.location.protocol === 'file:') {
      console.log('💡 To fix this issue:');
      console.log('   1. Run a local server: python -m http.server');
      console.log('   2. Or use: npx serve');
      console.log('   3. Then access via http://localhost:port');
    }
    
    throw error;
  }
}

// Parse CSV data
function parseCSV(csvText) {
  try {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      // Handle CSV lines that might contain commas in quoted fields
      const values = parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].trim() : '';
      });
      data.push(row);
    }

    console.log('Parsed CSV data:', data.length, 'records');
    return data;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

// Helper function to parse CSV line with quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// Group data by weekday and hour
function groupDataByWeekday(data) {
  const weekdays = {};

  data.forEach((row) => {
    const weekday = row.weekday;
    const hour = parseInt(row.hour);
    const count = parseInt(row.count);

    if (!weekdays[weekday]) {
      weekdays[weekday] = {};
    }

    if (!weekdays[weekday][hour]) {
      weekdays[weekday][hour] = [];
    }

    weekdays[weekday][hour].push(count);
  });

  // Calculate averages for each hour
  Object.keys(weekdays).forEach((weekday) => {
    Object.keys(weekdays[weekday]).forEach((hour) => {
      const counts = weekdays[weekday][hour];
      const average = counts.reduce((a, b) => a + b, 0) / counts.length;
      weekdays[weekday][hour] = Math.round(average);
    });
  });

  return weekdays;
}

// Create chart data for a specific weekday
function createChartData(weekdayData) {
  const hours = [];
  const counts = [];

  // Create labels for all hours (0-23) but show only every 3 hours
  for (let i = 0; i <= 21; i += 3) {
    hours.push(i.toString().padStart(2, '0') + ':00');
    counts.push(weekdayData[i] || 0);
  }

  return {
    labels: hours,
    datasets: [
      {
        label: 'Average People',
        data: counts,
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        borderWidth: 1,
        barThickness: 'flex',
        maxBarThickness: 40,
      },
    ],
  };
}

// Chart configuration
const chartConfig = {
  type: 'bar',
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#3B82F6',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Avg. People',
          color: '#374151',
          font: {
            size: 14,
            family: 'Inter, sans-serif',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
        },
      },
      x: {
        title: {
          display: false,
        },
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  },
};

// Create chart for a specific weekday
function createChart(canvasId, weekdayData) {
  try {
    console.log(`🎯 Attempting to create chart for: ${canvasId}`);
    
    // Validate canvas element exists
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      const errorMsg = `Canvas element with id '${canvasId}' not found in DOM`;
      console.error(`❌ ${errorMsg}`);
      
      // List all canvas elements that do exist for debugging
      const allCanvases = document.querySelectorAll('canvas');
      console.log('📋 Available canvas elements:', Array.from(allCanvases).map(c => c.id || 'no-id'));
      
      throw new Error(errorMsg);
    }
    console.log(`✅ Canvas element found: ${canvasId}`);

    // Validate canvas is properly attached to DOM
    if (!canvas.parentElement) {
      throw new Error(`Canvas element '${canvasId}' is not attached to DOM`);
    }

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
      throw new Error('Chart.js library is not loaded');
    }

    // Validate canvas context
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error(`Failed to get 2D context for canvas '${canvasId}'`);
    }

    // Prepare chart data
    const data = createChartData(weekdayData);
    const config = {
      ...chartConfig,
      data: data,
    };

    console.log(`📊 Creating chart for ${canvasId} with data:`, {
      labels: data.labels,
      dataPoints: data.datasets[0].data.length,
      maxValue: Math.max(...data.datasets[0].data)
    });
    
    // Create the chart
    const chart = new Chart(ctx, config);
    console.log(`✅ Chart created successfully for ${canvasId}`);
    
    return chart;
  } catch (error) {
    console.error(`❌ Error creating chart ${canvasId}:`, error);
    
    // Try to show error in the chart container
    const canvas = document.getElementById(canvasId);
    if (canvas && canvas.parentElement) {
      const container = canvas.parentElement;
      container.innerHTML = `
        <div class="empty-state">
          <p>⚠️ Failed to load chart</p>
          <small>Canvas: ${canvasId}</small>
        </div>
      `;
    }
    
    throw error;
  }
}

// Initialize all charts
async function initializeCharts() {
  console.log('📊 Starting chart initialization process...');
  
  // Load CSV data from file
  const csvData = await loadCSVData();
  
  const data = parseCSV(csvData);
  if (!data || data.length === 0) {
    throw new Error('No valid CSV data found');
  }
  
  const weekdayData = groupDataByWeekday(data);
  console.log('📈 Weekday data processed:', Object.keys(weekdayData));

  const charts = {};
  const successfulCharts = [];
  const failedCharts = [];

  // Create charts for each weekday
  const weekdays = {
    Sunday: 'sundayChart',
    Monday: 'mondayChart',
    Wednesday: 'wednesdayChart',
    Thursday: 'thursdayChart',
    Friday: 'fridayChart',
    Saturday: 'saturdayChart',
  };

  console.log('🎯 Creating charts for weekdays:', Object.keys(weekdays));

  Object.keys(weekdays).forEach((weekday) => {
    const canvasId = weekdays[weekday];
    const dayData = weekdayData[weekday] || {};
    const dataPoints = Object.keys(dayData).length;

    console.log(`📊 Processing ${weekday} (${canvasId}): ${dataPoints} data points`);

    try {
      charts[weekday] = createChart(canvasId, dayData);
      successfulCharts.push(weekday);
      console.log(`✅ Successfully created chart for ${weekday}`);
    } catch (error) {
      failedCharts.push({ weekday, error: error.message });
      console.error(`❌ Failed to create chart for ${weekday}:`, error);
      
      // Show user-friendly error message in chart container
      const canvas = document.getElementById(canvasId);
      if (canvas && canvas.parentElement) {
        const container = canvas.parentElement;
        container.innerHTML = `
          <div class="empty-state">
            <p>😔 Chart unavailable</p>
            <small>${weekday} - ${dataPoints > 0 ? 'Rendering error' : 'No data'}</small>
          </div>
        `;
      }
    }
  });

  // Summary logging
  console.log(`📋 Chart creation summary:`);
  console.log(`✅ Successful: ${successfulCharts.length} (${successfulCharts.join(', ')})`);
  if (failedCharts.length > 0) {
    console.log(`❌ Failed: ${failedCharts.length}`);
    failedCharts.forEach(({ weekday, error }) => {
      console.log(`   - ${weekday}: ${error}`);
    });
  }

  if (successfulCharts.length === 0) {
    throw new Error('All chart creation attempts failed');
  }

  return charts;
}

// Add loading states
function showLoading() {
  console.log('⏳ Setting up loading states...');
  const chartContainers = document.querySelectorAll('.chart-container');
  chartContainers.forEach((container) => {
    // Find the canvas element within this container
    const canvas = container.querySelector('canvas');
    if (canvas) {
      // Hide canvas and add loading overlay instead of replacing innerHTML
      canvas.style.display = 'none';
      
      // Add loading message as overlay
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading';
      loadingDiv.style.cssText = 'display: flex; align-items: center; justify-content: center; height: 300px; color: #6B7280;';
      loadingDiv.textContent = 'Loading chart...';
      
      // Insert loading div before canvas
      container.insertBefore(loadingDiv, canvas);
      console.log(`⏳ Loading state added for canvas: ${canvas.id}`);
    }
  });
}

// Remove loading states and show canvas
function hideLoading() {
  console.log('✅ Removing loading states...');
  const chartContainers = document.querySelectorAll('.chart-container');
  chartContainers.forEach((container) => {
    // Remove loading div
    const loadingDiv = container.querySelector('.loading');
    if (loadingDiv) {
      loadingDiv.remove();
    }
    
    // Show canvas
    const canvas = container.querySelector('canvas');
    if (canvas) {
      canvas.style.display = 'block';
      console.log(`✅ Canvas restored: ${canvas.id}`);
    }
  });
}

// Add hover effects for better interactivity
function addHoverEffects() {
  const chartCards = document.querySelectorAll('.chart-card');

  chartCards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });
  });
}

// Responsive chart handling
function handleResize() {
  window.addEventListener('resize', () => {
    // Chart.js automatically handles resize, but we can add custom logic here
    setTimeout(() => {
      Object.values(window.charts || {}).forEach((chart) => {
        if (chart && chart.resize) {
          chart.resize();
        }
      });
    }, 100);
  });
}

// Wait for DOM to be fully ready
function waitForDOM() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      const checkReady = () => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          setTimeout(checkReady, 10);
        }
      };
      checkReady();
    }
  });
}

// Verify all required elements exist
function verifyDOMElements() {
  const canvasIds = ['sundayChart', 'mondayChart', 'wednesdayChart', 'thursdayChart', 'fridayChart', 'saturdayChart'];
  const missingElements = [];
  const existingElements = [];
  
  canvasIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      existingElements.push(id);
      console.log(`✓ Found canvas element: ${id}`);
    } else {
      missingElements.push(id);
      console.error(`✗ Missing canvas element: ${id}`);
    }
  });
  
  console.log(`DOM Verification: ${existingElements.length}/${canvasIds.length} elements found`);
  
  if (missingElements.length > 0) {
    console.error('Missing canvas elements:', missingElements);
    return false;
  }
  
  return true;
}

// Initialize everything when DOM is loaded
async function initializeDashboard() {
  console.log('🚀 Initializing Crowd Data Dashboard...');
  console.log('📊 Document ready state:', document.readyState);

  try {
    // Wait for DOM to be completely ready
    await waitForDOM();
    console.log('✅ DOM is fully ready');

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
      console.error('❌ Chart.js library is not loaded. Please check the CDN link.');
      const containers = document.querySelectorAll('.chart-container');
      containers.forEach((container) => {
        container.innerHTML = '<div class="empty-state">Chart.js library failed to load</div>';
      });
      return;
    }
    console.log('✅ Chart.js library loaded successfully');

    // Verify all canvas elements exist
    if (!verifyDOMElements()) {
      console.error('❌ Some required DOM elements are missing');
      return;
    }

    // Show loading state
    showLoading();
    console.log('⏳ Loading state displayed');

    // Initialize charts after a short delay to show loading
    setTimeout(async () => {
      try {
        console.log('📈 Starting chart initialization...');
        
        // Remove loading states and restore canvas elements
        hideLoading();
        
        window.charts = await initializeCharts();
        console.log('✅ Charts initialized successfully');

        // Add interactive features
        addHoverEffects();
        handleResize();
        console.log('✅ Interactive features added');
      } catch (error) {
        console.error('❌ Error initializing charts:', error);
        console.error('Error stack:', error.stack);
        
        // Remove loading and show error message
        hideLoading();
        const containers = document.querySelectorAll('.chart-container');
        containers.forEach((container) => {
          container.innerHTML = `
            <div class="empty-state">
              <p>⚠️ Failed to load data</p>
              <small>${error.message}</small>
              <br><small>Check console for details</small>
            </div>
          `;
        });
      }
    }, 500);
  } catch (error) {
    console.error('❌ Fatal error during dashboard initialization:', error);
  }
}

// Try multiple initialization methods
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  // DOM is already loaded
  initializeDashboard();
}

// Export functions for potential future use
window.CrowdDataDashboard = {
  parseCSV,
  groupDataByWeekday,
  createChartData,
  initializeCharts,
};
