const { MongoClient, ServerApiVersion } = require('mongodb');
let client;

async function connectToDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    
    try {
      await client.connect();
      await client.db().command({ ping: 1 });
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      throw err;
    }
  }
  return client.db('corruption_watch');
}

async function closeDBConnection() {
  if (client) {
    await client.close();
    client = null;
  }
}

module.exports = { connectToDB, closeDBConnection };
