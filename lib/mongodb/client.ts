import { MongoClient, MongoClientOptions } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

// MongoDB is optional - only required at runtime if MongoDB features are used

// Support the project variables used by Vercel and local development.
// `sd_MONGODB_URI` may be mapped to `process.env.MONGODB_CONNECTION_STRING`
// by the deployment environment, but the runtime must always read the actual
// connection string value rather than the expression as a literal string.
const mongoUri =
  process.env.MONGODB_CONNECTION_STRING ??
  process.env.MONGODB_URI ??
  process.env.sd_MONGODB_URI ??
  process.env.ws_MONGODB_URI;

const options: MongoClientOptions = {
  appName: 'bankchase.app',
  maxIdleTimeMS: 5000,
  // Connection pooling for Vercel Functions
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Create MongoDB client (only if URI is provided)
const client: MongoClient | null = mongoUri ? new MongoClient(mongoUri, options) : null;

// Attach to Vercel's database pool for proper cleanup on function suspension
if (client) {
  attachDatabasePool(client);
}

// Lazy initialization flag
let mongoConnected = false;

/**
 * Get or create MongoDB connection
 * Ensures single connection instance across all functions
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    throw new Error(
      'MongoDB not configured. Set MONGODB_CONNECTION_STRING, MONGODB_URI, sd_MONGODB_URI, or ws_MONGODB_URI.',
    );
  }
  
  if (!mongoConnected) {
    try {
      await client.connect();
      mongoConnected = true;
      console.log('[v0] MongoDB connected successfully');
    } catch (error) {
      console.error('[v0] MongoDB connection error:', error);
      throw error;
    }
  }
  return client;
}

/**
 * Get MongoDB database instance
 */
export async function getDatabase(dbName: string = 'bankchase') {
  const mongoClient = await getMongoClient();
  return mongoClient.db(dbName);
}

/**
 * Health check for MongoDB connection
 */
export async function checkMongoHealth(): Promise<boolean> {
  try {
    const mongoClient = await getMongoClient();
    await mongoClient.db('admin').command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('[v0] MongoDB health check failed:', error);
    return false;
  }
}

export default client;
