jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  not: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: null, error: null })),
  auth: {
    getUser: jest.fn(() => ({
      data: { user: { id: 'auth-1' } },
      error: null,
    })),
  },
};
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() =>
    Promise.resolve({ id: 1, organization_id: 10, role: { name: 'owner' } })
  ),
}));

import {
  getDashboardKpis,
  getMonthlyPurchaseStats,
  getMonthlyPointsStats,
  getMonthlyMemberStats,
  getTopProducts,
  getBranchPerformance,
} from '@/actions/dashboard/analytics/actions';
import { getCurrentUser } from '@/lib/auth/get-current-user';

function resetMockSupabase() {
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.gte.mockReturnValue(mockSupabase);
  mockSupabase.not.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: null, error: null });
  (getCurrentUser as jest.Mock).mockResolvedValue({
    id: 1,
    organization_id: 10,
    role: { name: 'owner' },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetMockSupabase();
});

// ---------------------------------------------------------------------------
// Helper: build a date string in a given month offset from now
// ---------------------------------------------------------------------------
function dateInMonth(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(15);
  return d.toISOString();
}

function _currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ===========================================================================
// getDashboardKpis
// ===========================================================================
describe('getDashboardKpis', () => {
  it('returns null when user has no org', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);
    const result = await getDashboardKpis();
    expect(result).toBeNull();
  });

  it('returns null when user has no organization_id', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 1, organization_id: null });
    const result = await getDashboardKpis();
    expect(result).toBeNull();
  });

  it('returns KPIs with correct calculations from mocked data', async () => {
    // getDashboardKpis builds 4 queries in Promise.all synchronously.
    // Chain: from -> select -> eq -> eq/gte -> eq/gte
    // We use fromCallCount to branch into per-query chain objects.

    const membersChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn()
        .mockReturnValueOnce({ eq: jest.fn().mockReturnValue({ data: null, error: null, count: 5 }) }),
    };
    const revenueChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnValue({
        gte: jest.fn().mockReturnValue({
          data: [
            { total_amount: 100, points_earned: 10 },
            { total_amount: 200, points_earned: 20 },
          ],
          error: null,
        }),
      }),
    };
    const circulationChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn()
        .mockReturnValueOnce({ eq: jest.fn().mockReturnValue({ data: [{ available_points: 50 }, { available_points: 30 }], error: null }) }),
    };
    const redemptionsChain = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnValue({
        data: [{ points_used: 15 }, { points_used: 25 }],
        error: null,
      }),
    };

    mockSupabase.from
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(revenueChain)
      .mockReturnValueOnce(circulationChain)
      .mockReturnValueOnce(redemptionsChain);

    const result = await getDashboardKpis();
    expect(result).not.toBeNull();
    expect(result!.total_active_members).toBe(5);
    expect(result!.revenue_this_month).toBe(300);
    expect(result!.purchases_this_month).toBe(2);
    expect(result!.points_in_circulation).toBe(80);
    expect(result!.redemptions_this_month).toBe(2);
    expect(result!.points_redeemed_this_month).toBe(40);
  });

  it('handles null values in reduce fields (triggers ?? 0 fallbacks)', async () => {
    const membersChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn()
        .mockReturnValueOnce({ eq: jest.fn().mockReturnValue({ data: null, error: null, count: 3 }) }),
    };
    const revenueChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnValue({
        gte: jest.fn().mockReturnValue({
          data: [
            { total_amount: null, points_earned: null },
            { total_amount: 100, points_earned: null },
            { total_amount: null, points_earned: 5 },
          ],
          error: null,
        }),
      }),
    };
    const circulationChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn()
        .mockReturnValueOnce({ eq: jest.fn().mockReturnValue({ data: [{ available_points: null }, { available_points: 20 }], error: null }) }),
    };
    const redemptionsChain = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnValue({
        data: [{ points_used: null }, { points_used: 10 }],
        error: null,
      }),
    };

    mockSupabase.from
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(revenueChain)
      .mockReturnValueOnce(circulationChain)
      .mockReturnValueOnce(redemptionsChain);

    const result = await getDashboardKpis();
    expect(result).not.toBeNull();
    expect(result!.revenue_this_month).toBe(100);
    expect(result!.points_in_circulation).toBe(20);
    expect(result!.points_redeemed_this_month).toBe(10);
  });

  it('returns zeroes when all queries return null data', async () => {
    const emptyTerminal = { data: null, error: null, count: null };
    const chainWithEqEq = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue(emptyTerminal) }),
    };
    const chainWithEqGte = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnValue({ gte: jest.fn().mockReturnValue(emptyTerminal) }),
    };
    const chainWithGte = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnValue(emptyTerminal),
    };

    mockSupabase.from
      .mockReturnValueOnce(chainWithEqEq)    // members
      .mockReturnValueOnce(chainWithEqGte)   // revenue
      .mockReturnValueOnce(chainWithEqEq)    // circulation
      .mockReturnValueOnce(chainWithGte);    // redemptions

    const result = await getDashboardKpis();
    expect(result).not.toBeNull();
    expect(result!.total_active_members).toBe(0);
    expect(result!.revenue_this_month).toBe(0);
    expect(result!.purchases_this_month).toBe(0);
    expect(result!.points_in_circulation).toBe(0);
    expect(result!.redemptions_this_month).toBe(0);
    expect(result!.points_redeemed_this_month).toBe(0);
  });
});

// ===========================================================================
// getMonthlyPurchaseStats
// ===========================================================================
describe('getMonthlyPurchaseStats', () => {
  it('returns empty array when user has no org', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);
    const result = await getMonthlyPurchaseStats();
    expect(result).toEqual([]);
  });

  it('returns empty array on error', async () => {
    mockSupabase.order.mockReturnValue({ data: null, error: { message: 'fail' } });
    const result = await getMonthlyPurchaseStats();
    expect(result).toEqual([]);
  });

  it('returns grouped monthly data with fillMissingMonths', async () => {
    const thisMonth = dateInMonth(0);
    const lastMonth = dateInMonth(1);

    mockSupabase.order.mockReturnValue({
      data: [
        { purchase_date: thisMonth, total_amount: 100, points_earned: 10 },
        { purchase_date: thisMonth, total_amount: 200, points_earned: 20 },
        { purchase_date: lastMonth, total_amount: 50, points_earned: 5 },
      ],
      error: null,
    });

    const result = await getMonthlyPurchaseStats(6);
    // Should have exactly 6 entries (one per month)
    expect(result).toHaveLength(6);

    // Last entry (most recent month) should have aggregated values
    const currentEntry = result[result.length - 1];
    expect(currentEntry.revenue).toBe(300);
    expect(currentEntry.points_earned).toBe(30);
    expect(currentEntry.purchase_count).toBe(2);

    // Second to last should have last month's data
    const prevEntry = result[result.length - 2];
    expect(prevEntry.revenue).toBe(50);
    expect(prevEntry.points_earned).toBe(5);
    expect(prevEntry.purchase_count).toBe(1);

    // Older months should be zero-filled
    const oldEntry = result[0];
    expect(oldEntry.revenue).toBe(0);
    expect(oldEntry.points_earned).toBe(0);
    expect(oldEntry.purchase_count).toBe(0);
  });

  it('handles null total_amount and points_earned in purchase data (triggers ?? 0)', async () => {
    const thisMonth = dateInMonth(0);
    mockSupabase.order.mockReturnValue({
      data: [
        { purchase_date: thisMonth, total_amount: null, points_earned: null },
        { purchase_date: thisMonth, total_amount: 50, points_earned: null },
        { purchase_date: thisMonth, total_amount: null, points_earned: 10 },
      ],
      error: null,
    });

    const result = await getMonthlyPurchaseStats(6);
    const currentEntry = result[result.length - 1];
    expect(currentEntry.revenue).toBe(50);
    expect(currentEntry.points_earned).toBe(10);
    expect(currentEntry.purchase_count).toBe(3);
  });

  it('returns all zero-filled months when data is empty array', async () => {
    mockSupabase.order.mockReturnValue({ data: [], error: null });
    const result = await getMonthlyPurchaseStats(3);
    expect(result).toHaveLength(3);
    result.forEach((entry) => {
      expect(entry.revenue).toBe(0);
      expect(entry.points_earned).toBe(0);
      expect(entry.purchase_count).toBe(0);
    });
  });
});

// ===========================================================================
// getMonthlyPointsStats
// ===========================================================================
describe('getMonthlyPointsStats', () => {
  it('returns empty array when user has no org', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);
    const result = await getMonthlyPointsStats();
    expect(result).toEqual([]);
  });

  it('returns grouped monthly points data from purchases and redemptions', async () => {
    const thisMonth = dateInMonth(0);
    const lastMonth = dateInMonth(1);

    // getMonthlyPointsStats does Promise.all on two queries.
    // Both end with .gte() call.
    let gteCount = 0;
    mockSupabase.gte.mockImplementation(() => {
      gteCount++;
      if (gteCount === 1) {
        // purchases query
        return {
          data: [
            { purchase_date: thisMonth, points_earned: 100 },
            { purchase_date: lastMonth, points_earned: 50 },
          ],
          error: null,
        };
      }
      if (gteCount === 2) {
        // redemptions query
        return {
          data: [
            { redemption_date: thisMonth, points_used: 30 },
            { redemption_date: thisMonth, points_used: 20 },
          ],
          error: null,
        };
      }
      return mockSupabase;
    });

    const result = await getMonthlyPointsStats(6);
    expect(result).toHaveLength(6);

    const current = result[result.length - 1];
    expect(current.points_earned).toBe(100);
    expect(current.points_redeemed).toBe(50);

    const prev = result[result.length - 2];
    expect(prev.points_earned).toBe(50);
    expect(prev.points_redeemed).toBe(0);
  });

  it('handles null points_earned and points_used in data (triggers ?? 0)', async () => {
    const thisMonth = dateInMonth(0);

    let gteCount = 0;
    mockSupabase.gte.mockImplementation(() => {
      gteCount++;
      if (gteCount === 1) {
        return {
          data: [
            { purchase_date: thisMonth, points_earned: null },
            { purchase_date: thisMonth, points_earned: 25 },
          ],
          error: null,
        };
      }
      if (gteCount === 2) {
        return {
          data: [
            { redemption_date: thisMonth, points_used: null },
            { redemption_date: thisMonth, points_used: 15 },
          ],
          error: null,
        };
      }
      return mockSupabase;
    });

    const result = await getMonthlyPointsStats(6);
    const current = result[result.length - 1];
    expect(current.points_earned).toBe(25);
    expect(current.points_redeemed).toBe(15);
  });

  it('handles redemption arriving in a new month not in purchases (creates new grouped entry)', async () => {
    const thisMonth = dateInMonth(0);
    const lastMonth = dateInMonth(1);

    let gteCount = 0;
    mockSupabase.gte.mockImplementation(() => {
      gteCount++;
      if (gteCount === 1) {
        // purchases only in thisMonth
        return {
          data: [{ purchase_date: thisMonth, points_earned: 10 }],
          error: null,
        };
      }
      if (gteCount === 2) {
        // redemptions in lastMonth (no purchase in that month)
        return {
          data: [{ redemption_date: lastMonth, points_used: 5 }],
          error: null,
        };
      }
      return mockSupabase;
    });

    const result = await getMonthlyPointsStats(6);
    const prev = result[result.length - 2];
    expect(prev.points_redeemed).toBe(5);
    expect(prev.points_earned).toBe(0);
  });

  it('returns zero-filled months when both queries return null data', async () => {
    mockSupabase.gte.mockReturnValue({ data: null, error: null });
    const result = await getMonthlyPointsStats(3);
    expect(result).toHaveLength(3);
    result.forEach((entry) => {
      expect(entry.points_earned).toBe(0);
      expect(entry.points_redeemed).toBe(0);
    });
  });
});

// ===========================================================================
// getMonthlyMemberStats
// ===========================================================================
describe('getMonthlyMemberStats', () => {
  it('returns empty array when user has no org', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);
    const result = await getMonthlyMemberStats();
    expect(result).toEqual([]);
  });

  it('returns empty array on error', async () => {
    mockSupabase.order.mockReturnValue({ data: null, error: { message: 'fail' } });
    const result = await getMonthlyMemberStats();
    expect(result).toEqual([]);
  });

  it('returns monthly stats with cumulative total_members', async () => {
    const threeMonthsAgo = dateInMonth(3);
    const twoMonthsAgo = dateInMonth(2);
    const thisMonth = dateInMonth(0);

    mockSupabase.order.mockReturnValue({
      data: [
        { joined_date: threeMonthsAgo },
        { joined_date: threeMonthsAgo },
        { joined_date: twoMonthsAgo },
        { joined_date: thisMonth },
        { joined_date: thisMonth },
        { joined_date: thisMonth },
      ],
      error: null,
    });

    const result = await getMonthlyMemberStats(6);
    expect(result).toHaveLength(6);

    // Verify cumulative calculation
    // Months from oldest to newest: [0, 0, 2, 1, 0, 3]
    // Cumulative:                    [0, 0, 2, 3, 3, 6]
    const threeMonthsAgoIdx = result.length - 4;
    const twoMonthsAgoIdx = result.length - 3;
    const currentIdx = result.length - 1;

    expect(result[threeMonthsAgoIdx].new_members).toBe(2);
    expect(result[twoMonthsAgoIdx].new_members).toBe(1);
    expect(result[currentIdx].new_members).toBe(3);

    // Cumulative should increase
    expect(result[threeMonthsAgoIdx].total_members).toBe(2);
    expect(result[twoMonthsAgoIdx].total_members).toBe(3);
    expect(result[currentIdx].total_members).toBe(6);

    // Earlier months should have 0 new and cumulative 0
    expect(result[0].new_members).toBe(0);
    expect(result[0].total_members).toBe(0);
  });

  it('returns zero-filled months with cumulative 0 when data is empty', async () => {
    mockSupabase.order.mockReturnValue({ data: [], error: null });
    const result = await getMonthlyMemberStats(4);
    expect(result).toHaveLength(4);
    result.forEach((entry) => {
      expect(entry.new_members).toBe(0);
      expect(entry.total_members).toBe(0);
    });
  });
});

// ===========================================================================
// getTopProducts
// ===========================================================================
describe('getTopProducts', () => {
  it('returns empty array when user has no org', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);
    const result = await getTopProducts();
    expect(result).toEqual([]);
  });

  it('returns empty array on error', async () => {
    mockSupabase.not.mockReturnValue({ data: null, error: { message: 'fail' } });
    const result = await getTopProducts();
    expect(result).toEqual([]);
  });

  it('returns top products grouped and sorted by redemptions', async () => {
    mockSupabase.not.mockReturnValue({
      data: [
        { points_used: 100, quantity: 2, product: { name: 'Product A', organization_id: 10 } },
        { points_used: 50, quantity: 1, product: { name: 'Product A', organization_id: 10 } },
        { points_used: 200, quantity: 5, product: { name: 'Product B', organization_id: 10 } },
      ],
      error: null,
    });

    const result = await getTopProducts();
    expect(result).toHaveLength(2);
    // Product B has more redemptions (5) than Product A (3)
    expect(result[0].name).toBe('Product B');
    expect(result[0].redemptions).toBe(5);
    expect(result[0].points_used).toBe(200);
    expect(result[1].name).toBe('Product A');
    expect(result[1].redemptions).toBe(3);
    expect(result[1].points_used).toBe(150);
  });

  it('filters out products from other organizations', async () => {
    mockSupabase.not.mockReturnValue({
      data: [
        { points_used: 100, quantity: 2, product: { name: 'My Product', organization_id: 10 } },
        { points_used: 50, quantity: 1, product: { name: 'Other Product', organization_id: 99 } },
      ],
      error: null,
    });

    const result = await getTopProducts();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('My Product');
  });

  it('handles product as array (array relation)', async () => {
    mockSupabase.not.mockReturnValue({
      data: [
        {
          points_used: 80,
          quantity: 3,
          product: [{ name: 'Array Product', organization_id: 10 }],
        },
      ],
      error: null,
    });

    const result = await getTopProducts();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Array Product');
    expect(result[0].redemptions).toBe(3);
    expect(result[0].points_used).toBe(80);
  });

  it('skips rows where product is null', async () => {
    mockSupabase.not.mockReturnValue({
      data: [
        { points_used: 50, quantity: 1, product: null },
        { points_used: 100, quantity: 2, product: { name: 'Valid', organization_id: 10 } },
      ],
      error: null,
    });

    const result = await getTopProducts();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Valid');
  });

  it('respects the limit parameter', async () => {
    const data = Array.from({ length: 15 }, (_, i) => ({
      points_used: 10,
      quantity: 15 - i,
      product: { name: `Product ${i}`, organization_id: 10 },
    }));
    mockSupabase.not.mockReturnValue({ data, error: null });

    const result = await getTopProducts(5);
    expect(result).toHaveLength(5);
  });

  it('uses "Unknown" for products with no name', async () => {
    mockSupabase.not.mockReturnValue({
      data: [
        { points_used: 10, quantity: 1, product: { name: null, organization_id: 10 } },
      ],
      error: null,
    });

    const result = await getTopProducts();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Unknown');
  });

  it('defaults quantity to 1 when null', async () => {
    mockSupabase.not.mockReturnValue({
      data: [
        { points_used: 10, quantity: null, product: { name: 'P', organization_id: 10 } },
      ],
      error: null,
    });

    const result = await getTopProducts();
    expect(result[0].redemptions).toBe(1);
  });

  it('defaults points_used to 0 when null', async () => {
    mockSupabase.not.mockReturnValue({
      data: [
        { points_used: null, quantity: 2, product: { name: 'P', organization_id: 10 } },
      ],
      error: null,
    });

    const result = await getTopProducts();
    expect(result[0].points_used).toBe(0);
    expect(result[0].redemptions).toBe(2);
  });
});

// ===========================================================================
// getBranchPerformance
// ===========================================================================
describe('getBranchPerformance', () => {
  it('returns empty array when user has no org', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);
    const result = await getBranchPerformance();
    expect(result).toEqual([]);
  });

  it('returns empty array on error', async () => {
    mockSupabase.not.mockReturnValue({ data: null, error: { message: 'fail' } });
    const result = await getBranchPerformance();
    expect(result).toEqual([]);
  });

  it('returns branch performance grouped and sorted by revenue', async () => {
    mockSupabase.not.mockReturnValue({
      data: [
        { total_amount: 100, branch: { name: 'Branch A' } },
        { total_amount: 200, branch: { name: 'Branch A' } },
        { total_amount: 500, branch: { name: 'Branch B' } },
      ],
      error: null,
    });

    const result = await getBranchPerformance();
    expect(result).toHaveLength(2);
    expect(result[0].branch).toBe('Branch B');
    expect(result[0].revenue).toBe(500);
    expect(result[0].purchase_count).toBe(1);
    expect(result[1].branch).toBe('Branch A');
    expect(result[1].revenue).toBe(300);
    expect(result[1].purchase_count).toBe(2);
  });

  it('handles branch as array (array relation)', async () => {
    mockSupabase.not.mockReturnValue({
      data: [
        { total_amount: 150, branch: [{ name: 'Array Branch' }] },
      ],
      error: null,
    });

    const result = await getBranchPerformance();
    expect(result).toHaveLength(1);
    expect(result[0].branch).toBe('Array Branch');
    expect(result[0].revenue).toBe(150);
  });

  it('uses "Sin sucursal" when branch has no name', async () => {
    mockSupabase.not.mockReturnValue({
      data: [{ total_amount: 100, branch: { name: null } }],
      error: null,
    });

    const result = await getBranchPerformance();
    expect(result).toHaveLength(1);
    expect(result[0].branch).toBe('Sin sucursal');
  });

  it('uses "Sin sucursal" when branch is null', async () => {
    mockSupabase.not.mockReturnValue({
      data: [{ total_amount: 100, branch: null }],
      error: null,
    });

    const result = await getBranchPerformance();
    expect(result).toHaveLength(1);
    expect(result[0].branch).toBe('Sin sucursal');
  });

  it('defaults total_amount to 0 when null', async () => {
    mockSupabase.not.mockReturnValue({
      data: [{ total_amount: null, branch: { name: 'B' } }],
      error: null,
    });

    const result = await getBranchPerformance();
    expect(result[0].revenue).toBe(0);
    expect(result[0].purchase_count).toBe(1);
  });
});
