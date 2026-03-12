-- Reload PostgREST schema cache so it picks up the schedule_days column
-- added in 20260311000000_add_schedule_days.sql.
-- This must run as a migration so hosted Supabase re-caches on deploy.
NOTIFY pgrst, 'reload schema';
