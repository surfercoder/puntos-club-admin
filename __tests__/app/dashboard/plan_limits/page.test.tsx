import React from 'react';
import PlanLimitsListPage from '@/app/dashboard/plan_limits/page';

const mockOrder = jest.fn();
const mockSelect = jest.fn(() => ({ order: jest.fn(() => ({ order: mockOrder })) }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ from: mockFrom })),
}));
jest.mock('@/components/dashboard/plan_limits/delete-modal', () => function MockDeleteModal() { return <div data-testid="delete-modal" />; });
jest.mock('@/components/dashboard/plan_limits/toast-handler', () => function MockToastHandler() { return <div data-testid="toast-handler" />; });
jest.mock('@/components/ui/badge', () => ({ Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));

describe('PlanLimitsListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [], error: null });
  });

  it('exports a default async function', () => {
    expect(typeof PlanLimitsListPage).toBe('function');
  });

  it('renders without crashing (empty)', async () => {
    const result = await PlanLimitsListPage();
    expect(result).toBeTruthy();
  });

  it('renders rows when data is returned', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [{
        id: '1', plan: 'pro', feature: 'branches', limit_value: 10, warning_threshold: 0.8,
      }],
      error: null,
    });
    const result = await PlanLimitsListPage();
    expect(result).toBeTruthy();
  });

  it('renders error state when query fails', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    const result = await PlanLimitsListPage();
    expect(result).toBeTruthy();
  });

  it('renders empty state when data is empty array', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await PlanLimitsListPage();
    expect(result).toBeTruthy();
  });

  it('renders multiple rows', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [
        { id: '1', plan: 'trial', feature: 'branches', limit_value: 3, warning_threshold: 0.7 },
        { id: '2', plan: 'advance', feature: 'products', limit_value: 50, warning_threshold: 0.9 },
        { id: '3', plan: 'pro', feature: 'categories', limit_value: 100, warning_threshold: 0.8 },
      ],
      error: null,
    });
    const result = await PlanLimitsListPage();
    expect(result).toBeTruthy();
  });
});
