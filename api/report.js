require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();

// Enhanced CORS configuration
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5
  }
});

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL || 'https://seskyvuvplritijwnjbw.supabase.co',
    process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlc2t5dnV2cGxyaXRpanduamJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNzM4OTIsImV4cCI6MjA2OTY0OTg5Mn0.0O1EV1J7yfHPojaOI9j4F5uJb0Q1e5RnIqlhJv5LeCU'
);

// API endpoint
app.post('/api/report', upload.array('evidenceFiles', 5), async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['corruptionType', 'description', 'latitude', 'longitude', 'dateOccurred'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields
      });
    }

    // Process file uploads
    const fileUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('corruption-evidence')
          .upload(`evidence/${fileName}`, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('corruption-evidence')
          .getPublicUrl(`evidence/${fileName}`);

        fileUrls.push(publicUrl);
      }
    }

    // Insert report
    const { data, error } = await supabase
      .from('corruption_reports')
      .insert([{
        corruption_type: req.body.corruptionType,
        description: req.body.description,
        location: req.body.location,
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
        evidence_files: fileUrls,
        date_occurred: req.body.dateOccurred,
        status: 'pending'
      }])
      .select();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      id: data[0].id
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Export for Vercel
module.exports = app;
