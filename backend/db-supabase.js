const { createClient } = require('@supabase/supabase-js');

let supabase;

const getSupabase = () => {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
};

module.exports = { getSupabase };
