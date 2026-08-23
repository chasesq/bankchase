import { registerOTel } from '@vercel/otel';
import { drizzle } from 'drizzle-orm/neon-http';
import { instrumentDrizzleClient } from '@kubiks/otel-drizzle';
import { neon } from '@neondatabase/serverless';

// Store the instrumented database instance globally
let instrumentedDb: any = null;

export function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || 'bankchase',
  });
}

// Export a helper function to get the instrumented database
export function getInstrumentedDb() {
  if (!instrumentedDb && process.env.DATABASE_URL) {
    const db = drizzle(neon(process.env.DATABASE_URL));
    
    // Add Drizzle ORM instrumentation
    instrumentDrizzleClient(db, {
      dbSystem: 'postgresql',
      dbName: 'bankchase',
      captureQueryText: true,
      maxQueryTextLength: 1000,
    });
    
    instrumentedDb = db;
  }
  return instrumentedDb;
}
