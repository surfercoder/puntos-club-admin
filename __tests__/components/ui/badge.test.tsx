import { render, screen } from '@testing-library/react';

import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('renders a span with the default variant', () => {
    render(<Badge>Activo</Badge>);
    const badge = screen.getByText('Activo');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveAttribute('data-slot', 'badge');
    expect(badge).toHaveAttribute('data-variant', 'default');
  });

  it.each(['secondary', 'destructive', 'outline', 'ghost', 'link'] as const)(
    'applies the %s variant',
    (variant) => {
      render(<Badge variant={variant}>Estado</Badge>);
      expect(screen.getByText('Estado')).toHaveAttribute('data-variant', variant);
    },
  );

  it('renders as the child element when asChild is set', () => {
    render(
      <Badge asChild>
        <a href="/plan">Ver plan</a>
      </Badge>,
    );
    const link = screen.getByRole('link', { name: 'Ver plan' });
    expect(link).toHaveAttribute('data-slot', 'badge');
    expect(link).toHaveAttribute('href', '/plan');
  });

  it('merges a custom className with the variant styles', () => {
    render(<Badge className="custom">Activo</Badge>);
    expect(screen.getByText('Activo')).toHaveClass('custom', 'rounded-full');
  });
});
