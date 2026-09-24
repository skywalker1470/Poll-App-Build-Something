const { MongoClient } = require('mongodb');

const MONGO_HOST = process.env.MONGO_HOST || 'localhost';
const MONGO_PORT = process.env.MONGO_PORT || '27017';
const uri = `mongodb://${MONGO_HOST}:${MONGO_PORT}/pollapp`;

let db = null;

async function connect() {
  if (db) return db;
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db('pollapp');
  return db;
}

module.exports = { connect };
