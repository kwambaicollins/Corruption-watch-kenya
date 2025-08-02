import { createClient } from '@supabase/supabase-js'
import { IncomingForm } from 'formidable';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const { fields, files } = await new Promise((resolve, reject) => {
      const form = new IncomingForm();
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    // Validate required fields
    const required = ['corruptionType', 'description', 'location', 'latitude', 'longitude', 'dateOccurred'];
    if (required.some(field => !fields[field])) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Process files
    const filePaths = [];
    const fileList = files.evidenceFiles || [];
    const filesToProcess = Array.isArray(fileList) ? fileList : [fileList];
    
    for (const file of filesToProcess) {
      const ext = file.originalFilename.split('.').pop();
      const path = `evidence/${uuidv4()}.${ext}`;
      
      const { error } = await supabase.storage
        .from('reports')
        .upload(path, file.filepath);
      
      if (error) throw error;
      filePaths.push(path);
    }

    // Insert report
    const { data, error } = await supabase
      .from('corruption_reports')
      .insert([{
        corruption_type: fields.corruptionType,
        description: fields.description,
        location: fields.location,
        latitude: parseFloat(fields.latitude),
        longitude: parseFloat(fields.longitude),
        evidence_files: filePaths,
        date_occurred: new Date(fields.dateOccurred).toISOString(),
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    return res.status(201).json({ 
      message: 'Report submitted', 
      id: data[0].id 
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ 
      error: 'Server error: ' + err.message 
    });
  }
}
