#!/usr/bin/env node

/**
 * Firestore Setup and Test Script
 * Run this to test your Firestore connection
 */

const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testFirestoreConnection() {
  console.log('🔥 Testing Firestore Connection...\n');
  
  // Check environment variables
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!projectId) {
    console.error('❌ GOOGLE_CLOUD_PROJECT_ID is not set in .env.local');
    console.log('Please add: GOOGLE_CLOUD_PROJECT_ID=your-project-id');
    process.exit(1);
  }
  
  console.log(`📋 Project ID: ${projectId}`);
  
  if (credentialsPath) {
    console.log(`🔑 Using credentials from: ${credentialsPath}`);
    
    // Check if credentials file exists
    if (!fs.existsSync(credentialsPath)) {
      console.error(`❌ Credentials file not found: ${credentialsPath}`);
      console.log('Please download your service account key and update GOOGLE_APPLICATION_CREDENTIALS');
      process.exit(1);
    }
  } else {
    console.log('🔑 Using Application Default Credentials');
    console.log('Make sure you\'ve run: gcloud auth application-default login');
  }
  
  try {
    // Initialize Firestore
    const db = new Firestore({
      projectId: projectId,
      // For now, we'll use the project ID without authentication
      // This will work for testing the connection
    });
    
    console.log('\n🔌 Testing connection...');
    
    // Test connection by creating a test document
    const testCollection = db.collection('_test');
    const testDoc = testCollection.doc('connection-test');
    
    await testDoc.set({
      timestamp: new Date(),
      message: 'Firestore connection test successful!',
      app: 'browns-fleet-tracker'
    });
    
    console.log('✅ Successfully wrote test document');
    
    // Read it back
    const doc = await testDoc.get();
    if (doc.exists) {
      console.log('✅ Successfully read test document');
      console.log('📄 Document data:', doc.data());
    }
    
    // Clean up test document
    await testDoc.delete();
    console.log('🧹 Cleaned up test document');
    
    console.log('\n🎉 Firestore setup is working correctly!');
    console.log('\n📝 Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Visit: http://localhost:3000/api/init');
    console.log('3. Start using your fleet tracker!');
    
  } catch (error) {
    console.error('\n❌ Firestore connection failed:');
    console.error(error.message);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your Firestore database is created');
    console.log('2. Check your project ID is correct');
    console.log('3. Verify your credentials have proper permissions');
    console.log('4. Ensure Firestore API is enabled in your project');
    
    process.exit(1);
  }
}

// Run the test
testFirestoreConnection();
