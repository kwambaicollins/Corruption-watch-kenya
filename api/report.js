const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' }); // Temporary storage
const supabase = createClient(https://seskyvuvplritijwnjbw.supabase.co, eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlc2t5dnV2cGxyaXRpanduamJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNzM4OTIsImV4cCI6MjA2OTY0OTg5Mn0.0O1EV1J7yfHPojaOI9j4F5uJb0Q1e5RnIqlhJv5LeCU);

app.post('/api/report', upload.array('evidenceFiles'), async (req, res) => {
  try {
    const {
      corruptionType,
      description,
      location,
      latitude,
      longitude,
      dateOccurred,
      involvedParties
    } = req.body;

    const filePaths = req.files.map(file => file.path); // Or custom upload logic

    const { data, error } = await supabase.from('corruption_reports').insert([
      {
        corruption_type: corruptionType,
        description,
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        evidence_files: filePaths,
        date_occurred: dateOccurred,
        involved_parties: involvedParties
      }
    ]);

    if (error) return res.status(500).json({ error: error.message });

    res.status(200).json({ message: 'Report submitted successfully', id: data[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
