-- Wedding Ops - COMPLETE RLS FIX
-- Run this ENTIRE script in Supabase SQL Editor
-- This fixes ALL permission issues

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

-- Users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Weddings
DROP POLICY IF EXISTS "Users can view their wedding" ON public.weddings;
DROP POLICY IF EXISTS "Planners can update their wedding" ON public.weddings;
DROP POLICY IF EXISTS "Planners can insert weddings" ON public.weddings;
DROP POLICY IF EXISTS "Authenticated users can insert weddings" ON public.weddings;
DROP POLICY IF EXISTS "Authenticated users can view weddings" ON public.weddings;
DROP POLICY IF EXISTS "Authenticated users can update weddings" ON public.weddings;

-- Guests
DROP POLICY IF EXISTS "Users can view wedding guests" ON public.guests;
DROP POLICY IF EXISTS "Planners can manage guests" ON public.guests;
DROP POLICY IF EXISTS "Authenticated users can view guests" ON public.guests;
DROP POLICY IF EXISTS "Authenticated users can insert guests" ON public.guests;
DROP POLICY IF EXISTS "Authenticated users can update guests" ON public.guests;
DROP POLICY IF EXISTS "Authenticated users can delete guests" ON public.guests;
DROP POLICY IF EXISTS "Anyone can view guest by RSVP token" ON public.guests;
DROP POLICY IF EXISTS "Anyone can update guest by RSVP token" ON public.guests;

-- Venues
DROP POLICY IF EXISTS "Users can view wedding venues" ON public.venues;
DROP POLICY IF EXISTS "Planners can manage venues" ON public.venues;
DROP POLICY IF EXISTS "Authenticated users can view venues" ON public.venues;
DROP POLICY IF EXISTS "Authenticated users can insert venues" ON public.venues;
DROP POLICY IF EXISTS "Authenticated users can update venues" ON public.venues;
DROP POLICY IF EXISTS "Authenticated users can delete venues" ON public.venues;

-- Events
DROP POLICY IF EXISTS "Users can view wedding events" ON public.events;
DROP POLICY IF EXISTS "Planners can manage events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.events;

-- Hotels
DROP POLICY IF EXISTS "Users can view wedding hotels" ON public.hotels;
DROP POLICY IF EXISTS "Planners can manage hotels" ON public.hotels;
DROP POLICY IF EXISTS "Authenticated users can view hotels" ON public.hotels;
DROP POLICY IF EXISTS "Authenticated users can insert hotels" ON public.hotels;
DROP POLICY IF EXISTS "Authenticated users can update hotels" ON public.hotels;
DROP POLICY IF EXISTS "Authenticated users can delete hotels" ON public.hotels;

-- Rooms
DROP POLICY IF EXISTS "Authenticated users can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can insert rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can delete rooms" ON public.rooms;

-- Seating Tables
DROP POLICY IF EXISTS "Authenticated users can view tables" ON public.seating_tables;
DROP POLICY IF EXISTS "Authenticated users can insert tables" ON public.seating_tables;
DROP POLICY IF EXISTS "Authenticated users can update tables" ON public.seating_tables;
DROP POLICY IF EXISTS "Authenticated users can delete tables" ON public.seating_tables;

-- Table Assignments
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON public.table_assignments;
DROP POLICY IF EXISTS "Authenticated users can insert assignments" ON public.table_assignments;
DROP POLICY IF EXISTS "Authenticated users can delete assignments" ON public.table_assignments;
DROP POLICY IF EXISTS "Public can view/update RSVPs" ON public.event_rsvps;

-- ============================================
-- STEP 2: CREATE SIMPLE PERMISSIVE POLICIES
-- For development: Allow all authenticated users full access
-- ============================================

-- USERS TABLE
CREATE POLICY "Allow auth users to read own profile" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Allow auth users to insert own profile" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Allow auth users to update own profile" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- WEDDINGS TABLE
CREATE POLICY "Allow auth users full wedding access" ON public.weddings
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- GUESTS TABLE
CREATE POLICY "Allow auth users full guest access" ON public.guests
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- VENUES TABLE
CREATE POLICY "Allow auth users full venue access" ON public.venues
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- EVENTS TABLE
CREATE POLICY "Allow auth users full event access" ON public.events
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- HOTELS TABLE
CREATE POLICY "Allow auth users full hotel access" ON public.hotels
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ROOMS TABLE
CREATE POLICY "Allow auth users full room access" ON public.rooms
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- SEATING TABLES TABLE
CREATE POLICY "Allow auth users full seating table access" ON public.seating_tables
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- TABLE ASSIGNMENTS TABLE
CREATE POLICY "Allow auth users full assignment access" ON public.table_assignments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- EVENT RSVPS TABLE (public access for guest responses)
CREATE POLICY "Allow public RSVP access" ON public.event_rsvps
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- STEP 3: IMPROVED USER TRIGGER
-- Ensures user is created in public.users when they sign up
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, COALESCE(NEW.email, ''), 'planner')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 4: FUNCTION TO ENSURE USER EXISTS
-- Call this to create user profile if missing
-- ============================================

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  SELECT auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()), 'planner'
  WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;

-- ============================================
-- STEP 5: FUNCTION TO LINK USER TO WEDDING
-- ============================================

CREATE OR REPLACE FUNCTION public.link_user_to_wedding(p_wedding_id UUID)
RETURNS VOID AS $$
BEGIN
  -- First ensure user profile exists
  INSERT INTO public.users (id, email, role)
  SELECT auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()), 'planner'
  WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid());
  
  -- Then update with wedding_id
  UPDATE public.users 
  SET wedding_id = p_wedding_id 
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.link_user_to_wedding(UUID) TO authenticated;

-- ============================================
-- STEP 6: CREATE MISSING USER PROFILES
-- This backfills any existing auth users without profiles
-- ============================================

INSERT INTO public.users (id, email, role)
SELECT au.id, au.email, 'planner'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DONE! All policies are now permissive for authenticated users
-- ============================================
