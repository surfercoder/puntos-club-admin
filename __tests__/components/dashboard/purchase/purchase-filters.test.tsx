import React from 'react';
import { render, screen } from '@testing-library/react';

import { PurchaseFilters } from '@/components/dashboard/purchase/purchase-filters';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const options = [{ id: '1', name: 'Sucursal Centro' }];

describe('PurchaseFilters', () => {
  it('keeps the current selection in every control', async () => {
    const { container } = render(
      await PurchaseFilters({
        values: {
          q: 'PUR', from: '2026-07-01', to: '2026-08-13', branch: '1',
          cashier: '1', beneficiary: '1', type: 'sale', points: '1000-5000',
        },
        branches: options,
        cashiers: options,
        beneficiaries: options,
      }),
    );
    expect(container.querySelector('input[name="q"]')).toHaveValue('PUR');
    expect(container.querySelector('input[name="from"]')).toHaveValue('2026-07-01');
    expect(container.querySelector('input[name="to"]')).toHaveValue('2026-08-13');
    expect(container.querySelector('select[name="branch"]')).toHaveValue('1');
    expect(container.querySelector('select[name="cashier"]')).toHaveValue('1');
    expect(container.querySelector('select[name="beneficiary"]')).toHaveValue('1');
    expect(container.querySelector('select[name="type"]')).toHaveValue('sale');
    expect(container.querySelector('select[name="points"]')).toHaveValue('1000-5000');
  });

  it('clears back to the bare route', async () => {
    render(
      await PurchaseFilters({
        values: { q: '', from: '', to: '', branch: '', cashier: '', beneficiary: '', type: '', points: '' },
        branches: [],
        cashiers: [],
        beneficiaries: [],
      }),
    );
    expect(screen.getByRole('link', { name: 'clear' })).toHaveAttribute('href', '/dashboard/purchase');
  });
});
