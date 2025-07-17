const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: '192.168.7.101',
  user: 'postgres',
  password: 'tjq5uxt3',
  database: 'cryptodb',
  port: 5432,
});

async function setupDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'database-setup.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('Executing database setup...');
    await pool.query(sql);
    
    console.log('✅ Database setup completed successfully!');
    
    // Test the tables
    const result = await pool.query('SELECT COUNT(*) FROM balance_cache');
    console.log(`Balance cache table has ${result.rows[0].count} rows`);
    
    const walletsResult = await pool.query('SELECT COUNT(*) FROM wallets_btc');
    console.log(`Wallets table has ${walletsResult.rows[0].count} rows`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase(); 