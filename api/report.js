const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
app.use(cors());

// Increase payload limit to handle file uploads (optional JSON parsing)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Multer configuration: limit files to 5MB max each
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const supabase = createClient(
    'https://seskyvuvplritijwnjbw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlc2t5dnV2cGxyaXRpanduamJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNzM4OTIsImV4cCI6MjA2OTY0OTg5Mn0.0O1EV1J7yfHPojaOI9j4F5uJb0Q1e5RnIqlhJv5LeCU'
);

// Main report submission route
app.post('/api/report', upload.array('evidenceFiles'), async (req, res) => {
    try {
        const { corruptionType, description, location, latitude, longitude, dateOccurred } = req.body;

        // Validate required fields
        if (!corruptionType || !description || !latitude || !longitude || !dateOccurred) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate files
        if (req.files && req.files.length > 5) {
            return res.status(400).json({ error: 'Maximum 5 files allowed' });
        }

        // Upload evidence files if any
        const fileUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const fileExt = path.extname(file.originalname);
                const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('corruption-evidence')
                    .upload(`evidence/${fileName}`, file.buffer, {
                        contentType: file.mimetype,
                        upsert: false
                    });

                if (uploadError) {
                    console.error('File upload error:', uploadError);
                    throw new Error('Failed to upload evidence files');
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('corruption-evidence')
                    .getPublicUrl(`evidence/${fileName}`);

                fileUrls.push(publicUrl);
            }
        }

        // Insert report record
        const { data, error: insertError } = await supabase
            .from('corruption_reports')
            .insert([{
                corruption_type: corruptionType,
                description,
                location,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                evidence_files: fileUrls,
                date_occurred: dateOccurred,
                status: 'pending' // consider adding a status field
            }])
            .select();

        if (insertError) {
            console.error('Insert error:', insertError);
            throw insertError;
        }
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
            message: 'Report submitted successfully',
            id: data[0].id
        });

    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({
            error: err.message || 'Internal server error'
        });
    }
});
