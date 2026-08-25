import React from 'react';
import { render, screen } from '@testing-library/react';

import { BeneficiaryStats } from '@/components/dashboard/beneficiary/beneficiary-stats';

const base = {
  total: 4,
  active: 4,
  withPoints: 2,
  averagePoints: 3625,
  newThisMonth: 2,
  newLastMonth: 1,
  limit: 5000 as number | null,
};

describe('BeneficiaryStats', () => {
  it('renders the five cards from the design', () => {
    const { container } = render(<BeneficiaryStats data={base} />);
    expect(container.querySelectorAll('.rounded-xl.border')).toHaveLength(5);
    expect(screen.getByText('3.625')).toBeInTheDocument();
  });

  it('shows a positive growth in green', () => {
    render(<BeneficiaryStats data={base} />);
    expect(screen.getByText('growth')).toHaveClass('text-brand-green');
  });

  it('shows a negative growth in the destructive colour', () => {
    render(<BeneficiaryStats data={{ ...base, newThisMonth: 1, newLastMonth: 4 }} />);
    expect(screen.getByText('growth')).toHaveClass('text-destructive');
  });

  it('reports 100% growth when there was nothing last month', () => {
    render(<BeneficiaryStats data={{ ...base, newLastMonth: 0 }} />);
    expect(screen.getByText('growth')).toHaveClass('text-brand-green');
  });

  it('reports flat growth when both months are empty', () => {
    render(<BeneficiaryStats data={{ ...base, newThisMonth: 0, newLastMonth: 0 }} />);
    expect(screen.getByText('growth')).toHaveClass('text-brand-green');
  });

  it('handles an org with no beneficiaries and no plan limit', () => {
    render(
      <BeneficiaryStats
        data={{ ...base, total: 0, active: 0, withPoints: 0, limit: null }}
      />,
    );
    expect(screen.getByText('totalNoLimit')).toBeInTheDocument();
  });
});
