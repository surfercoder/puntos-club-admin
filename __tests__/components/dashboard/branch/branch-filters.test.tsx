import React from 'react';
import { render, screen } from '@testing-library/react';

import { BranchFilters } from '@/components/dashboard/branch/branch-filters';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

describe('BranchFilters', () => {
  it('keeps the current selection', async () => {
    const { container } = render(
      await BranchFilters({ values: { q: 'centro', status: 'active', cashier: 'unassigned' } }),
    );
    expect(container.querySelector('input[name="q"]')).toHaveValue('centro');
    expect(container.querySelector('select[name="status"]')).toHaveValue('active');
    expect(container.querySelector('select[name="cashier"]')).toHaveValue('unassigned');
  });

  it('offers a refresh link back to the bare route', async () => {
    render(await BranchFilters({ values: { q: '', status: '', cashier: '' } }));
    expect(screen.getByLabelText('refresh')).toHaveAttribute('href', '/dashboard/branch');
  });
});
