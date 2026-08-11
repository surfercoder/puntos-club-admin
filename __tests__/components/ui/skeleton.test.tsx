import { render, screen } from '@testing-library/react';

import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton', () => {
  it('renders a pulsing placeholder and merges a custom className', () => {
    render(<Skeleton className="h-4 w-32" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveAttribute('data-slot', 'skeleton');
    expect(skeleton).toHaveClass('animate-pulse', 'h-4', 'w-32');
  });
});
