-- Two rules with the same priority make rule resolution ambiguous
-- (calculate_points_for_amount orders by priority desc, id desc).
-- One priority ladder per organization.
create unique index if not exists points_rule_organization_priority_key
  on points_rule (organization_id, priority);
