import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse form data
    const formData = req.body;
    const files = req.files?.evidenceFiles || [];

    // Upload files to Supabase Storage if any
    let fileUrls = [];
    if (files.length > 0) {
      for (const file of files) {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('corruption-evidence')
          .upload(`public/${fileName}`, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('corruption-evidence')
          .getPublicUrl(`public/${fileName}`);

        fileUrls.push(urlData.publicUrl);
      }
    }

    // Insert report into database
    const { data, error } = await supabase
      .from('corruption_reports')
      .insert([{
        corruption_type: formData.corruptionType,
        description: formData.description,
        location: formData.location,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        date_occurred: formData.dateOccurred,
        involved_parties: formData.involvedParties,
        evidence_files: fileUrls,
        created_at: new Date().toISOString(),
        status: 'pending'
      }])
      .select();

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      referenceId: data[0].id 
    });

  } catch (error) {
    console.error('Error processing report:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}

export const config = {
  api: {
    bodyParser: false, // We'll handle multipart form data manually
  },
};
