'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
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

export function PlanUsageProvider({ children, initialSummary }: PlanUsageProviderProps) {
  const [summary, setSummary] = useState<OrganizationUsageSummary | null>(initialSummary ?? null);
  const [isLoading, setIsLoading] = useState(!initialSummary);
  const fetchRef = useRef(0);

  const fetchUsage = useCallback(() => {
    const id = ++fetchRef.current;
    setIsLoading(true);
    getUsageSummaryAction()
      .then((data) => {
        if (id === fetchRef.current) {
          setSummary(data);
        }
      })
      .catch(() => {
        // keep previous data on error
      })
      .finally(() => {
        if (id === fetchRef.current) {
          setIsLoading(false);
        }
      });
  }, []);

  // Only fetch on mount if we don't have initial data
  useEffect(() => {
    if (!initialSummary) {
      fetchUsage();
    }
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

  return (
    <PlanUsageContext.Provider
      value={{
        summary,
        isLoading,
        invalidate: fetchUsage,
        isAtLimit,
        shouldWarn,
        getFeature,
        plan: summary?.plan ?? null,
      }}
    >
      {children}
    </PlanUsageContext.Provider>
  );
}

export function usePlanUsage() {
  const ctx = useContext(PlanUsageContext);
  if (!ctx) {
    throw new Error('usePlanUsage must be used within a PlanUsageProvider');
  }
  return ctx;
}
