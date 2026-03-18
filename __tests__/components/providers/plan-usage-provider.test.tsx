import { render, screen, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

// Unmock the provider so we test the real implementation
jest.unmock('@/components/providers/plan-usage-provider');

import { PlanUsageProvider, usePlanUsage } from '@/components/providers/plan-usage-provider';
import { getUsageSummaryAction } from '@/actions/dashboard/usage/actions';
import type { OrganizationUsageSummary } from '@/types/plan';

jest.mock('@/actions/dashboard/usage/actions', () => ({
  getUsageSummaryAction: jest.fn(),
}));

const mockSummary: OrganizationUsageSummary = {
  plan: 'trial',
  features: [
    {
      feature: 'beneficiaries',
      limit_value: 100,
      current_usage: 80,
      usage_percentage: 80,
      is_at_limit: false,
      should_warn: true,
      warning_threshold: 0.8,
    },
    {
      feature: 'branches',
      limit_value: 1,
      current_usage: 1,
      usage_percentage: 100,
      is_at_limit: true,
      should_warn: true,
      warning_threshold: 0.8,
    },
  ],
};

function TestConsumer() {
  const { summary, isLoading, plan, isAtLimit, shouldWarn, getFeature } = usePlanUsage();
  const feature = getFeature('beneficiaries');
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="plan">{plan ?? 'null'}</span>
      <span data-testid="summary">{summary ? 'loaded' : 'null'}</span>
      <span data-testid="at-limit-branches">{String(isAtLimit('branches'))}</span>
      <span data-testid="at-limit-beneficiaries">{String(isAtLimit('beneficiaries'))}</span>
      <span data-testid="should-warn-beneficiaries">{String(shouldWarn('beneficiaries'))}</span>
      <span data-testid="feature-beneficiaries">{feature ? feature.feature : 'undefined'}</span>
      <span data-testid="feature-unknown">{getFeature('push_notifications_monthly') ? 'found' : 'undefined'}</span>
      <span data-testid="should-warn-unknown">{String(shouldWarn('push_notifications_monthly'))}</span>
      <span data-testid="at-limit-unknown">{String(isAtLimit('push_notifications_monthly'))}</span>
    </div>
  );
}

describe('PlanUsageProvider', () => {
  beforeEach(() => {
    (getUsageSummaryAction as jest.Mock).mockReset();
  });

  it('provides initial summary without fetching when initialSummary is given', () => {
    render(
      <PlanUsageProvider initialSummary={mockSummary}>
        <TestConsumer />
      </PlanUsageProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('plan')).toHaveTextContent('trial');
    expect(screen.getByTestId('summary')).toHaveTextContent('loaded');
    expect(getUsageSummaryAction).not.toHaveBeenCalled();
  });

  it('fetches usage on mount when no initial data', async () => {
    (getUsageSummaryAction as jest.Mock).mockResolvedValue(mockSummary);

    render(
      <PlanUsageProvider>
        <TestConsumer />
      </PlanUsageProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('plan')).toHaveTextContent('trial');
    expect(getUsageSummaryAction).toHaveBeenCalledTimes(1);
  });

  it('isAtLimit returns correct values', () => {
    render(
      <PlanUsageProvider initialSummary={mockSummary}>
        <TestConsumer />
      </PlanUsageProvider>
    );

    expect(screen.getByTestId('at-limit-branches')).toHaveTextContent('true');
    expect(screen.getByTestId('at-limit-beneficiaries')).toHaveTextContent('false');
  });

  it('shouldWarn returns true for features at limit or with warning', () => {
    render(
      <PlanUsageProvider initialSummary={mockSummary}>
        <TestConsumer />
      </PlanUsageProvider>
    );

    expect(screen.getByTestId('should-warn-beneficiaries')).toHaveTextContent('true');
  });

  it('usePlanUsage throws when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => usePlanUsage());
    }).toThrow('usePlanUsage must be used within a PlanUsageProvider');

    consoleSpy.mockRestore();
  });

  it('re-fetches on orgChanged event', async () => {
    (getUsageSummaryAction as jest.Mock).mockResolvedValue(mockSummary);

    render(
      <PlanUsageProvider initialSummary={mockSummary}>
        <TestConsumer />
      </PlanUsageProvider>
    );

    expect(getUsageSummaryAction).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new CustomEvent('orgChanged'));
    });

    await waitFor(() => {
      expect(getUsageSummaryAction).toHaveBeenCalledTimes(1);
    });
  });

  it('getFeature returns correct feature or undefined', () => {
    render(
      <PlanUsageProvider initialSummary={mockSummary}>
        <TestConsumer />
      </PlanUsageProvider>
    );

    expect(screen.getByTestId('feature-beneficiaries')).toHaveTextContent('beneficiaries');
    expect(screen.getByTestId('feature-unknown')).toHaveTextContent('undefined');
  });

  it('isAtLimit returns false when no summary', () => {
    (getUsageSummaryAction as jest.Mock).mockResolvedValue(null);

    render(
      <PlanUsageProvider initialSummary={null}>
        <TestConsumer />
      </PlanUsageProvider>
    );

    // When summary is null, isAtLimit should return false
    expect(screen.getByTestId('at-limit-branches')).toHaveTextContent('false');
  });

  it('shouldWarn returns false when no summary', () => {
    (getUsageSummaryAction as jest.Mock).mockResolvedValue(null);

    render(
      <PlanUsageProvider initialSummary={null}>
        <TestConsumer />
      </PlanUsageProvider>
    );

    expect(screen.getByTestId('should-warn-beneficiaries')).toHaveTextContent('false');
  });

  it('ignores stale fetch responses', async () => {
    let resolveFirst: (value: OrganizationUsageSummary | null) => void;
    let resolveSecond: (value: OrganizationUsageSummary | null) => void;

    const firstPromise = new Promise<OrganizationUsageSummary | null>((resolve) => { resolveFirst = resolve; });
    const secondPromise = new Promise<OrganizationUsageSummary | null>((resolve) => { resolveSecond = resolve; });

    (getUsageSummaryAction as jest.Mock)
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    render(
      <PlanUsageProvider>
        <TestConsumer />
      </PlanUsageProvider>
    );

    // Trigger a second fetch via orgChanged
    act(() => {
      window.dispatchEvent(new CustomEvent('orgChanged'));
    });

    // Resolve second fetch first
    await act(async () => {
      resolveSecond!(mockSummary);
    });

    // Resolve first fetch (stale) - should be ignored because fetchRef.current has moved on
    await act(async () => {
      resolveFirst!(null);
    });

    // Should have the second fetch's data, not the stale first
    await waitFor(() => {
      expect(screen.getByTestId('summary')).toHaveTextContent('loaded');
    });
  });

  it('shouldWarn returns false for feature with should_warn=false and is_at_limit=false', () => {
    const summaryNoWarn: OrganizationUsageSummary = {
      plan: 'trial',
      features: [
        {
          feature: 'beneficiaries',
          limit_value: 100,
          current_usage: 10,
          usage_percentage: 10,
          is_at_limit: false,
          should_warn: false,
          warning_threshold: 0.8,
        },
      ],
    };

    render(
      <PlanUsageProvider initialSummary={summaryNoWarn}>
        <TestConsumer />
      </PlanUsageProvider>
    );

    expect(screen.getByTestId('should-warn-beneficiaries')).toHaveTextContent('false');
  });

  it('getFeature returns undefined for non-existent feature when summary exists', () => {
    render(
      <PlanUsageProvider initialSummary={mockSummary}>
        <TestConsumer />
      </PlanUsageProvider>
    );

    expect(screen.getByTestId('feature-unknown')).toHaveTextContent('undefined');
  });

  it('shouldWarn and isAtLimit return false for unknown feature when summary exists', () => {
    render(
      <PlanUsageProvider initialSummary={mockSummary}>
        <TestConsumer />
      </PlanUsageProvider>
    );

    expect(screen.getByTestId('should-warn-unknown')).toHaveTextContent('false');
    expect(screen.getByTestId('at-limit-unknown')).toHaveTextContent('false');
  });

  it('handles fetch errors gracefully by keeping previous data', async () => {
    (getUsageSummaryAction as jest.Mock).mockRejectedValue(new Error('fail'));

    render(
      <PlanUsageProvider initialSummary={mockSummary}>
        <TestConsumer />
      </PlanUsageProvider>
    );

    act(() => {
      window.dispatchEvent(new CustomEvent('orgChanged'));
    });

    await waitFor(() => {
      expect(getUsageSummaryAction).toHaveBeenCalled();
    });

    // Should still have the previous data
    expect(screen.getByTestId('summary')).toHaveTextContent('loaded');
    expect(screen.getByTestId('plan')).toHaveTextContent('trial');
  });
});
