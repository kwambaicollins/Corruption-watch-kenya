
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(https://seskyvuvplritijwnjbw.supabase.co, eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlc2t5dnV2cGxyaXRpanduamJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNzM4OTIsImV4cCI6MjA2OTY0OTg5Mn0.0O1EV1J7yfHPojaOI9j4F5uJb0Q1e5RnIqlhJv5LeCU)

const { corruptionType, description, location, latitude, longitude, dateOccurred, involvedParties } = req.body;

const { data, error } = await supabase
    .from('corruuption_reports') // make sure this table exists
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
