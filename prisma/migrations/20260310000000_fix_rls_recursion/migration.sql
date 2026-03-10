-- Fix infinite recursion in household_members RLS policies (error 42P17)
--
-- The household_members_select policy previously did:
--   SELECT household_id FROM household_members WHERE user_id = auth.uid()
-- which triggered itself recursively. Fix: use user_id = auth.uid() directly
-- for the user's own rows, plus a non-recursive check for co-members.

-- Step 1: Drop the recursive policies
DROP POLICY IF EXISTS "household_members_select" ON "household_members";
DROP POLICY IF EXISTS "household_members_update_admin" ON "household_members";

-- Step 2: Recreate household_members SELECT without recursion
-- Users can see all members in households they belong to.
-- We use a security-definer function to break the recursion chain.
CREATE OR REPLACE FUNCTION public.get_my_household_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id
  FROM household_members
  WHERE user_id = auth.uid() AND left_at IS NULL;
$$;

-- Allow users to see their own rows directly (needed for INSERT ... RETURNING
-- since the just-inserted row isn't visible to get_my_household_ids() within
-- the same statement snapshot), plus all co-members via the helper function.
CREATE POLICY "household_members_select"
  ON "household_members" FOR SELECT
  USING (
    user_id = auth.uid()
    OR household_id IN (SELECT public.get_my_household_ids())
  );

-- Step 3: Fix admin update policy (same recursion issue)
CREATE POLICY "household_members_update_admin"
  ON "household_members" FOR UPDATE
  USING (
    household_id IN (SELECT public.get_my_household_ids())
    AND EXISTS (
      SELECT 1 FROM public.get_my_household_ids() AS h
      WHERE h = household_id
    )
  );

-- Step 4: Fix households SELECT policy (it also referenced household_members)
-- Also allow the creator to SELECT their own household right after INSERT
-- (before they become a member via household_members INSERT).
DROP POLICY IF EXISTS "households_select_member" ON "households";

CREATE POLICY "households_select_member"
  ON "households" FOR SELECT
  USING (
    id IN (SELECT public.get_my_household_ids())
    OR created_by = auth.uid()
  );

-- Step 5: Fix households UPDATE policy
DROP POLICY IF EXISTS "households_update_admin" ON "households";

-- Use the helper function + check admin role
CREATE OR REPLACE FUNCTION public.get_my_admin_household_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id
  FROM household_members
  WHERE user_id = auth.uid() AND role = 'admin' AND left_at IS NULL;
$$;

CREATE POLICY "households_update_admin"
  ON "households" FOR UPDATE
  USING (
    id IN (SELECT public.get_my_admin_household_ids())
  );
