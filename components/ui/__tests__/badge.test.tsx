import { render, screen } from '@testing-library/react';
import React from 'react';

import { Badge, badgeVariants } from '../badge';

describe('Badge', () => {
  it('should render with default variant', () => {
    render(<Badge>Default Badge</Badge>);
    
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100');
  });

  it('should render with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    
    const badge = screen.getByText('Secondary Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-200');
  });

  it('should render with destructive variant', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>);
    
    const badge = screen.getByText('Destructive Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100');
  });

  it('should render with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>);
    
    const badge = screen.getByText('Outline Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('border-gray-300');
  });

  it('should apply custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);
    
    const badge = screen.getByText('Custom Badge');
    expect(badge).toHaveClass('custom-class');
  });

  it('should pass through additional props', () => {
    render(<Badge data-testid="badge-test" id="test-badge">Test Badge</Badge>);
    
    const badge = screen.getByTestId('badge-test');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('id', 'test-badge');
  });

  it('should generate correct variant classes', () => {
    expect(badgeVariants({ variant: 'default' })).toContain('bg-gray-100');
    expect(badgeVariants({ variant: 'secondary' })).toContain('bg-gray-200');
    expect(badgeVariants({ variant: 'destructive' })).toContain('bg-red-100');
    expect(badgeVariants({ variant: 'outline' })).toContain('border-gray-300');
  });
});