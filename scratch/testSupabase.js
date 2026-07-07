const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://egzxyullgyiuqghxuguh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnenh5dWxsZ3lpdXFnaHh1Z3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Nzc2NzUsImV4cCI6MjA5NjQ1MzY3NX0._7XURcRZ_zGR7e7FstEIzAnbTEWcebYySy5oO5ThZpM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('propiedades').select('*').limit(1);
  if (error) {
    console.error('Error fetching propiedades:', error);
  } else {
    console.log('Successfully fetched properties. Keys in row:', data.length > 0 ? Object.keys(data[0]) : 'No rows found');
  }
}

test();
