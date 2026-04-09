import type * as ReactNS from 'react';
import ProductListPage from '@/app/dashboard/product/page';

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => Promise.resolve((key: string) => key)),
}));

jest.mock('@/actions/dashboard/product/actions', () => ({
  getProducts: jest.fn(() => Promise.resolve({
    data: [{ id: '1', name: 'Test Product', description: 'Desc', required_points: 100, active: true, image_urls: [] }],
    error: null,
  })),
}));

jest.mock('@/components/dashboard/product/delete-modal', () => {
  return function MockDeleteModal() { return <div data-testid="delete-modal" />; };
});

jest.mock('@/components/dashboard/plan/plan-limit-create-button', () => ({
  PlanLimitCreateButton: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/dashboard/plan/plan-usage-banner', () => ({
  PlanUsageBanner: () => <div data-testid="plan-usage-banner" />,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));

jest.mock('next/image', () => {
  const React = jest.requireActual('react') as typeof ReactNS;
  return function MockImage(props: Record<string, unknown>) {
    return React.createElement('img', { alt: '', ...props });
  };
});

describe('ProductListPage', () => {
  it('exports a default async function', () => {
    expect(typeof ProductListPage).toBe('function');
  });

  it('renders without crashing', async () => {
    const result = await ProductListPage();
    expect(result).toBeTruthy();
  });

  it('renders product with image_urls', async () => {
    const { getProducts } = require('@/actions/dashboard/product/actions');
    getProducts.mockResolvedValueOnce({
      data: [{ id: '1', name: 'P1', description: null, required_points: 50, active: true, image_urls: ['https://example.com/img.jpg'] }],
      error: null,
    });
    const result = await ProductListPage();
    expect(result).toBeTruthy();
  });

  it('renders error message when query fails', async () => {
    const { getProducts } = require('@/actions/dashboard/product/actions');
    getProducts.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    const result = await ProductListPage();
    expect(result).toBeTruthy();
  });

  it('renders empty state when no products', async () => {
    const { getProducts } = require('@/actions/dashboard/product/actions');
    getProducts.mockResolvedValueOnce({ data: [], error: null });
    const result = await ProductListPage();
    expect(result).toBeTruthy();
  });

  it('renders inactive product with no image_urls', async () => {
    const { getProducts } = require('@/actions/dashboard/product/actions');
    getProducts.mockResolvedValueOnce({
      data: [{ id: '2', name: 'P2', description: 'Desc', required_points: 200, active: false, image_urls: null }],
      error: null,
    });
    const result = await ProductListPage();
    expect(result).toBeTruthy();
  });
});
