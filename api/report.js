const { MongoClient } = require('mongodb');
const multer = require('multer');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://CWK:<password>@cluster0.p7zjysz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

const upload = multer();

app.post('/api/report', upload.array('evidenceFiles'), async (req, res) => {
  try {
    await client.connect();
    const db = client.db("corruption_watch");
    const reports = db.collection("reports");
    
    const reportData = {
      corruptionType: req.body.corruptionType,
      description: req.body.description,
      location: req.body.location,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      dateOccurred: req.body.dateOccurred,
      involvedParties: req.body.involvedParties,
      evidenceFiles: req.files ? req.files.map(file => ({
        name: file.originalname,
        buffer: file.buffer.toString('base64')
      })) : [],
      createdAt: new Date(),
      status: "pending"
    };
    
    const result = await reports.insertOne(reportData);
    res.status(200).json({
      success: true,
      referenceId: `CWK-${result.insertedId}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    await client.close();
  }
});

module.exports = app;
