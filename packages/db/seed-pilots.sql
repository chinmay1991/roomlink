-- Seeds the two PRD pilot hotels (§29/§30) for acceptance testing.
-- Mirrors apps/super-admin's createHotel() transaction shape: hotel row,
-- a hotel-scoped "Hotel Admin" role, an active admin user, the onboarding
-- tracker steps, and a trial subscription. Idempotent-ish: safe to re-run
-- only if the hotel_code rows are deleted first.

DO $$
DECLARE
  hotel_a_id UUID := 'e0000000-0000-0000-0000-0000000000a1';
  hotel_b_id UUID := 'e0000000-0000-0000-0000-0000000000b1';
  role_a_id UUID;
  role_b_id UUID;
  pw_hash VARCHAR := '$2b$10$GIV9nL0uFljJYqX3lNyNQeaBwVwTx5itmN0WoKkNITn2ticM2gXT6'; -- TestPass123!
BEGIN
  -- Hotel A: 110-room pilot, WITH department managers
  INSERT INTO hotels (hotel_id, name, hotel_code, country, time_zone, status, plan_id)
  VALUES (hotel_a_id, 'Pilot Hotel — 110 Room', 'PILOT-110', 'India', 'Asia/Kolkata', 'onboarding',
          'a0000000-0000-0000-0000-000000000002')
  ON CONFLICT (hotel_code) DO NOTHING;

  INSERT INTO roles (hotel_id, name, is_system_role) VALUES (hotel_a_id, 'Hotel Admin', false)
  ON CONFLICT (hotel_id, name) DO NOTHING;
  SELECT role_id INTO role_a_id FROM roles WHERE hotel_id = hotel_a_id AND name = 'Hotel Admin';

  INSERT INTO users (hotel_id, role_id, user_type, full_name, email, password_hash, status)
  VALUES (hotel_a_id, role_a_id, 'hotel_admin', 'Priya Sharma', 'admin@pilot110.example', pw_hash, 'active')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO onboarding_tracker (hotel_id, step_name, step_order, status)
  VALUES
    (hotel_a_id, 'Hotel Profile', 1, 'complete'),
    (hotel_a_id, 'Legal & GST', 2, 'pending'),
    (hotel_a_id, 'Departments', 3, 'pending'),
    (hotel_a_id, 'Rooms', 4, 'pending'),
    (hotel_a_id, 'QR Codes', 5, 'pending'),
    (hotel_a_id, 'Staff', 6, 'pending'),
    (hotel_a_id, 'Department Managers', 7, 'pending'),
    (hotel_a_id, 'Guest Services', 8, 'pending'),
    (hotel_a_id, 'Restaurant Menu', 9, 'pending'),
    (hotel_a_id, 'Notifications & Settings', 10, 'pending'),
    (hotel_a_id, 'Review', 11, 'pending')
  ON CONFLICT (hotel_id, step_name) DO NOTHING;

  INSERT INTO subscriptions (hotel_id, plan_id, status, start_date, trial_end_date)
  VALUES (hotel_a_id, 'a0000000-0000-0000-0000-000000000002', 'trial', now(), now() + interval '14 days')
  ON CONFLICT DO NOTHING;

  -- Hotel B: 15-room pilot, NO department managers, cross-department staff
  INSERT INTO hotels (hotel_id, name, hotel_code, country, time_zone, status, plan_id)
  VALUES (hotel_b_id, 'Pilot Hotel — 15 Room', 'PILOT-15', 'India', 'Asia/Kolkata', 'onboarding',
          'a0000000-0000-0000-0000-000000000001')
  ON CONFLICT (hotel_code) DO NOTHING;

  INSERT INTO roles (hotel_id, name, is_system_role) VALUES (hotel_b_id, 'Hotel Admin', false)
  ON CONFLICT (hotel_id, name) DO NOTHING;
  SELECT role_id INTO role_b_id FROM roles WHERE hotel_id = hotel_b_id AND name = 'Hotel Admin';

  INSERT INTO users (hotel_id, role_id, user_type, full_name, email, password_hash, status)
  VALUES (hotel_b_id, role_b_id, 'hotel_admin', 'Suresh Patel', 'admin@pilot15.example', pw_hash, 'active')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO onboarding_tracker (hotel_id, step_name, step_order, status)
  VALUES
    (hotel_b_id, 'Hotel Profile', 1, 'complete'),
    (hotel_b_id, 'Legal & GST', 2, 'pending'),
    (hotel_b_id, 'Departments', 3, 'pending'),
    (hotel_b_id, 'Rooms', 4, 'pending'),
    (hotel_b_id, 'QR Codes', 5, 'pending'),
    (hotel_b_id, 'Staff', 6, 'pending'),
    (hotel_b_id, 'Department Managers', 7, 'pending'),
    (hotel_b_id, 'Guest Services', 8, 'pending'),
    (hotel_b_id, 'Restaurant Menu', 9, 'pending'),
    (hotel_b_id, 'Notifications & Settings', 10, 'pending'),
    (hotel_b_id, 'Review', 11, 'pending')
  ON CONFLICT (hotel_id, step_name) DO NOTHING;

  INSERT INTO subscriptions (hotel_id, plan_id, status, start_date, trial_end_date)
  VALUES (hotel_b_id, 'a0000000-0000-0000-0000-000000000001', 'trial', now(), now() + interval '14 days')
  ON CONFLICT DO NOTHING;
END $$;
