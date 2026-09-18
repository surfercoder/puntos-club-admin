import {
  WARNING_THRESHOLD,
  UNLIMITED,
  PLAN_ORDER,
  TOP_PLAN,
  PLAN_FEATURE_LABELS,
  PLAN_FEATURE_ICONS,
  PLAN_DISPLAY_NAMES,
  PLAN_FEATURE_ORDER,
  PLAN_QUOTA_ORDER,
  PLAN_FLAG_ORDER,
  PLAN_PRICES,
  isPaidPlan,
  isQuotaFeature,
} from '@/lib/plans/config';

const ALL_QUOTAS = [
  'beneficiaries',
  'redeemable_products',
  'push_notifications_monthly',
  'cashiers',
  'branches',
  'collaborators',
] as const;

const ALL_PLANS = ['trial', 'advance', 'pro', 'enterprise'] as const;

describe('WARNING_THRESHOLD', () => {
  it('is 0.8', () => {
    expect(WARNING_THRESHOLD).toBe(0.8);
  });
});

describe('UNLIMITED', () => {
  it('is the -1 sentinel stored in plan_limits.limit_value', () => {
    expect(UNLIMITED).toBe(-1);
  });
});

describe('PLAN_FEATURE_LABELS', () => {
  it('has a label for every feature', () => {
    for (const feature of PLAN_FEATURE_ORDER) {
      expect(typeof PLAN_FEATURE_LABELS[feature]).toBe('string');
      expect(PLAN_FEATURE_LABELS[feature].length).toBeGreaterThan(0);
    }
  });

  it('has expected label values', () => {
    expect(PLAN_FEATURE_LABELS.beneficiaries).toBe('Beneficiarios');
    expect(PLAN_FEATURE_LABELS.push_notifications_monthly).toBe('Notificaciones incluidas');
    expect(PLAN_FEATURE_LABELS.cashiers).toBe('Cajeros');
    expect(PLAN_FEATURE_LABELS.branches).toBe('Sucursales');
    expect(PLAN_FEATURE_LABELS.collaborators).toBe('Colaboradores');
    expect(PLAN_FEATURE_LABELS.redeemable_products).toBe('Premios por catálogo');
    expect(PLAN_FEATURE_LABELS.campaigns).toBe('Campañas');
    expect(PLAN_FEATURE_LABELS.account_manager).toBe('Account Manager');
  });
});

describe('PLAN_FEATURE_ICONS', () => {
  it('has icons for all quotas', () => {
    for (const feature of ALL_QUOTAS) {
      expect(typeof PLAN_FEATURE_ICONS[feature]).toBe('string');
    }
  });

  it('has expected icon values', () => {
    expect(PLAN_FEATURE_ICONS.beneficiaries).toBe('Users');
    expect(PLAN_FEATURE_ICONS.push_notifications_monthly).toBe('Bell');
    expect(PLAN_FEATURE_ICONS.cashiers).toBe('UserCheck');
    expect(PLAN_FEATURE_ICONS.branches).toBe('Store');
    expect(PLAN_FEATURE_ICONS.collaborators).toBe('UserCog');
    expect(PLAN_FEATURE_ICONS.redeemable_products).toBe('Gift');
  });
});

describe('PLAN_DISPLAY_NAMES', () => {
  it('has display names for all plans', () => {
    for (const plan of ALL_PLANS) {
      expect(typeof PLAN_DISPLAY_NAMES[plan]).toBe('string');
    }
  });

  it('has expected values', () => {
    expect(PLAN_DISPLAY_NAMES.trial).toBe('Plan Trial');
    expect(PLAN_DISPLAY_NAMES.advance).toBe('Plan Advance');
    expect(PLAN_DISPLAY_NAMES.pro).toBe('Plan Pro');
    expect(PLAN_DISPLAY_NAMES.enterprise).toBe('Plan Enterprise');
  });
});

describe('PLAN_ORDER', () => {
  it('goes cheapest to most expensive', () => {
    expect(PLAN_ORDER).toEqual(['trial', 'advance', 'pro', 'enterprise']);
  });

  it('exposes the last one as the top plan (nothing to upgrade to)', () => {
    expect(TOP_PLAN).toBe('enterprise');
  });
});

describe('PLAN_PRICES / isPaidPlan', () => {
  it('only advance and pro go through Mercado Pago', () => {
    expect(isPaidPlan('trial')).toBe(false);
    expect(isPaidPlan('advance')).toBe(true);
    expect(isPaidPlan('pro')).toBe(true);
    // Enterprise no tiene precio de lista: se cierra por comercial.
    expect(PLAN_PRICES.enterprise).toBeNull();
    expect(isPaidPlan('enterprise')).toBe(false);
  });
});

describe('PLAN_FEATURE_ORDER', () => {
  it('is the 6 quotas followed by the 16 flags', () => {
    expect(PLAN_QUOTA_ORDER).toEqual([...ALL_QUOTAS]);
    expect(PLAN_FLAG_ORDER).toHaveLength(16);
    expect(PLAN_FEATURE_ORDER).toEqual([...PLAN_QUOTA_ORDER, ...PLAN_FLAG_ORDER]);
    expect(PLAN_FEATURE_ORDER).toHaveLength(22);
  });

  it('has no duplicates', () => {
    expect(new Set(PLAN_FEATURE_ORDER).size).toBe(PLAN_FEATURE_ORDER.length);
  });
});

describe('isQuotaFeature', () => {
  it('separates countable quotas from included/not-included flags', () => {
    expect(isQuotaFeature('beneficiaries')).toBe(true);
    expect(isQuotaFeature('collaborators')).toBe(true);
    expect(isQuotaFeature('campaigns')).toBe(false);
    expect(isQuotaFeature('sso')).toBe(false);
  });
});
