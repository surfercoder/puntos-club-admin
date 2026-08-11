import { render, screen } from '@testing-library/react';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

describe('Card', () => {
  it('renders the full composition with each part tagged by data-slot', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Plan Pro</CardTitle>
          <CardDescription>Todo incluido</CardDescription>
          <CardAction>
            <button type="button">Editar</button>
          </CardAction>
        </CardHeader>
        <CardContent>Contenido</CardContent>
        <CardFooter>Pie</CardFooter>
      </Card>,
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('data-slot', 'card');
    for (const slot of [
      'card-header',
      'card-title',
      'card-description',
      'card-action',
      'card-content',
      'card-footer',
    ]) {
      expect(card.querySelector(`[data-slot="${slot}"]`)).toBeInTheDocument();
    }
    expect(screen.getByText('Plan Pro')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('merges a custom className into every part instead of replacing the base styles', () => {
    const { container } = render(
      <Card className="custom-card">
        <CardHeader className="custom-header">
          <CardTitle className="custom-title">t</CardTitle>
          <CardDescription className="custom-description">d</CardDescription>
          <CardAction className="custom-action">a</CardAction>
        </CardHeader>
        <CardContent className="custom-content">c</CardContent>
        <CardFooter className="custom-footer">f</CardFooter>
      </Card>,
    );

    expect(container.querySelector('[data-slot="card"]')).toHaveClass('custom-card', 'rounded-xl');
    expect(container.querySelector('[data-slot="card-header"]')).toHaveClass('custom-header');
    expect(container.querySelector('[data-slot="card-title"]')).toHaveClass('custom-title', 'font-semibold');
    expect(container.querySelector('[data-slot="card-description"]')).toHaveClass('custom-description');
    expect(container.querySelector('[data-slot="card-action"]')).toHaveClass('custom-action');
    expect(container.querySelector('[data-slot="card-content"]')).toHaveClass('custom-content', 'px-6');
    expect(container.querySelector('[data-slot="card-footer"]')).toHaveClass('custom-footer');
  });
});
