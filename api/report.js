import { MongoClient } from 'mongodb';
import formidable from 'formidable-serverless';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: 'Error parsing form data' });

      try {
        await client.connect();
        const db = client.db('corruption_watch');
        const collection = db.collection('reports');

        const doc = {
          type: fields.corruptionType,
          description: fields.description,
          location: fields.location,
          latitude: fields.latitude,
          longitude: fields.longitude,
          dateOccurred: fields.dateOccurred,
          involvedParties: fields.involvedParties,
          submittedAt: new Date(),
          referenceId: Math.random().toString(36).substring(2, 10).toUpperCase()
        };

        const result = await collection.insertOne(doc);
        res.status(200).json({ message: 'Report submitted successfully!', referenceId: doc.referenceId });
      } catch (dbErr) {
        console.error('DB Error:', dbErr);
        res.status(500).json({ error: 'Database error occurred' });
      }
    });
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
