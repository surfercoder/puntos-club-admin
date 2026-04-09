jest.mock('next/dynamic', () => (loader: () => Promise<unknown>) => {
  // Invoke the loader so the inner `import(...).then(...)` lines run
  void loader();
  const Comp = () => null;
  Comp.displayName = 'DynamicComponent';
  return Comp;
});

import { BranchPerformanceChart } from '@/components/dashboard/charts/branch-performance-chart';
import { MemberGrowthChart } from '@/components/dashboard/charts/member-growth-chart';
import { PlanUsageChart } from '@/components/dashboard/charts/plan-usage-chart';
import { PointsEconomyChart } from '@/components/dashboard/charts/points-economy-chart';
import { PurchasesOverTimeChart } from '@/components/dashboard/charts/purchases-over-time-chart';
import { TopProductsChart } from '@/components/dashboard/charts/top-products-chart';

describe('chart dynamic wrappers', () => {
  it('exports each chart wrapper', () => {
    expect(BranchPerformanceChart).toBeDefined();
    expect(MemberGrowthChart).toBeDefined();
    expect(PlanUsageChart).toBeDefined();
    expect(PointsEconomyChart).toBeDefined();
    expect(PurchasesOverTimeChart).toBeDefined();
    expect(TopProductsChart).toBeDefined();
  });
});
