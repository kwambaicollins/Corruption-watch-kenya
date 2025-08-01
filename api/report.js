// Vercel serverless function to handle report submissions
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await client.connect();
    const db = client.db('corruption_watch');
    const collection = db.collection('reports');

    const data = {
      corruptionType: req.body.corruptionType,
      description: req.body.description,
      location: req.body.location,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      dateOccurred: req.body.dateOccurred,
      involvedParties: req.body.involvedParties,
      createdAt: new Date(),
      referenceId: 'CWK-' + Date.now().toString(36).toUpperCase(),
    };

    const result = await collection.insertOne(data);

    res.status(201).json({ message: 'Report submitted', referenceId: data.referenceId });
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
