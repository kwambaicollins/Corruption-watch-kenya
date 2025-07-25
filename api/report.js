import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db();
    const reportsCollection = db.collection('reports');
    
    // Generate a reference ID
    const referenceId = 'CWK-' + Date.now().toString(36).toUpperCase();
    
    // Prepare report data
    const reportData = {
      ...req.body,
      referenceId,
      status: 'received',
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    };
    
    // Insert into MongoDB
    const result = await reportsCollection.insertOne(reportData);
    await client.close();
    
    // Return success response
    res.status(201).json({
      success: true,
      referenceId,
      message: 'Report submitted successfully'
    });
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message
    });
  }
}
