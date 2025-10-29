/**
 * Transfer Data from Local to Production Database
 * 
 * This script transfers data from your local MongoDB database to your production 
 * MongoDB Atlas database.
 * 
 * Usage:
 *   1. Set MONGODB_URI in .env.local to your production URI (mongodb+srv://...)
 *   2. Run: node scripts/transfer-to-production.js <local_uri>
 * 
 *   OR
 * 
 *   node scripts/transfer-to-production.js <local_uri> <production_uri>
 * 
 *   OR set environment variables:
 *   LOCAL_MONGODB_URI=<local_uri> MONGODB_URI=<production_uri> node scripts/transfer-to-production.js
 * 
 * Collections transferred: sites, changeRequests
 */

const { MongoClient } = require('mongodb');

// Try to load .env.local if dotenv is available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not installed or .env.local not found - that's okay, we can use command line args
}

// Collections to transfer
const COLLECTIONS = ['sites', 'changeRequests'];
const DB_NAME = 'district79';

// Get URIs from environment or command line arguments
// For production, we'll use MONGODB_URI from .env.local
// For local, you can pass it as first argument or set LOCAL_MONGODB_URI
const LOCAL_URI = process.env.LOCAL_MONGODB_URI || process.argv[2];
const PRODUCTION_URI = process.env.MONGODB_URI || process.argv[3];

if (!LOCAL_URI) {
  console.error('❌ Error: Local MongoDB URI is required');
  console.error('Usage: node scripts/transfer-to-production.js <local_uri> <production_uri>');
  console.error('Or set LOCAL_MONGODB_URI and MONGODB_URI in .env.local');
  process.exit(1);
}

if (!PRODUCTION_URI) {
  console.error('❌ Error: Production MongoDB URI is required');
  console.error('Usage: node scripts/transfer-to-production.js <local_uri> <production_uri>');
  console.error('Or set MONGODB_URI in .env.local (production)');
  console.error('\nMake sure MONGODB_URI points to your production database (mongodb+srv://...)');
  process.exit(1);
}

// Safety check - warn if production URI doesn't look like production
if (!PRODUCTION_URI.includes('mongodb+srv://')) {
  console.warn('⚠️  Warning: Production URI should be a MongoDB Atlas URI (mongodb+srv://...)');
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Continue anyway? (yes/no): ', (answer) => {
    readline.close();
    if (answer.toLowerCase() !== 'yes') {
      console.log('Transfer cancelled.');
      process.exit(0);
    }
    transferData();
  });
} else {
  transferData();
}

async function transferData() {
  let localClient, prodClient;
  
  try {
    console.log('\n🚀 Starting data transfer from local to production...\n');
    console.log('📊 Collections to transfer:', COLLECTIONS.join(', '));
    console.log('📦 Database:', DB_NAME);
    console.log('');
    
    // Connect to local database
    console.log('🔌 Connecting to local database...');
    localClient = new MongoClient(LOCAL_URI);
    await localClient.connect();
    const localDb = localClient.db(DB_NAME);
    console.log('✅ Connected to local database\n');
    
    // Connect to production database
    console.log('🔌 Connecting to production database...');
    prodClient = new MongoClient(PRODUCTION_URI);
    await prodClient.connect();
    const prodDb = prodClient.db(DB_NAME);
    console.log('✅ Connected to production database\n');
    
    // Transfer each collection
    for (const collectionName of COLLECTIONS) {
      await transferCollection(localDb, prodDb, collectionName);
    }
    
    console.log('\n✅ Data transfer completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during transfer:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (localClient) {
      await localClient.close();
      console.log('🔒 Closed local database connection');
    }
    if (prodClient) {
      await prodClient.close();
      console.log('🔒 Closed production database connection');
    }
  }
}

async function transferCollection(localDb, prodDb, collectionName) {
  try {
    console.log(`\n📋 Transferring collection: ${collectionName}`);
    
    // Get documents from local database
    const localCollection = localDb.collection(collectionName);
    const localDocs = await localCollection.find({}).toArray();
    const docCount = localDocs.length;
    
    if (docCount === 0) {
      console.log(`   ⚠️  No documents found in local ${collectionName} collection`);
      return;
    }
    
    console.log(`   📥 Found ${docCount} documents in local database`);
    
    // Check if production collection has data
    const prodCollection = prodDb.collection(collectionName);
    const prodCount = await prodCollection.countDocuments();
    
    if (prodCount > 0) {
      console.log(`   ⚠️  Production ${collectionName} collection already has ${prodCount} documents`);
      console.log('   🔄 Replacing existing data...');
      await prodCollection.deleteMany({});
      console.log('   ✅ Cleared existing production data');
    }
    
    // Insert documents into production database
    if (docCount > 0) {
      console.log(`   📤 Inserting ${docCount} documents into production...`);
      
      // Use insertMany with ordered: false to handle duplicates gracefully
      try {
        const result = await prodCollection.insertMany(localDocs, { ordered: false });
        console.log(`   ✅ Successfully inserted ${result.insertedCount} documents`);
        
        if (result.insertedCount < docCount) {
          console.log(`   ⚠️  Warning: ${docCount - result.insertedCount} documents were skipped (duplicates or errors)`);
        }
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error - some documents might have been inserted
          console.log(`   ⚠️  Some documents already exist (duplicate keys)`);
        } else {
          throw error;
        }
      }
    }
    
    // Verify transfer
    const finalCount = await prodCollection.countDocuments();
    console.log(`   ✨ Production ${collectionName} now has ${finalCount} documents`);
    
  } catch (error) {
    console.error(`   ❌ Error transferring ${collectionName}:`, error.message);
    throw error;
  }
}

