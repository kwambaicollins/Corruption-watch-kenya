import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client (wrap URL and key in quotes)
const supabase = createClient(
  'https://seskyvuvplritijwnjbw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlc2t5dnV2cGxyaXRpanduamJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNzM4OTIsImV4cCI6MjA2OTY0OTg5Mn0.0O1EV1J7yfHPojaOI9j4F5uJb0Q1e5RnIqlhJv5LeCU'
)

// This should be inside an async function that has access to 'req' and 'res'
async function submitReport(req, res) {
  const { corruptionType, description, location, latitude, longitude, dateOccurred, involvedParties } = req.body;
const files = req.files?.evidenceFiles || []; // Assuming you're using multer or similar
  try {
    const { data, error } = await supabase
  .from('corruption_reports')
  .insert([
    {
      corruption_type: corruptionType,
      description,
      location,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      evidence_files: filePaths, // Array of strings
      date_occurred: dateOccurred, // Must be in YYYY-MM-DD format
      involved_parties: involvedParties
    }
      ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ message: 'Report submitted successfully', id: data[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
