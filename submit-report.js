export default async function handler(req, res) {
  if (req.method === 'POST') {
    const data = req.body; // Form data from frontend
    console.log('Received report:', data); // For testing
    
    // (Optional) Store in a database (see next step)
    // await saveToDatabase(data);
    
    res.status(200).json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
