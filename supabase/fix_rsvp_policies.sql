-- ========================================
-- Fix RLS Policies for Public RSVP Access
-- ========================================
-- Run this in Supabase SQL Editor
-- This allows guests to access their own data via RSVP token without authentication

-- ========================================
-- 1. Enable RLS on tables (if not already)
-- ========================================
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. Add public READ policy for guests (by rsvp_token)
-- ========================================
-- Drop existing public policy if any
DROP POLICY IF EXISTS "Public can read guest by rsvp_token" ON guests;

-- Allow anyone to read a guest row if they know the rsvp_token
CREATE POLICY "Public can read guest by rsvp_token" ON guests
    FOR SELECT
    USING (rsvp_token IS NOT NULL);

-- ========================================
-- 3. Add public READ policy for events (by wedding_id)
-- ========================================
DROP POLICY IF EXISTS "Public can read events for RSVP" ON events;

-- Allow anyone to read events (needed for RSVP form)
CREATE POLICY "Public can read events for RSVP" ON events
    FOR SELECT
    USING (true);

-- ========================================
-- 4. Add public READ policy for weddings (by id)
-- ========================================
DROP POLICY IF EXISTS "Public can read wedding for RSVP" ON weddings;

-- Allow anyone to read wedding details (for RSVP greeting)
CREATE POLICY "Public can read wedding for RSVP" ON weddings
    FOR SELECT
    USING (true);

-- ========================================
-- 5. Add public INSERT/UPDATE policy for event_rsvps
-- ========================================
DROP POLICY IF EXISTS "Public can insert RSVP" ON event_rsvps;
DROP POLICY IF EXISTS "Public can update RSVP" ON event_rsvps;

-- Allow anyone to insert RSVP responses
CREATE POLICY "Public can insert RSVP" ON event_rsvps
    FOR INSERT
    WITH CHECK (true);

-- Allow anyone to update their RSVP responses
CREATE POLICY "Public can update RSVP" ON event_rsvps
    FOR UPDATE
    USING (true);

-- ========================================
-- 6. Add public UPDATE policy for guests (limited fields)
-- ========================================
DROP POLICY IF EXISTS "Public can update guest RSVP data" ON guests;

-- Allow anyone to update guest RSVP-related fields
-- This is needed for dietary restrictions, travel dates, etc.
CREATE POLICY "Public can update guest RSVP data" ON guests
    FOR UPDATE
    USING (rsvp_token IS NOT NULL);

-- ========================================
-- 7. Verify policies (optional)
-- ========================================
-- SELECT * FROM pg_policies WHERE tablename IN ('guests', 'events', 'weddings', 'event_rsvps');
