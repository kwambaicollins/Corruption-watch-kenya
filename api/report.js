const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

// Configure multer for memory storage (better for Supabase uploads)
const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
    'https://seskyvuvplritijwnjbw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlc2t5dnV2cGxyaXRpanduamJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNzM4OTIsImV4cCI6MjA2OTY0OTg5Mn0.0O1EV1J7yfHPojaOI9j4F5uJb0Q1e5RnIqlhJv5LeCU'
);

app.post('/api/report', upload.array('evidenceFiles'), async (req, res) => {
    try {
        // Get text fields from form-data
        const { corruptionType, description, location, latitude, longitude, dateOccurred } = req.body;
        
        // Upload files to Supabase Storage and get URLs
        const fileUrls = [];
        for (const file of req.files) {
            const fileExt = path.extname(file.originalname);
            const fileName = `${Date.now()}${fileExt}`;
            
            const { data, error } = await supabase.storage
                .from('corruption-evidence') // Your bucket name
                .upload(`evidence/${fileName}`, file.buffer, {
                    contentType: file.mimetype
                });
            
            if (error) throw error;
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('corruption-evidence')
                .getPublicUrl(`evidence/${fileName}`);
            
            fileUrls.push(publicUrl);
        }
        
        // Insert report into database
        const { data, error: dbError } = await supabase
            .from('corruption_reports')
            .insert([{
                corruption_type: corruptionType,
                description,
                location,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                evidence_files: fileUrls,
                date_occurred: dateOccurred
            }])
            .select();
        
        if (dbError) throw dbError;
        
        res.status(200).json({ 
            message: 'Report submitted successfully', 
            id: data[0].id 
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ 
            error: err.message || 'Internal server error' 
        });
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
