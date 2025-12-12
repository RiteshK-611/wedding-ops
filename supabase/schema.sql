-- Wedding Ops Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'planner' CHECK (role IN ('planner', 'couple', 'hotel', 'vendor')),
  wedding_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEDDINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.weddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner1_name TEXT NOT NULL,
  partner2_name TEXT NOT NULL,
  wedding_date DATE,
  event_start_date DATE,
  event_end_date DATE,
  timezone TEXT DEFAULT 'UTC',
  estimated_guest_count INT,
  primary_contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to users after weddings exists
ALTER TABLE public.users ADD CONSTRAINT users_wedding_id_fkey 
  FOREIGN KEY (wedding_id) REFERENCES public.weddings(id) ON DELETE SET NULL;

-- ============================================
-- GUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  relationship TEXT,
  rsvp_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  global_rsvp_status TEXT DEFAULT 'pending' CHECK (global_rsvp_status IN ('pending', 'yes', 'no', 'maybe')),
  is_vip BOOLEAN DEFAULT FALSE,
  dietary_restrictions TEXT[],
  accessibility_needs TEXT,
  arrival_date DATE,
  departure_date DATE,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for RSVP token lookup
CREATE INDEX IF NOT EXISTS guests_rsvp_token_idx ON public.guests(rsvp_token);

-- ============================================
-- VENUES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_type TEXT,
  event_date DATE,
  start_time TIME,
  end_time TIME,
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENT RSVPS TABLE (per-event responses)
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'yes', 'no', 'maybe')),
  responded_at TIMESTAMPTZ,
  UNIQUE(guest_id, event_id)
);

-- ============================================
-- HOTELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROOMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT DEFAULT 'standard',
  max_occupancy INT DEFAULT 2,
  assigned_guest_ids UUID[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLES (Seating) TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.seating_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INT DEFAULT 8,
  table_type TEXT DEFAULT 'round',
  position_x INT DEFAULT 100,
  position_y INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.table_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES public.seating_tables(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(table_id, guest_id)
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seating_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_assignments ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Weddings - users can access weddings they belong to
CREATE POLICY "Users can view their wedding" ON public.weddings
  FOR SELECT USING (
    id IN (SELECT wedding_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Planners can update their wedding" ON public.weddings
  FOR UPDATE USING (
    id IN (SELECT wedding_id FROM public.users WHERE id = auth.uid() AND role = 'planner')
  );

CREATE POLICY "Planners can insert weddings" ON public.weddings
  FOR INSERT WITH CHECK (true);

-- Guests - users can access guests of their wedding
CREATE POLICY "Users can view wedding guests" ON public.guests
  FOR SELECT USING (
    wedding_id IN (SELECT wedding_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Planners can manage guests" ON public.guests
  FOR ALL USING (
    wedding_id IN (SELECT wedding_id FROM public.users WHERE id = auth.uid() AND role = 'planner')
  );

-- RSVP token access for public (guests responding)
CREATE POLICY "Anyone can view guest by RSVP token" ON public.guests
  FOR SELECT USING (rsvp_token IS NOT NULL);

CREATE POLICY "Anyone can update guest by RSVP token" ON public.guests
  FOR UPDATE USING (rsvp_token IS NOT NULL);

-- Events access
CREATE POLICY "Users can view wedding events" ON public.events
  FOR SELECT USING (
    wedding_id IN (SELECT wedding_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Planners can manage events" ON public.events
  FOR ALL USING (
    wedding_id IN (SELECT wedding_id FROM public.users WHERE id = auth.uid() AND role = 'planner')
  );

-- Event RSVPs - public access for RSVP submission
CREATE POLICY "Public can view/update RSVPs" ON public.event_rsvps
  FOR ALL USING (true);

-- Hotels
CREATE POLICY "Users can view wedding hotels" ON public.hotels
  FOR SELECT USING (
    wedding_id IN (SELECT wedding_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Planners can manage hotels" ON public.hotels
  FOR ALL USING (
    wedding_id IN (SELECT wedding_id FROM public.users WHERE id = auth.uid() AND role = 'planner')
  );

-- Venues
CREATE POLICY "Users can view wedding venues" ON public.venues
  FOR SELECT USING (
    wedding_id IN (SELECT wedding_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Planners can manage venues" ON public.venues
  FOR ALL USING (
    wedding_id IN (SELECT wedding_id FROM public.users WHERE id = auth.uid() AND role = 'planner')
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'planner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for wedding updated_at
CREATE TRIGGER weddings_updated_at
  BEFORE UPDATE ON public.weddings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
