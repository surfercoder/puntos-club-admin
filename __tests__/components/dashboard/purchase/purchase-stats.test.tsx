import React from 'react';
import { render, screen } from '@testing-library/react';

import { PurchaseStats } from '@/components/dashboard/purchase/purchase-stats';

describe('PurchaseStats', () => {
  it('renders the five period cards from the design', () => {
    const { container } = render(
      <PurchaseStats
        data={{
          operations: 5,
          totalAmount: 23500,
          pointsAssigned: 23500,
          beneficiariesReached: 3,
          averagePoints: 4700,
        }}
      />,
    );
    expect(container.querySelectorAll('.rounded-xl.border')).toHaveLength(5);
    expect(screen.getByText('23.500 pts')).toBeInTheDocument();
    expect(screen.getByText('4.700 pts')).toBeInTheDocument();
    expect(screen.getAllByText('inPeriod')).toHaveLength(5);
  });
});
