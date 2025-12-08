-- Migration: Demo Data for PuntosClub System
-- Description: Creates demo beneficiaries and test data for tomorrow's demo
-- IMPORTANT: Auth users must be created via Supabase Auth UI or signup flow

-- ============================================================================
-- DEMO FINAL USERS (Beneficiaries)
-- ============================================================================
-- NOTE: Create corresponding auth users via Supabase Dashboard > Authentication
-- Email: john.doe@demo.com, Password: demo123
-- Email: jane.smith@demo.com, Password: demo123
-- Email: mike.johnson@demo.com, Password: demo123

-- Demo User 1: John Doe
DO $$
DECLARE
  v_role_id BIGINT;
BEGIN
  -- Get the final_user role ID
  SELECT id INTO v_role_id FROM user_role WHERE name = 'final_user' LIMIT 1;

  -- Create beneficiary record
  INSERT INTO beneficiary (
    first_name,
    last_name,
    email,
    phone,
    available_points,
    role_id
  ) VALUES (
    'John',
    'Doe',
    'john.doe@demo.com',
    '+1-555-0101',
    1000,
    v_role_id
  )
  ON CONFLICT (email) DO UPDATE 
  SET available_points = 1000;
END $$;

-- Demo User 2: Jane Smith
DO $$
DECLARE
  v_role_id BIGINT;
BEGIN
  SELECT id INTO v_role_id FROM user_role WHERE name = 'final_user' LIMIT 1;

  INSERT INTO beneficiary (
    first_name,
    last_name,
    email,
    phone,
    available_points,
    role_id
  ) VALUES (
    'Jane',
    'Smith',
    'jane.smith@demo.com',
    '+1-555-0102',
    500,
    v_role_id
  )
  ON CONFLICT (email) DO UPDATE 
  SET available_points = 500;
END $$;

-- Demo User 3: Mike Johnson
DO $$
DECLARE
  v_role_id BIGINT;
BEGIN
  SELECT id INTO v_role_id FROM user_role WHERE name = 'final_user' LIMIT 1;

  INSERT INTO beneficiary (
    first_name,
    last_name,
    email,
    phone,
    available_points,
    role_id
  ) VALUES (
    'Mike',
    'Johnson',
    'mike.johnson@demo.com',
    '+1-555-0103',
    2500,
    v_role_id
  )
  ON CONFLICT (email) DO UPDATE 
  SET available_points = 2500;
END $$;

-- ============================================================================
-- DEMO CASHIER USERS
-- ============================================================================
-- NOTE: Auth users must be created via Supabase Dashboard > Authentication
-- Email: sarah.cashier@demo.com, Password: cashier123
-- Email: carlos.cashier@demo.com, Password: cashier123

-- Demo Cashier 1: Sarah Martinez
DO $$
DECLARE
  v_role_id BIGINT;
  v_org_id BIGINT;
BEGIN
  -- Get role and organization IDs
  SELECT id INTO v_role_id FROM user_role WHERE name = 'cashier' LIMIT 1;
  SELECT id INTO v_org_id FROM organization LIMIT 1;

  -- Create app_user record (links to auth user by email)
  INSERT INTO app_user (
    organization_id,
    first_name,
    last_name,
    email,
    username,
    role_id
  ) VALUES (
    v_org_id,
    'Sarah',
    'Martinez',
    'sarah.cashier@demo.com',
    'sarah.cashier',
    v_role_id
  )
  ON CONFLICT (email) DO UPDATE 
  SET first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name;
END $$;

-- Demo Cashier 2: Carlos Rodriguez
DO $$
DECLARE
  v_role_id BIGINT;
  v_org_id BIGINT;
BEGIN
  SELECT id INTO v_role_id FROM user_role WHERE name = 'cashier' LIMIT 1;
  SELECT id INTO v_org_id FROM organization LIMIT 1;

  INSERT INTO app_user (
    organization_id,
    first_name,
    last_name,
    email,
    username,
    role_id
  ) VALUES (
    v_org_id,
    'Carlos',
    'Rodriguez',
    'carlos.cashier@demo.com',
    'carlos.cashier',
    v_role_id
  )
  ON CONFLICT (email) DO UPDATE 
  SET first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN beneficiary.available_points IS 'Demo users start with varying point balances for testing';

-- ============================================================================
-- DEMO CREDENTIALS SUMMARY
-- ============================================================================

/*
==============================================
DEMO CREDENTIALS FOR TOMORROW'S PRESENTATION
==============================================

FINAL USERS (PuntosClub Mobile App):
-------------------------------------
1. Email: john.doe@demo.com
   Password: demo123
   Points: 1,000
   
2. Email: jane.smith@demo.com
   Password: demo123
   Points: 500
   
3. Email: mike.johnson@demo.com
   Password: demo123
   Points: 2,500

CASHIER USERS (PuntosClubCaja Mobile App):
------------------------------------------
1. Email: sarah.cashier@demo.com
   Password: cashier123
   Name: Sarah Martinez
   
2. Email: carlos.cashier@demo.com
   Password: cashier123
   Name: Carlos Rodriguez

ACTIVE SPECIAL OFFERS:
---------------------
- 🌙 Night Bonus: 2x points (6 PM - 6 AM daily)
- 🍽️ Lunch Boost: 1.5x points (12 PM - 2 PM, Mon-Fri)
- 🎉 Weekend Special: 2.5x points (Sat-Sun, currently inactive)

DEMO FLOW:
----------
1. Login to PuntosClub app as John Doe
2. Show QR code with 1,000 points balance
3. Login to PuntosClubCaja app as Sarah Martinez
4. Scan John's QR code
5. Add purchase items (e.g., 3 beers @ $5 = $15)
6. Complete purchase
7. John's app updates in real-time to 1,030 points
8. Check active offers display
9. Try during different times to see time-based offers

*/
