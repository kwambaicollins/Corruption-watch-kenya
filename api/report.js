npm install @supabase/supabase-js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // or use ANON key for read-only
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { corruptionType, description, location, latitude, longitude, dateOccurred, involvedParties } = req.body;

  const { data, error } = await supabase
    .from('reports') // make sure this table exists
    .insert([
      {
        corruption_type: corruptionType,
        description,
        location,
        latitude,
        longitude,
        date_occurred: dateOccurred,
        involved_parties: involvedParties
      }
    ]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ message: 'Report submitted successfully', id: data[0].id });
}
