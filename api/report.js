require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { getDatabase, ref: dbRef, push, set } = require('firebase/database');

const app = express();

// Enhanced CORS configuration
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "corruption-watch-kenya.firebaseapp.com",
  databaseURL: "https://corruption-watch-kenya-default-rtdb.firebaseio.com",
  projectId: "corruption-watch-kenya",
  storageBucket: "corruption-watch-kenya.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);
const database = getDatabase(firebaseApp);

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5
  }
});

// API endpoint
app.post('/api/report', upload.array('evidenceFiles', 5), async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['corruptionType', 'description', 'latitude', 'longitude', 'dateOccurred'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields
      });
    }

    // Process file uploads
    const fileUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileExt = path.extname(file.originalname);
        const fileName = `evidence/${Date.now()}-${Math.floor(Math.random() * 1000)}${fileExt}`;
        const storageRef = ref(storage, fileName);
        
        // Upload file to Firebase Storage
        await uploadBytes(storageRef, file.buffer, {
          contentType: file.mimetype
        });

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        fileUrls.push(downloadURL);
      }
    }

    // Create report data
    const reportData = {
      corruption_type: req.body.corruptionType,
      description: req.body.description,
      location: req.body.location,
      latitude: parseFloat(req.body.latitude),
      longitude: parseFloat(req.body.longitude),
      date_occurred: req.body.dateOccurred,
      evidence_files: fileUrls,
      created_at: new Date().toISOString(),
      status: 'pending'
    };

    // Push to Firebase Realtime Database
    const reportsRef = dbRef(database, 'reports');
    const newReportRef = push(reportsRef);
    await set(newReportRef, reportData);

    return res.status(200).json({
      success: true,
      id: newReportRef.key
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Export for Vercel
module.exports = app;
