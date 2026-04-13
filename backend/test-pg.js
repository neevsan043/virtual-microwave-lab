import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_KaEBxmLf4XJ8@ep-fragrant-cherry-amroc298.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  try {
    // Check what tables exist
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log('Tables in DB:', tables.rows.map(r => r.table_name));

    // Check if users table exists and has rows
    if (tables.rows.some(r => r.table_name === 'users')) {
      const users = await pool.query('SELECT id, email, name, role, created_at FROM users LIMIT 10');
      console.log(`Users count: ${users.rowCount}`);
      console.log('Users:', JSON.stringify(users.rows, null, 2));
    } else {
      console.log('❌ users table does NOT exist - schema was never initialized!');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

run();
