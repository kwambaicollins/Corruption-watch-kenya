require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

const app = express();
app.use(cors());

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
const database = getDatabase(firebaseApp);

// Get reports endpoint
app.get('/api/reports', async (req, res) => {
  try {
    const reportsRef = ref(database, 'reports');
    const snapshot = await get(reportsRef);
    
    if (snapshot.exists()) {
      const reports = snapshot.val();
      return res.status(200).json(Object.entries(reports).map(([id, data]) => ({
        id,
        ...data
      })));
    }
    
    return res.status(200).json([]);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = app;