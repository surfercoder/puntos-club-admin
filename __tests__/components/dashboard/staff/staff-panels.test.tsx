import React from 'react';
import { render, screen } from '@testing-library/react';

import { StaffFilters } from '@/components/dashboard/staff/staff-filters';
import { StaffStats } from '@/components/dashboard/staff/staff-stats';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('StaffStats', () => {
  it('renders four cards for cashiers with the plan limit', () => {
    const { container } = render(
      <StaffStats data={{ total: 12, active: 9, inactive: 3, extra: 8, limit: 20 }} variant="cashiers" />,
    );
    expect(container.querySelectorAll('.rounded-xl.border')).toHaveLength(4);
    expect(screen.getByText('ofLimit')).toBeInTheDocument();
  });

  it('says there is no limit when the plan has none', () => {
    render(
      <StaffStats
        data={{ total: 1, active: 1, inactive: 0, extra: 0, limit: null }}
        variant="collaborators"
      />,
    );
    expect(screen.getByText('noLimit')).toBeInTheDocument();
  });
});

describe('StaffFilters', () => {
  const branches = [{ id: '3', name: 'Sucursal Centro' }];

  it('shows the branch filter for cashiers', async () => {
    const { container } = render(
      await StaffFilters({
        values: { q: 'ana', status: 'active', branch: '3' },
        branches,
        basePath: '/dashboard/cashiers',
        showBranch: true,
      }),
    );
    expect(container.querySelector('input[name="q"]')).toHaveValue('ana');
    expect(container.querySelector('select[name="status"]')).toHaveValue('active');
    expect(container.querySelector('select[name="branch"]')).toHaveValue('3');
  });

  it('hides the branch filter for collaborators', async () => {
    const { container } = render(
      await StaffFilters({
        values: { q: '', status: '', branch: '' },
        branches,
        basePath: '/dashboard/collaborators',
        showBranch: false,
      }),
    );
    expect(container.querySelector('select[name="branch"]')).toBeNull();
    expect(screen.getByRole('link', { name: 'clear' })).toHaveAttribute(
      'href',
      '/dashboard/collaborators',
    );
  });
});
