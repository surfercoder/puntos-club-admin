-- Migration: Create Purchase System with Points Calculation
-- Description: Implements purchase tracking, points rules, and automatic points calculation

-- ============================================================================
-- PURCHASE TABLES
-- ============================================================================

-- Create purchase table to track purchases made by cashiers for final users
CREATE TABLE IF NOT EXISTS purchase (
  id BIGSERIAL PRIMARY KEY,
  purchase_number VARCHAR(50) NOT NULL UNIQUE,
  beneficiary_id BIGINT NOT NULL REFERENCES beneficiary(id),
  cashier_id BIGINT NOT NULL REFERENCES app_user(id),
  branch_id BIGINT NOT NULL REFERENCES branch(id),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  points_earned INTEGER NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create purchase_item table to track individual items in a purchase
CREATE TABLE IF NOT EXISTS purchase_item (
  id BIGSERIAL PRIMARY KEY,
  purchase_id BIGINT NOT NULL REFERENCES purchase(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  points_earned INTEGER NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- POINTS RULES TABLES
-- ============================================================================

-- Create points_rule_type enum
CREATE TYPE points_rule_type AS ENUM (
  'fixed_amount',      -- Fixed points per dollar spent (e.g., 2 points per $1)
  'percentage',        -- Percentage of amount as points (e.g., 10% of purchase)
  'fixed_per_item',    -- Fixed points per item (e.g., 5 points per item)
  'tiered'            -- Different rates based on amount tiers
);

-- Create points_rule table to define how points are calculated
CREATE TABLE IF NOT EXISTS points_rule (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  rule_type points_rule_type NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority rules are applied first
  
  -- Rule configuration (stored as JSON for flexibility)
  -- For fixed_amount: {"points_per_dollar": 2}
  -- For percentage: {"percentage": 10}
  -- For fixed_per_item: {"points_per_item": 5}
  -- For tiered: {"tiers": [{"min": 0, "max": 50, "points_per_dollar": 1}, {"min": 50, "max": null, "points_per_dollar": 2}]}
  config JSONB NOT NULL,
  
  -- Optional filters
  organization_id BIGINT REFERENCES organization(id),
  branch_id BIGINT REFERENCES branch(id),
  category_id BIGINT REFERENCES category(id),
  
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a simple product catalog for purchases (different from redemption products)
CREATE TABLE IF NOT EXISTS purchasable_item (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id BIGINT REFERENCES category(id),
  default_price DECIMAL(10, 2) NOT NULL CHECK (default_price >= 0),
  points_rule_id BIGINT REFERENCES points_rule(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_purchase_beneficiary_id ON purchase(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_purchase_cashier_id ON purchase(cashier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_branch_id ON purchase(branch_id);
CREATE INDEX IF NOT EXISTS idx_purchase_date ON purchase(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchase_number ON purchase(purchase_number);

CREATE INDEX IF NOT EXISTS idx_purchase_item_purchase_id ON purchase_item(purchase_id);

CREATE INDEX IF NOT EXISTS idx_points_rule_active ON points_rule(is_active);
CREATE INDEX IF NOT EXISTS idx_points_rule_priority ON points_rule(priority DESC);
CREATE INDEX IF NOT EXISTS idx_points_rule_organization ON points_rule(organization_id);
CREATE INDEX IF NOT EXISTS idx_points_rule_branch ON points_rule(branch_id);

CREATE INDEX IF NOT EXISTS idx_purchasable_item_category ON purchasable_item(category_id);
CREATE INDEX IF NOT EXISTS idx_purchasable_item_active ON purchasable_item(active);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_purchase_updated_at
  BEFORE UPDATE ON purchase
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_points_rule_updated_at
  BEFORE UPDATE ON points_rule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchasable_item_updated_at
  BEFORE UPDATE ON purchasable_item
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate points based on rules
CREATE OR REPLACE FUNCTION calculate_points_for_amount(
  p_amount DECIMAL,
  p_organization_id BIGINT DEFAULT NULL,
  p_branch_id BIGINT DEFAULT NULL,
  p_category_id BIGINT DEFAULT NULL
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
BEGIN
  -- Find the highest priority active rule that matches the criteria
  SELECT * INTO v_rule
  FROM points_rule
  WHERE is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW())
    AND (organization_id IS NULL OR organization_id = p_organization_id)
    AND (branch_id IS NULL OR branch_id = p_branch_id)
    AND (category_id IS NULL OR category_id = p_category_id)
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

-- Function to generate unique purchase number
CREATE OR REPLACE FUNCTION generate_purchase_number()
RETURNS VARCHAR AS $$
DECLARE
  v_date VARCHAR;
  v_sequence INTEGER;
  v_purchase_number VARCHAR;
BEGIN
  v_date := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(
    CASE 
      WHEN purchase_number LIKE 'PUR-' || v_date || '-%' 
      THEN SUBSTRING(purchase_number FROM LENGTH('PUR-' || v_date || '-') + 1)::INTEGER
      ELSE 0
    END
  ), 0) + 1 INTO v_sequence
  FROM purchase
  WHERE purchase_number LIKE 'PUR-' || v_date || '-%';
  
  v_purchase_number := 'PUR-' || v_date || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_purchase_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate purchase number
CREATE OR REPLACE FUNCTION set_purchase_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.purchase_number IS NULL OR NEW.purchase_number = '' THEN
    NEW.purchase_number := generate_purchase_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_purchase_number_trigger
  BEFORE INSERT ON purchase
  FOR EACH ROW
  EXECUTE FUNCTION set_purchase_number();

-- Trigger function to update beneficiary points after purchase
CREATE OR REPLACE FUNCTION update_beneficiary_points_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Add earned points to beneficiary's available points
  UPDATE beneficiary
  SET available_points = available_points + NEW.points_earned
  WHERE id = NEW.beneficiary_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_beneficiary_points_trigger
  AFTER INSERT ON purchase
  FOR EACH ROW
  EXECUTE FUNCTION update_beneficiary_points_after_purchase();

-- ============================================================================
-- SEED DEFAULT POINTS RULES
-- ============================================================================

INSERT INTO points_rule (name, description, rule_type, config, is_active, priority) VALUES
  (
    'Default Points Rule',
    'Standard rule: 2 points per dollar spent',
    'fixed_amount',
    '{"points_per_dollar": 2}',
    true,
    0
  ),
  (
    'High Spender Bonus',
    'Tiered rule: 1 point per dollar up to $50, then 3 points per dollar',
    'tiered',
    '{"tiers": [{"min": 0, "max": 50, "points_per_dollar": 1}, {"min": 50, "max": null, "points_per_dollar": 3}]}',
    false,
    10
  ),
  (
    'Weekend Bonus',
    'Weekend special: 5 points per dollar (activate manually)',
    'fixed_amount',
    '{"points_per_dollar": 5}',
    false,
    20
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE purchase IS 'Tracks purchases made by cashiers for final users';
COMMENT ON TABLE purchase_item IS 'Individual items in a purchase';
COMMENT ON TABLE points_rule IS 'Defines rules for calculating points from purchases';
COMMENT ON TABLE purchasable_item IS 'Catalog of items that can be purchased (not redeemed)';

COMMENT ON COLUMN purchase.purchase_number IS 'Unique purchase identifier (auto-generated)';
COMMENT ON COLUMN purchase.points_earned IS 'Total points earned from this purchase';
COMMENT ON COLUMN points_rule.priority IS 'Higher priority rules are applied first when multiple rules match';
COMMENT ON COLUMN points_rule.config IS 'JSON configuration for the rule based on rule_type';
