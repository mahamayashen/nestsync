"use client";

import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Returns a stable Supabase browser client instance for use in Client Components.
 * The client is memoized to prevent unnecessary re-creation on re-renders.
 */
export function useSupabase() {
  const supabase = useMemo(() => createClient(), []);
  return supabase;
}
