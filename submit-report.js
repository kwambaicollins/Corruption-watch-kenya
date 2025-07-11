import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://CWK:<db_password>@cluster0.p7zjysz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your Atlas connection string
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { details, category, anonymous } = req.body;
    
    await client.connect();
    const db = client.db("corruption_reports"); // Create a new DB
    const collection = db.collection("reports"); // Create a collection
    
    // Insert the report
    await collection.insertOne({
      details,
      category,
      anonymous,
      createdAt: new Date()
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit report' });
  } finally {
    await client.close();
  }
}
