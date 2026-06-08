'use client';

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import { getUsageSummaryAction } from '@/actions/dashboard/usage/actions';
import type {
  FeatureUsage,
  OrganizationUsageSummary,
  PlanFeatureKey,
  PlanType,
} from '@/types/plan';

interface PlanUsageContextValue {
  summary: OrganizationUsageSummary | null;
  isLoading: boolean;
  invalidate: () => void;
  isAtLimit: (feature: PlanFeatureKey) => boolean;
  shouldWarn: (feature: PlanFeatureKey) => boolean;
  getFeature: (feature: PlanFeatureKey) => FeatureUsage | undefined;
  plan: PlanType | null;
}

const PlanUsageContext = createContext<PlanUsageContextValue | null>(null);

interface PlanUsageProviderProps {
  children: React.ReactNode;
  /** Server-fetched initial data — avoids client-side fetch on first render */
  initialSummary?: OrganizationUsageSummary | null;
}

type UsageState = {
  summary: OrganizationUsageSummary | null;
  isLoading: boolean;
};

type UsageAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: OrganizationUsageSummary | null }
  | { type: 'FETCH_END' };

function usageReducer(state: UsageState, action: UsageAction): UsageState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true };
    case 'FETCH_SUCCESS':
      return { ...state, summary: action.payload };
    case 'FETCH_END':
      return { ...state, isLoading: false };
    /* c8 ignore next 2 */
    default:
      return state;
  }
}

export function PlanUsageProvider({ children, initialSummary }: PlanUsageProviderProps) {
  const [state, dispatch] = useReducer(usageReducer, {
    summary: initialSummary ?? null,
    isLoading: !initialSummary,
  });
  const { summary, isLoading } = state;
  const fetchRef = useRef(0);

  const fetchUsage = useCallback(() => {
    const id = ++fetchRef.current;
    dispatch({ type: 'FETCH_START' });
    getUsageSummaryAction()
      .then((data) => {
        if (id === fetchRef.current) {
          dispatch({ type: 'FETCH_SUCCESS', payload: data });
        }
      })
      .catch(() => {
        // keep previous data on error
      })
      .finally(() => {
        if (id === fetchRef.current) {
          dispatch({ type: 'FETCH_END' });
        }
      });
  }, []);

  // Only fetch on mount if we don't have initial data
  useEffect(() => {
    if (initialSummary) return;
    fetchUsage();
  }, [fetchUsage, initialSummary]);

  // Re-fetch when organization changes
  useEffect(() => {
    const handler = () => fetchUsage();
    window.addEventListener('orgChanged', handler);
    return () => window.removeEventListener('orgChanged', handler);
  }, [fetchUsage]);

  const isAtLimit = useCallback(
    (feature: PlanFeatureKey) => {
      if (!summary) return false;
      return summary.features.find((f) => f.feature === feature)?.is_at_limit ?? false;
    },
    [summary]
  );

  const shouldWarn = useCallback(
    (feature: PlanFeatureKey) => {
      if (!summary) return false;
      const f = summary.features.find((feat) => feat.feature === feature);
      return f ? f.should_warn || f.is_at_limit : false;
    },
    [summary]
  );

  const getFeature = useCallback(
    (feature: PlanFeatureKey) => {
      return summary?.features.find((f) => f.feature === feature);
    },
    [summary]
  );

  const contextValue = useMemo<PlanUsageContextValue>(
    () => ({
      summary,
      isLoading,
      invalidate: fetchUsage,
      isAtLimit,
      shouldWarn,
      getFeature,
      plan: summary?.plan ?? null,
    }),
    [summary, isLoading, fetchUsage, isAtLimit, shouldWarn, getFeature]
  );

  return (
    <PlanUsageContext.Provider value={contextValue}>
      {children}
    </PlanUsageContext.Provider>
  );
}

export function usePlanUsage() {
  const ctx = use(PlanUsageContext);
  if (!ctx) {
    throw new Error('usePlanUsage must be used within a PlanUsageProvider');
  }
  return ctx;
}
