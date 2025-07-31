import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://cperkkyxiirnseahxehz.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwZXJra3l4aWlybnNlYWh4ZWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NjI0MTEsImV4cCI6MjA2OTUzODQxMX0.B0kMyDFUqKtZL63zqaZv46g3XtkZGM--OmfVvPYcuAE';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Safely connect to Supabase database from client-side code
 * This provides a secure approach for client-side database operations
 */
export class SupabaseClient {
  private static instance: SupabaseClient;
  private apiUrl: string;

  private constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || '/api';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SupabaseClient {
    if (!SupabaseClient.instance) {
      SupabaseClient.instance = new SupabaseClient();
    }
    return SupabaseClient.instance;
  }

  /**
   * Get Supabase client instance
   * @returns Supabase client
   */
  public getClient() {
    return supabase;
  }

  /**
   * Test the database connection
   * @returns True if connection successful
   */
  public async testConnection(): Promise<boolean> {
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
   * Execute a query with authentication
   * @param table Table name
   * @param options Query options
   * @returns Query result
   */
  public async query(table: string, options: {
    select?: string;
    eq?: { [key: string]: any };
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }) {
    try {
      let query = supabase.from(table).select(options.select || '*');
      
      if (options.eq) {
        Object.entries(options.eq).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      if (options.order) {
        query = query.order(options.order.column, { 
          ascending: options.order.ascending !== false 
        });
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  /**
   * Insert data into a table
   * @param table Table name
   * @param data Data to insert
   * @returns Insert result
   */
  public async insert(table: string, data: any) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();
      
      if (error) {
        throw error;
      }
      
      return result;
    } catch (error) {
      console.error('Insert error:', error);
      throw error;
    }
  }

  /**
   * Update data in a table
   * @param table Table name
   * @param data Data to update
   * @param eq Where conditions
   * @returns Update result
   */
  public async update(table: string, data: any, eq: { [key: string]: any }) {
    try {
      let query = supabase.from(table).update(data);
      
      Object.entries(eq).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { data: result, error } = await query.select();
      
      if (error) {
        throw error;
      }
      
      return result;
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  }

  /**
   * Delete data from a table
   * @param table Table name
   * @param eq Where conditions
   * @returns Delete result
   */
  public async delete(table: string, eq: { [key: string]: any }) {
    try {
      let query = supabase.from(table).delete();
      
      Object.entries(eq).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { data: result, error } = await query.select();
      
      if (error) {
        throw error;
      }
      
      return result;
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }
}

export default SupabaseClient.getInstance(); 