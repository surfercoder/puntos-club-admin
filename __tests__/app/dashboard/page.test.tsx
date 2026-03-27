import { redirect } from 'next/navigation';
import DashboardPage from '@/app/dashboard/page';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'user-1', email: 'test@test.com' } },
        error: null,
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'u1', auth_user_id: 'user-1', role: 'owner' },
        error: null,
      }),
    })),
  })),
}));

jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({ id: 'u1', role: 'owner' }),
}));

jest.mock('@/lib/auth/roles', () => ({
  isOwner: jest.fn(() => true),
  isCollaborator: jest.fn(() => false),
  isAdmin: jest.fn(() => false),
}));

jest.mock('@/actions/dashboard/usage/actions', () => ({
  getUsageSummaryAction: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/actions/dashboard/analytics/actions', () => ({
  getDashboardKpis: jest.fn().mockResolvedValue(null),
  getMonthlyPurchaseStats: jest.fn().mockResolvedValue([]),
  getMonthlyPointsStats: jest.fn().mockResolvedValue([]),
  getMonthlyMemberStats: jest.fn().mockResolvedValue([]),
  getTopProducts: jest.fn().mockResolvedValue([]),
  getBranchPerformance: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/components/dashboard/charts/kpi-cards', () => ({
  KpiCards: () => <div data-testid="kpi-cards" />,
}));
jest.mock('@/components/dashboard/charts/purchases-over-time-chart', () => ({
  PurchasesOverTimeChart: () => <div data-testid="purchases-chart" />,
}));
jest.mock('@/components/dashboard/charts/points-economy-chart', () => ({
  PointsEconomyChart: () => <div data-testid="points-chart" />,
}));
jest.mock('@/components/dashboard/charts/member-growth-chart', () => ({
  MemberGrowthChart: () => <div data-testid="member-chart" />,
}));
jest.mock('@/components/dashboard/charts/top-products-chart', () => ({
  TopProductsChart: () => <div data-testid="top-products-chart" />,
}));
jest.mock('@/components/dashboard/charts/branch-performance-chart', () => ({
  BranchPerformanceChart: () => <div data-testid="branch-chart" />,
}));
jest.mock('@/components/dashboard/charts/plan-usage-chart', () => ({
  PlanUsageChart: () => <div data-testid="plan-usage-chart" />,
}));

describe('DashboardPage', () => {
  it('exports a default async function', () => {
    expect(typeof DashboardPage).toBe('function');
  });

  it('renders dashboard content when authenticated', async () => {
    const result = await DashboardPage();
    expect(result).toBeTruthy();
  });

  it('redirects to login when not authenticated', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      auth: {
        getUser: jest.fn(() => Promise.resolve({
          data: { user: null },
          error: { message: 'Not authenticated' },
        })),
      },
    });

    await DashboardPage();
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  it('renders "No tienes acceso" when user has no analytics access', async () => {
    const { getCurrentUser } = require('@/lib/auth/get-current-user');
    const { isOwner: isOwnerFn, isCollaborator: isCollaboratorFn, isAdmin: isAdminFn } = require('@/lib/auth/roles');

    getCurrentUser.mockResolvedValueOnce({ id: 'u1', role: 'cashier' });
    isOwnerFn.mockReturnValueOnce(false);
    isCollaboratorFn.mockReturnValueOnce(false);
    isAdminFn.mockReturnValueOnce(false);

    require('react');
    const result = await DashboardPage();
    // The result should be the "no access" JSX
    const rendered = require('react-dom/server').renderToStaticMarkup(result);
    expect(rendered).toContain('No tienes acceso');
  });

  it('renders empty chart card when topProducts is empty', async () => {
    const { getTopProducts, getBranchPerformance, getDashboardKpis, getMonthlyPurchaseStats, getMonthlyPointsStats, getMonthlyMemberStats } = require('@/actions/dashboard/analytics/actions');
    getDashboardKpis.mockResolvedValueOnce({ totalMembers: 10 });
    getMonthlyPurchaseStats.mockResolvedValueOnce([{ month: '2024-01', count: 5 }]);
    getMonthlyPointsStats.mockResolvedValueOnce([{ month: '2024-01', earned: 100 }]);
    getMonthlyMemberStats.mockResolvedValueOnce([{ month: '2024-01', count: 3 }]);
    getTopProducts.mockResolvedValueOnce([]);
    getBranchPerformance.mockResolvedValueOnce([{ branch: 'Main', count: 10 }]);

    const result = await DashboardPage();
    const rendered = require('react-dom/server').renderToStaticMarkup(result);
    expect(rendered).toContain('Productos más canjeados');
    expect(rendered).toContain('Aún no hay canjes registrados.');
  });

  it('renders empty chart card when branchPerformance is empty', async () => {
    const { getTopProducts, getBranchPerformance, getDashboardKpis, getMonthlyPurchaseStats, getMonthlyPointsStats, getMonthlyMemberStats } = require('@/actions/dashboard/analytics/actions');
    getDashboardKpis.mockResolvedValueOnce({ totalMembers: 10 });
    getMonthlyPurchaseStats.mockResolvedValueOnce([{ month: '2024-01', count: 5 }]);
    getMonthlyPointsStats.mockResolvedValueOnce([{ month: '2024-01', earned: 100 }]);
    getMonthlyMemberStats.mockResolvedValueOnce([{ month: '2024-01', count: 3 }]);
    getTopProducts.mockResolvedValueOnce([{ product: 'Widget', count: 5 }]);
    getBranchPerformance.mockResolvedValueOnce([]);

    const result = await DashboardPage();
    const rendered = require('react-dom/server').renderToStaticMarkup(result);
    expect(rendered).toContain('Rendimiento por sucursal');
    expect(rendered).toContain('Aún no hay compras por sucursal.');
  });

  it('renders both empty chart cards when topProducts and branchPerformance are empty', async () => {
    const { getTopProducts, getBranchPerformance, getDashboardKpis, getMonthlyPurchaseStats, getMonthlyPointsStats, getMonthlyMemberStats } = require('@/actions/dashboard/analytics/actions');
    getDashboardKpis.mockResolvedValueOnce({ totalMembers: 10 });
    getMonthlyPurchaseStats.mockResolvedValueOnce([{ month: '2024-01', count: 5 }]);
    getMonthlyPointsStats.mockResolvedValueOnce([{ month: '2024-01', earned: 100 }]);
    getMonthlyMemberStats.mockResolvedValueOnce([{ month: '2024-01', count: 3 }]);
    getTopProducts.mockResolvedValueOnce([]);
    getBranchPerformance.mockResolvedValueOnce([]);

    const result = await DashboardPage();
    const rendered = require('react-dom/server').renderToStaticMarkup(result);
    expect(rendered).toContain('Productos más canjeados');
    expect(rendered).toContain('Aún no hay canjes registrados.');
    expect(rendered).toContain('Rendimiento por sucursal');
    expect(rendered).toContain('Aún no hay compras por sucursal.');
  });
});
