-- Migration: Enhance Points Rules for Recurring Time-Based Offers
-- Description: Add support for daily/weekly recurring schedules and improved time-based rules

-- ============================================================================
-- ADD RECURRING SCHEDULE SUPPORT
-- ============================================================================

-- Add schedule configuration column for recurring time-based rules
ALTER TABLE points_rule ADD COLUMN IF NOT EXISTS schedule_config JSONB;

-- Add day of week filter (0=Sunday, 6=Saturday)
ALTER TABLE points_rule ADD COLUMN IF NOT EXISTS days_of_week INTEGER[];

-- Add time range for daily recurring offers
ALTER TABLE points_rule ADD COLUMN IF NOT EXISTS time_start TIME;
ALTER TABLE points_rule ADD COLUMN IF NOT EXISTS time_end TIME;

-- Add display settings for mobile apps
ALTER TABLE points_rule ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE points_rule ADD COLUMN IF NOT EXISTS display_icon VARCHAR(50);
ALTER TABLE points_rule ADD COLUMN IF NOT EXISTS display_color VARCHAR(20);
ALTER TABLE points_rule ADD COLUMN IF NOT EXISTS show_in_app BOOLEAN DEFAULT true;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN points_rule.schedule_config IS 'JSON config for advanced scheduling (future use)';
COMMENT ON COLUMN points_rule.days_of_week IS 'Array of days when rule is active (0=Sun, 6=Sat). NULL means all days.';
COMMENT ON COLUMN points_rule.time_start IS 'Daily start time for recurring offers (e.g., 18:00 for 6 PM)';
COMMENT ON COLUMN points_rule.time_end IS 'Daily end time for recurring offers (e.g., 06:00 for 6 AM next day)';
COMMENT ON COLUMN points_rule.display_name IS 'User-friendly name shown in mobile apps';
COMMENT ON COLUMN points_rule.display_icon IS 'Emoji or icon identifier for mobile display';
COMMENT ON COLUMN points_rule.display_color IS 'Color code for UI elements';
COMMENT ON COLUMN points_rule.show_in_app IS 'Whether to show this rule as an active offer in mobile apps';

-- ============================================================================
-- UPDATE POINTS CALCULATION FUNCTION
-- ============================================================================

-- Enhanced function to check time-based and day-based rules
CREATE OR REPLACE FUNCTION calculate_points_for_amount(
  p_amount DECIMAL,
  p_organization_id BIGINT DEFAULT NULL,
  p_branch_id BIGINT DEFAULT NULL,
  p_category_id BIGINT DEFAULT NULL,
  p_purchase_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER AS $$
DECLARE
  v_points INTEGER := 0;
  v_rule RECORD;
  v_config JSONB;
  v_points_per_dollar DECIMAL;
  v_percentage DECIMAL;
  v_tiers JSONB;
  v_tier JSONB;
  v_current_time TIME;
  v_current_day INTEGER;
BEGIN
  -- Get current time and day of week
  v_current_time := p_purchase_time::TIME;
  v_current_day := EXTRACT(DOW FROM p_purchase_time)::INTEGER;

  -- Find the highest priority active rule that matches ALL criteria
  SELECT * INTO v_rule
  FROM points_rule
  WHERE is_active = true
    -- Check date range
    AND (valid_from IS NULL OR valid_from <= p_purchase_time)
    AND (valid_until IS NULL OR valid_until >= p_purchase_time)
    -- Check organization/branch/category filters
    AND (organization_id IS NULL OR organization_id = p_organization_id)
    AND (branch_id IS NULL OR branch_id = p_branch_id)
    AND (category_id IS NULL OR category_id = p_category_id)
    -- Check day of week (NULL means all days)
    AND (days_of_week IS NULL OR v_current_day = ANY(days_of_week))
    -- Check time range
    AND (
      (time_start IS NULL AND time_end IS NULL) OR
      -- Handle same-day time range (e.g., 09:00 - 17:00)
      (time_start <= time_end AND v_current_time >= time_start AND v_current_time <= time_end) OR
      -- Handle overnight time range (e.g., 18:00 - 06:00)
      (time_start > time_end AND (v_current_time >= time_start OR v_current_time <= time_end))
    )
  ORDER BY priority DESC, id DESC
  LIMIT 1;

  -- If no rule found, return 0 points
  IF v_rule IS NULL THEN
    RETURN 0;
  END IF;

  v_config := v_rule.config;

  -- Calculate points based on rule type
  CASE v_rule.rule_type
    WHEN 'fixed_amount' THEN
      v_points_per_dollar := (v_config->>'points_per_dollar')::DECIMAL;
      v_points := FLOOR(p_amount * v_points_per_dollar);
      
    WHEN 'percentage' THEN
      v_percentage := (v_config->>'percentage')::DECIMAL;
      v_points := FLOOR(p_amount * v_percentage / 100);
      
    WHEN 'fixed_per_item' THEN
      -- For fixed per item, we'd need item count, defaulting to amount-based for now
      v_points_per_dollar := (v_config->>'points_per_dollar')::DECIMAL;
      v_points := FLOOR(p_amount * v_points_per_dollar);
      
    WHEN 'tiered' THEN
      v_tiers := v_config->'tiers';
      -- Find the appropriate tier
      FOR v_tier IN SELECT * FROM jsonb_array_elements(v_tiers)
      LOOP
        IF (v_tier->>'min')::DECIMAL <= p_amount AND 
           ((v_tier->>'max') IS NULL OR (v_tier->>'max')::DECIMAL >= p_amount) THEN
          v_points_per_dollar := (v_tier->>'points_per_dollar')::DECIMAL;
          v_points := FLOOR(p_amount * v_points_per_dollar);
          EXIT;
        END IF;
      END LOOP;
  END CASE;

  RETURN v_points;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION TO GET ACTIVE OFFERS FOR DISPLAY
-- ============================================================================

CREATE OR REPLACE FUNCTION get_active_offers(
  p_organization_id BIGINT DEFAULT NULL,
  p_branch_id BIGINT DEFAULT NULL,
  p_check_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  id BIGINT,
  display_name VARCHAR,
  description TEXT,
  display_icon VARCHAR,
  display_color VARCHAR,
  rule_type points_rule_type,
  config JSONB,
  time_start TIME,
  time_end TIME,
  days_of_week INTEGER[],
  valid_until TIMESTAMPTZ
) AS $$
DECLARE
  v_current_time TIME;
  v_current_day INTEGER;
BEGIN
  v_current_time := p_check_time::TIME;
  v_current_day := EXTRACT(DOW FROM p_check_time)::INTEGER;

  RETURN QUERY
  SELECT 
    pr.id,
    pr.display_name,
    pr.description,
    pr.display_icon,
    pr.display_color,
    pr.rule_type,
    pr.config,
    pr.time_start,
    pr.time_end,
    pr.days_of_week,
    pr.valid_until
  FROM points_rule pr
  WHERE pr.is_active = true
    AND pr.show_in_app = true
    AND (pr.valid_from IS NULL OR pr.valid_from <= p_check_time)
    AND (pr.valid_until IS NULL OR pr.valid_until >= p_check_time)
    AND (pr.organization_id IS NULL OR pr.organization_id = p_organization_id)
    AND (pr.branch_id IS NULL OR pr.branch_id = p_branch_id)
    AND (pr.days_of_week IS NULL OR v_current_day = ANY(pr.days_of_week))
    AND (
      (pr.time_start IS NULL AND pr.time_end IS NULL) OR
      (pr.time_start <= pr.time_end AND v_current_time >= pr.time_start AND v_current_time <= pr.time_end) OR
      (pr.time_start > pr.time_end AND (v_current_time >= pr.time_start OR v_current_time <= pr.time_end))
    )
  ORDER BY pr.priority DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE EXISTING RULES WITH DISPLAY INFO
-- ============================================================================

UPDATE points_rule 
SET 
  display_name = 'Standard Points',
  display_icon = '⭐',
  display_color = '#3B82F6',
  show_in_app = false  -- Don't show default rule as special offer
WHERE name = 'Default Points Rule';

UPDATE points_rule 
SET 
  display_name = 'High Spender Bonus',
  display_icon = '💎',
  display_color = '#8B5CF6',
  show_in_app = true
WHERE name = 'High Spender Bonus';

UPDATE points_rule 
SET 
  display_name = 'Weekend Special',
  display_icon = '🎉',
  display_color = '#EC4899',
  show_in_app = true,
  days_of_week = ARRAY[0, 6]  -- Sunday and Saturday
WHERE name = 'Weekend Bonus';

-- ============================================================================
-- ADD SAMPLE NIGHT-TIME OFFER
-- ============================================================================

INSERT INTO points_rule (
  name, 
  description, 
  rule_type, 
  config, 
  is_active, 
  priority,
  display_name,
  display_icon,
  display_color,
  show_in_app,
  time_start,
  time_end
) VALUES (
  'Night Double Points',
  'Earn double points during night hours (6 PM - 6 AM)',
  'fixed_amount',
  '{"points_per_dollar": 4}',
  true,
  50,
  '🌙 Night Bonus',
  '🌙',
  '#6366F1',
  true,
  '18:00:00',  -- 6 PM
  '06:00:00'   -- 6 AM next day
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- ADD SAMPLE LUNCH HOUR OFFER
-- ============================================================================

INSERT INTO points_rule (
  name, 
  description, 
  rule_type, 
  config, 
  is_active, 
  priority,
  display_name,
  display_icon,
  display_color,
  show_in_app,
  time_start,
  time_end,
  days_of_week
) VALUES (
  'Lunch Hour Boost',
  'Extra points during lunch hours on weekdays',
  'fixed_amount',
  '{"points_per_dollar": 3}',
  true,
  40,
  '🍽️ Lunch Boost',
  '🍽️',
  '#F59E0B',
  true,
  '12:00:00',  -- 12 PM
  '14:00:00',  -- 2 PM
  ARRAY[1, 2, 3, 4, 5]  -- Monday to Friday
) ON CONFLICT DO NOTHING;
