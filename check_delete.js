const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env.local.vercel
const envConfig = dotenv.parse(fs.readFileSync('.env.local.vercel'));
const supabaseUrl = envConfig['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envConfig['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Querying all foreign keys pointing to posts...');
  
  // Actually, we can use RPC or run a generic sql using rpc if available.
  // Wait, Supabase client cannot run arbitrary SQL unless we use postgres connection string.
  // Let's just try to delete an arbitrary post from the db directly and see if it gives a constraint error.
  
  // Or better, let's just create a dummy post and try to delete it to see if it works.
  const { data: users, error: userErr } = await supabase.from('users').select('id').limit(1);
  if (userErr) { console.error(userErr); return; }
  
  if (!users || users.length === 0) { console.log('No users found.'); return; }
  const userId = users[0].id;
  
  console.log('Creating dummy post...');
  const { data: post, error: insertErr } = await supabase.from('posts').insert({
      user_id: userId,
      post_type: 'text',
      content: 'TEST POST TO DELETE',
      is_anon: true,
  }).select().single();
  
  if (insertErr) { console.error('Insert error:', insertErr); return; }
  console.log('Created post:', post.id);
  
  // Try to delete immediately. If it fails, that means even empty posts fail.
  // BUT the issue the user had was with posts that might have interactions!
  // "people cannot delete their own post" - usually posts people try to delete have interactions.
  // The interactions we cascaded: user_screenshots, replies, post_views.
  
  console.log('Testing manual delete via API equivalent...');
  const { error: delErr } = await supabase.from('posts').delete().eq('id', post.id);
  console.log('Delete result:', delErr || 'Success');
}

main().catch(console.error);
