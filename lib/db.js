const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://cperkkyxiirnseahxehz.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwZXJra3l4aWlybnNlYWh4ZWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NjI0MTEsImV4cCI6MjA2OTUzODQxMX0.B0kMyDFUqKtZL63zqaZv46g3XtkZGM--OmfVvPYcuAE';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get Supabase client instance
 * @returns {Object} Supabase client
 */
function getSupabaseClient() {
  return supabase;
}

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test error:', error);
    return false;
  }
}

/**
 * Execute a raw SQL query (if needed)
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function executeQuery(query, params = []) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query_text: query,
      query_params: params
    });
    
    if (error) {
      throw error;
    }
    
    return { rows: data, rowCount: data?.length || 0 };
  } catch (error) {
    console.error('SQL query error:', error);
    throw error;
  }
}

/**
 * Get a client for transactions (Supabase handles this automatically)
 * @returns {Object} Supabase client
 */
async function getClient() {
  return supabase;
}

module.exports = {
  supabase,
  getSupabaseClient,
  testConnection,
  executeQuery,
  getClient
};
