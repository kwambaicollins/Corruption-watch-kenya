import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await client.connect();
    const db = client.db("corruption_watch");
    const reports = await db.collection("reports").find().sort({ createdAt: -1 }).toArray();
    res.status(200).json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  } finally {
    await client.close();
  }
}
