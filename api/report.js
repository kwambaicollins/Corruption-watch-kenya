import { createClient } from '@supabase/supabase-js'
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).array('evidenceFiles');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // First handle file upload
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    }

    try {
      const { corruptionType, description, location, latitude, longitude, dateOccurred, involvedParties } = req.body;
      const files = req.files || [];

      // Validate required fields
      if (!corruptionType || !description || !location || !latitude || !longitude || !dateOccurred) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Upload files to Supabase storage if any
      const filePaths = [];
      for (const file of files) {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `evidence/${fileName}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('reports')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype
          });

        if (uploadError) throw uploadError;
        filePaths.push(filePath);
      }

      // Insert report into database
      const { data, error } = await supabase
        .from('corruption_reports')
        .insert([
          {
            corruption_type: corruptionType,
            description,
            location,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            evidence_files: filePaths,
            date_occurred: new Date(dateOccurred).toISOString(),
            involved_parties: involvedParties,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      return res.status(201).json({ 
        message: 'Report submitted successfully', 
        id: data[0].id 
      });

    } catch (err) {
      console.error('Report submission error:', err);
      return res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });
}
