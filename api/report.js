import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ 
            success: false,
            message: 'Method not allowed' 
        });
    }

    try {
        // Parse form data
        const formData = await new Promise((resolve, reject) => {
            const form = new multiparty.Form();
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve({ fields, files });
            });
        });

        // Connect to MongoDB
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db();
        const reportsCollection = db.collection('reports');
        
        // Generate reference ID
        const referenceId = `CWK-${uuidv4().substr(0, 8).toUpperCase()}`;
        
        // Prepare report data
        const reportData = {
            corruptionType: formData.fields.corruptionType[0],
            description: formData.fields.description[0],
            location: formData.fields.location[0],
            latitude: parseFloat(formData.fields.latitude[0]),
            longitude: parseFloat(formData.fields.longitude[0]),
            dateOccurred: formData.fields.dateOccurred[0] || null,
            involvedParties: formData.fields.involvedParties[0] || '',
            referenceId,
            status: 'received',
            createdAt: new Date(),
            updatedAt: new Date(),
            ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            files: []
        };

        // Process files if any
        if (formData.files.evidenceFiles) {
            reportData.files = formData.files.evidenceFiles.map(file => ({
                originalName: file.originalFilename,
                path: file.path,
                size: file.size,
                type: file.headers['content-type']
                // In production, you'd upload to cloud storage here
            }));
        }

        // Insert into MongoDB
        await reportsCollection.insertOne(reportData);
        await client.close();
        
        // Return success response
        return res.status(201).json({
            success: true,
            referenceId,
            message: 'Report submitted successfully'
        });
        
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

export const config = {
    api: {
        bodyParser: false // Disable default bodyParser to handle multipart/form-data
    }
};
