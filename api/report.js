import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid';
import { IncomingForm } from 'formidable';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://seskyvuvplritijwnjbw.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlc2t5dnV2cGxyaXRpanduamJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNzM4OTIsImV4cCI6MjA2OTY0OTg5Mn0.0O1EV1J7yfHPojaOI9j4F5uJb0Q1e5RnIqlhJv5LeCU'
);

export const config = {
  api: {
    bodyParser: false, // Disable default body parser
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const data = await new Promise((resolve, reject) => {
      const form = new IncomingForm();
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const { corruptionType, description, location, latitude, longitude, dateOccurred, involvedParties } = data.fields;
    const fileList = data.files.evidenceFiles || [];

    // Validate required fields
    if (!corruptionType || !description || !location || !latitude || !longitude || !dateOccurred) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Handle file uploads
    const filePaths = [];
    for (const file of (Array.isArray(fileList) ? fileList : [fileList])) {
      const fileExt = file.originalFilename.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `evidence/${fileName}`;
      
      const fileContent = fs.readFileSync(file.filepath);
      
      const { error: uploadError } = await supabase
        .storage
        .from('reports')
        .upload(filePath, fileContent, {
          contentType: file.mimetype
        });

      if (uploadError) throw uploadError;
      filePaths.push(filePath);
    }

    // Insert report into database
    const { data: dbData, error: dbError } = await supabase
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

    if (dbError) throw dbError;

    return res.status(201).json({ 
      message: 'Report submitted successfully', 
      id: dbData[0].id 
    });

  } catch (err) {
    console.error('Report submission error:', err);
    return res.status(500).json({ 
      error: 'Internal server error: ' + err.message
    });
  }
}
