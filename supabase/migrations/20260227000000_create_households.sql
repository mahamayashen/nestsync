-- Create Households Table
CREATE TABLE public.households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on Households
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- Create Members Table
-- This links users to households with specific roles (e.g. 'admin', 'member')
CREATE TABLE public.members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'seasonal_admin')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- A user can only be in a household once
  UNIQUE (household_id, user_id)
);

-- Enable RLS on Members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- ----------------------------------------------------------------------------

-- Households Policies
-- A user can view a household if they are a member of it.
CREATE POLICY "View households if member" 
  ON public.households FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.members m 
      WHERE m.household_id = public.households.id 
      AND m.user_id = auth.uid()
    )
  );

-- Any authenticated user can create a household
CREATE POLICY "Create household if authenticated" 
  ON public.households FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Members Policies
-- A user can only view their own membership row, avoiding any recursive loops
CREATE POLICY "View own membership" 
  ON public.members FOR SELECT 
  USING (
    user_id = auth.uid()
  );

-- A user can insert themselves as a member (e.g., when creating a household or joining via invite code)
CREATE POLICY "Insert self into members" 
  ON public.members FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
