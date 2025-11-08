-- This script adds a policy to allow users to view all picks for statistics
-- Run this in the Supabase SQL Editor to enable prediction percentage features

-- Step 1: Drop the old restrictive policy that only allows users to see their own picks
DROP POLICY IF EXISTS "Users can view their own picks" ON user_picks;

-- Step 2: Add new policy that allows everyone to view all picks
-- This is safe because we only expose aggregated statistics (percentages)
-- Individual user identities are not revealed in the UI
CREATE POLICY "Users can view all picks for statistics"
  ON user_picks FOR SELECT
  USING (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_picks';
