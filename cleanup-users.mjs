import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// We need the SERVICE ROUND key to bypass RLS and delete users from the Auth schema.
// DO NOT expose this key to the client.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('To run this script, please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanupTestUsers() {
  console.log(`Starting cleanup on: ${supabaseUrl}`);

  // Fetch all users
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Failed to list users:', listError);
    process.exit(1);
  }

  if (users.length === 0) {
    console.log('✅ No users found to delete.');
    process.exit(0);
  }

  console.log(`Found ${users.length} users. Deleting...`);

  let deletedCount = 0;

  for (const user of users) {
    // Only delete users created by our Playwright test or specific test emails to be safe.
    // For now, we will delete all users since this is a fresh setup and only Playwright/Demo users exist.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error(`❌ Failed to delete user ${user.email} (${user.id}):`, deleteError);
    } else {
      console.log(`🗑️ Deleted ${user.email}`);
      deletedCount++;
    }
  }

  console.log(`\n✅ Cleanup complete. Deleted ${deletedCount} out of ${users.length} users.`);
}

cleanupTestUsers();
