const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Multer configuration for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  }
});

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://seskyvuvplritijwnjbw.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlc2t5dnV2cGxyaXRpanduamJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNzM4OTIsImV4cCI6MjA2OTY0OTg5Mn0.0O1EV1J7yfHPojaOI9j4F5uJb0Q1e5RnIqlhJv5LeCU'
);

// Helper function to parse multipart form data
function parseMultipartData(req) {
  return new Promise((resolve, reject) => {
    const uploadHandler = upload.array('evidenceFiles', 5);
    uploadHandler(req, {}, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

// Main handler function for Vercel
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

    // Parse multipart form data
    await parseMultipartData(req);

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

        if (uploadError) {
          console.error('File upload error:', uploadError);
          throw new Error(`File upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('corruption-evidence')
          .getPublicUrl(`evidence/${fileName}`);

        fileUrls.push(publicUrl);
      }
    }

    // Insert report into database
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

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Database operation failed: ${error.message}`);
    }

    return res.status(200).json({
      success: true,
      id: data[0].id,
      message: 'Report submitted successfully'
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      details: error.details || 'No additional details available'
    });
  }
}
