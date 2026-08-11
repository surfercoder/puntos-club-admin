import { render, screen } from '@testing-library/react';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

describe('Breadcrumb', () => {
  it('renders a labelled nav with links and a current page', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Compras</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'breadcrumb');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Compras')).toHaveAttribute('aria-current', 'page');
  });

  it('falls back to a chevron separator and renders a custom one when given', () => {
    const { container } = render(
      <>
        <BreadcrumbSeparator data-testid="default-sep" />
        <BreadcrumbSeparator data-testid="custom-sep">/</BreadcrumbSeparator>
      </>,
    );

    expect(screen.getByTestId('default-sep').querySelector('svg')).toBeInTheDocument();
    expect(screen.getByTestId('custom-sep')).toHaveTextContent('/');
    expect(container.querySelectorAll('[role="presentation"]')).toHaveLength(2);
  });

  it('renders the ellipsis with screen-reader-only text', () => {
    const { container } = render(<BreadcrumbEllipsis className="custom" />);
    const ellipsis = container.querySelector('[data-slot="breadcrumb-ellipsis"]');
    expect(ellipsis).toHaveClass('custom');
    expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('more')).toHaveClass('sr-only');
  });

  it('renders the link as the child element when asChild is set', () => {
    render(
      <BreadcrumbLink asChild>
        <button type="button">Volver</button>
      </BreadcrumbLink>,
    );
    const button = screen.getByRole('button', { name: 'Volver' });
    expect(button).toHaveAttribute('data-slot', 'breadcrumb-link');
  });

  it('merges custom classNames into the list and item', () => {
    const { container } = render(
      <BreadcrumbList className="custom-list">
        <BreadcrumbItem className="custom-item">x</BreadcrumbItem>
      </BreadcrumbList>,
    );
    expect(container.querySelector('[data-slot="breadcrumb-list"]')).toHaveClass('custom-list');
    expect(container.querySelector('[data-slot="breadcrumb-item"]')).toHaveClass('custom-item');
  });
});
