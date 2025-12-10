const { MongoClient } = require('mongodb');
const { collectionValidators } = require('./schemas');

let client;
let db;

async function ensureCollections(database) {
  await Promise.all(
    Object.entries(collectionValidators).map(async ([name, validator]) => {
      const existing = await database.listCollections({ name }).next();
      if (!existing) {
        await database.createCollection(name, { validator: { $jsonSchema: validator } });
        return;
      }
      const hasValidator = existing.options && existing.options.validator;
      if (!hasValidator) {
        await database.command({ collMod: name, validator: { $jsonSchema: validator } }).catch(() => {});
      }
    }),
  );
}

async function connectToDatabase() {
  if (db) return db;
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/interact';
  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  await ensureCollections(db);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database has not been initialized. Call connectToDatabase first.');
  }
  return db;
}

async function disconnectFromDatabase() {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}

module.exports = {
  connectToDatabase,
  getDb,
  disconnectFromDatabase,
};
