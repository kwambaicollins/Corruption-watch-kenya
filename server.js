require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const { connectToDB } = require('./db');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Routes
app.post('/api/reports', upload.array('evidenceFiles', 5), async (req, res) => {
  try {
    const db = await connectToDB();
    const reportData = {
      ...req.body,
      location: {
        text: req.body.location,
        coordinates: {
          lat: parseFloat(req.body.latitude),
          lng: parseFloat(req.body.longitude)
        }
      },
      evidenceFiles: req.files?.map(file => ({
        path: file.path,
        originalName: file.originalname,
        mimetype: file.mimetype
      })) || [],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('reports').insertOne(reportData);
    
    res.status(201).json({
      success: true,
      referenceId: `CWK-${result.insertedId}`
    });
  } catch (error) {
    console.error('Report submission error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to submit report'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
