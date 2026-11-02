// Quick utility to test MongoDB connection and verify collections
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/orlise_billing';
const dbName = process.env.MONGODB_DB_NAME || 'orlise_billing';

console.log('Connecting to MongoDB at:', uri.replace(/\/\/.*@/, '//<credentials>@'));

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });

async function main() {
  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB server!');
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log(`Database "${dbName}" collections:`, collections.map(c => c.name));
    
    const invoiceCount = await db.collection('invoices').countDocuments();
    const partyCount = await db.collection('parties').countDocuments();
    const productCount = await db.collection('products').countDocuments();
    console.log(`Counts -> Invoices: ${invoiceCount}, Parties: ${partyCount}, Products: ${productCount}`);
  } catch (err) {
    console.log('⚠️ Could not connect to MongoDB:', err.message);
    console.log('Note: If running locally without a MongoDB daemon, the application automatically uses the embedded persistent storage engine (data/db.json).');
  } finally {
    await client.close();
  }
}

main();
