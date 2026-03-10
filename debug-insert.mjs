import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Use standard Anon Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugSetup() {
  console.log("Simulating 'createHousehold' logic to find the exact database error...");
  
  // 1. Try to insert a test user so we have an auth.uid()
  const { data: userData, error: userError } = await supabase.auth.signUp({
    email: `debug_${Date.now()}@example.com`,
    password: 'password123'
  });

  if (userError) {
     console.error("Failed to sign up debug user", userError);
     process.exit(1);
  }
  
  const userId = userData?.user?.id;
  console.log("Got user ID:", userId);

  // 2. Try to insert into households
  const { data: houseData, error: houseError } = await supabase
    .from('households')
    .insert([{ name: 'Test Insert House' }])
    .select('id')
    .single();

  if (houseError) {
    console.error("❌ ERROR INSERTING HOUSEHOLD:", houseError);
    process.exit(1);
  }

  console.log("Inserted household successfully:", houseData.id);

  // 3. Try to insert into members
  const { data: memberData, error: memberError } = await supabase
    .from('members')
    .insert([{
      household_id: houseData.id,
      user_id: userId,
      role: 'seasonal_admin'
    }]);

  if (memberError) {
    console.error("❌ ERROR INSERTING MEMBER:", memberError);
  } else {
    console.log("Inserted member successfully!");
  }
}

debugSetup();
