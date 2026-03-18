import {
  WARNING_THRESHOLD,
  PLAN_FEATURE_LABELS,
  PLAN_FEATURE_ICONS,
  PLAN_DISPLAY_NAMES,
  PLAN_FEATURE_ORDER,
} from '@/lib/plans/config';

const ALL_FEATURES = [
  'beneficiaries',
  'push_notifications_monthly',
  'cashiers',
  'branches',
  'collaborators',
  'redeemable_products',
] as const;

const ALL_PLANS = ['trial', 'advance', 'pro'] as const;

describe('WARNING_THRESHOLD', () => {
  it('is 0.8', () => {
    expect(WARNING_THRESHOLD).toBe(0.8);
  });
});

describe('PLAN_FEATURE_LABELS', () => {
  it('has labels for all features', () => {
    for (const feature of ALL_FEATURES) {
      expect(PLAN_FEATURE_LABELS[feature]).toBeDefined();
      expect(typeof PLAN_FEATURE_LABELS[feature]).toBe('string');
      expect(PLAN_FEATURE_LABELS[feature].length).toBeGreaterThan(0);
    }
  });

  it('has expected label values', () => {
    expect(PLAN_FEATURE_LABELS.beneficiaries).toBe('Beneficiarios');
    expect(PLAN_FEATURE_LABELS.push_notifications_monthly).toBe('Notificaciones / mes');
    expect(PLAN_FEATURE_LABELS.cashiers).toBe('Cajeros');
    expect(PLAN_FEATURE_LABELS.branches).toBe('Sucursales');
    expect(PLAN_FEATURE_LABELS.collaborators).toBe('Usuarios colaboradores');
    expect(PLAN_FEATURE_LABELS.redeemable_products).toBe('Premios canjeables');
  });
});

describe('PLAN_FEATURE_ICONS', () => {
  it('has icons for all features', () => {
    for (const feature of ALL_FEATURES) {
      expect(PLAN_FEATURE_ICONS[feature]).toBeDefined();
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
      expect(PLAN_DISPLAY_NAMES[plan]).toBeDefined();
      expect(typeof PLAN_DISPLAY_NAMES[plan]).toBe('string');
    }
  });

  it('has expected values', () => {
    expect(PLAN_DISPLAY_NAMES.trial).toBe('Plan Trial');
    expect(PLAN_DISPLAY_NAMES.advance).toBe('Plan Advance');
    expect(PLAN_DISPLAY_NAMES.pro).toBe('Plan Pro');
  });
});

describe('PLAN_FEATURE_ORDER', () => {
  it('contains all features', () => {
    expect(PLAN_FEATURE_ORDER).toHaveLength(ALL_FEATURES.length);
    for (const feature of ALL_FEATURES) {
      expect(PLAN_FEATURE_ORDER).toContain(feature);
    }
  });

  it('has expected order', () => {
    expect(PLAN_FEATURE_ORDER).toEqual([
      'beneficiaries',
      'push_notifications_monthly',
      'cashiers',
      'branches',
      'collaborators',
      'redeemable_products',
    ]);
  });
});
