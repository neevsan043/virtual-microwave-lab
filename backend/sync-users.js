import { pgPool, mongoClient } from './src/config/database.js';
import { UserMongoModel } from './src/models/UserMongo.js';

async function syncAllUsers() {
  try {
    console.log('🔄 Starting user sync from PostgreSQL to MongoDB...\n');
    
    // Connect to databases
    await mongoClient.connect();
    console.log('✓ MongoDB connected');
    
    const pgClient = await pgPool.connect();
    console.log('✓ PostgreSQL connected\n');
    
    // Get all users from PostgreSQL
    const result = await pgClient.query(
      'SELECT id, email, name, role, registration_number, phone_number, birthday, created_at, last_login FROM users'
    );
    
    console.log(`Found ${result.rows.length} users in PostgreSQL\n`);
    
    // Sync each user to MongoDB
    let successCount = 0;
    let failCount = 0;
    
    for (const user of result.rows) {
      try {
        await UserMongoModel.syncUser({
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          registrationNumber: user.registration_number,
          phoneNumber: user.phone_number,
          birthday: user.birthday,
          createdAt: user.created_at,
          lastLogin: user.last_login,
        });
        console.log(`✓ Synced: ${user.name} (${user.email})`);
        successCount++;
      } catch (error) {
        console.error(`✗ Failed to sync ${user.email}:`, error.message);
        failCount++;
      }
    }
    
    console.log(`\n📊 Sync Summary:`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Total: ${result.rows.length}\n`);
    
    // Verify in MongoDB
    const mongoCount = await UserMongoModel.collection.countDocuments();
    console.log(`✓ MongoDB now has ${mongoCount} users\n`);
    
    pgClient.release();
    await mongoClient.close();
    await pgPool.end();
    
    console.log('✅ Sync complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

syncAllUsers();
