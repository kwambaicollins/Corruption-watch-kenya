import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Get MongoDB connection from environment variables
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'corruption_watch';
    const collectionName = process.env.MONGODB_COLLECTION || 'reports';

    try {
        // Connect to MongoDB
        const client = await MongoClient.connect(uri);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Process form data (you may need to handle file uploads separately)
        const reportData = {
            reportType: req.body.reportType,
            location: req.body.location,
            date: req.body.date ? new Date(req.body.date) : null,
            description: req.body.description,
            evidenceFiles: [], // You'll need to handle file uploads
            createdAt: new Date(),
            status: 'submitted',
            caseId: generateCaseId() // Implement this function
        };

        // Insert the report
        const result = await collection.insertOne(reportData);
        
        // Close connection
        await client.close();

        // Return success with case ID
        res.status(200).json({ 
            success: true,
            caseId: reportData.caseId,
            message: 'Report submitted successfully'
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to submit report to database'
        });
    }
}

function generateCaseId() {
    // Generate a unique case ID (e.g., CWK-2023-12345)
    const prefix = 'CWK';
    const year = new Date().getFullYear();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${year}-${randomNum}`;
}

export const config = {
    api: {
        bodyParser: false, // Disable default bodyParser to handle FormData
    },
};
