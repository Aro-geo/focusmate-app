const { supabase, testConnection } = require('./lib/db');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('Environment variables:');
  console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('- SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅ Set' : '❌ Missing');
  console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');

  try {
    // Test basic connection
    const connectionResult = await testConnection();
    console.log('Connection test result:', connectionResult ? '✅ Success' : '❌ Failed');

    // Test table access
    console.log('\n🔍 Testing table access...');
    const { data: tables, error: tableError } = await supabase
      .from('todos')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table access error:', tableError.message);
    } else {
      console.log('✅ Table access successful');
      console.log('Sample data:', tables);
    }

    // Test user table
    console.log('\n🔍 Testing users table...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (userError) {
      console.error('❌ Users table error:', userError.message);
    } else {
      console.log('✅ Users table accessible');
      console.log('Sample users:', users);
    }

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testDatabaseConnection();