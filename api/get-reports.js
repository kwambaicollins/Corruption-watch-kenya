require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// CORS configuration
app.use(cors());
app.use(express.json());

// Supabase client - using ONLY service role key to bypass all restrictions
const supabase = createClient(
    process.env.SUPABASE_URL || 'https://seskyvuvplritijwnjbw.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlc2t5dnV2cGxyaXRpanduamJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNzM4OTIsImV4cCI6MjA2OTY0OTg5Mn0.0O1EV1J7yfHPojaOI9j4F5uJb0Q1e5RnIqlhJv5LeCU'
);

// API endpoint to get reports with filters
app.get('/api/get-reports', async (req, res) => {
  try {
    const { timePeriod, corruptionType, status } = req.query;
    
    // Build query
    let query = supabase
      .from('corruption_reports')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (corruptionType && corruptionType !== 'all') {
      query = query.eq('corruption_type', corruptionType);
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (timePeriod && timePeriod !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (timePeriod) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // All time
      }
      
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data: reports, error } = await query;

    if (error) throw error;

    // Process data for dashboard
    const stats = calculateStats(reports);
    const typeDistribution = calculateTypeDistribution(reports);
    const monthlyTrend = calculateMonthlyTrend(reports);
    const statusDistribution = calculateStatusDistribution(reports);
    const heatmapData = calculateHeatmapData(reports);

    return res.status(200).json({
      reports: reports || [],
      stats,
      typeDistribution,
      monthlyTrend,
      statusDistribution,
      heatmapData
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Helper functions to calculate dashboard data
function calculateStats(reports) {
  const total = reports.length;
  const pending = reports.filter(r => r.status === 'pending').length;
  const resolved = reports.filter(r => r.status === 'resolved').length;
  const underInvestigation = reports.filter(r => r.status === 'under_investigation').length;
  
  return {
    total,
    pending,
    resolved,
    underInvestigation,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0
  };
}

function calculateTypeDistribution(reports) {
  const distribution = {};
  reports.forEach(report => {
    const type = report.corruption_type;
    distribution[type] = (distribution[type] || 0) + 1;
  });
  
  return {
    labels: Object.keys(distribution),
    data: Object.values(distribution),
    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
  };
}

function calculateMonthlyTrend(reports) {
  const monthlyData = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  reports.forEach(report => {
    const date = new Date(report.created_at);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
  });
  
  // Get last 12 months
  const labels = [];
  const data = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    labels.push(months[date.getMonth()]);
    data.push(monthlyData[monthKey] || 0);
  }
  
  return { labels, data };
}

function calculateStatusDistribution(reports) {
  const distribution = {};
  reports.forEach(report => {
    const status = report.status;
    distribution[status] = (distribution[status] || 0) + 1;
  });
  
  return {
    labels: Object.keys(distribution),
    data: Object.values(distribution),
    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
  };
}

function calculateHeatmapData(reports) {
  return reports
    .filter(report => report.latitude && report.longitude)
    .map(report => [report.latitude, report.longitude, 1]);
}

// Export for Vercel
module.exports = app; 