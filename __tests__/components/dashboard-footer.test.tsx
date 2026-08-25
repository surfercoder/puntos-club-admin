import React from 'react';
import { render, screen } from '@testing-library/react';

import { DashboardFooter, PuntosClubWordmark } from '@/components/dashboard-footer';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('PuntosClubWordmark', () => {
  it('splits the brand name so "Club" is highlighted', () => {
    render(<PuntosClubWordmark className="text-lg" />);
    expect(screen.getByText('Club')).toHaveClass('text-brand-pink');
  });

  it('renders without an extra class', () => {
    render(<PuntosClubWordmark />);
    expect(screen.getByText('Club')).toBeInTheDocument();
  });
});

describe('DashboardFooter', () => {
  it('links to the legal documents', () => {
    render(<DashboardFooter />);
    const hrefs = screen.getAllByRole('link').map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/legal/Aviso_Legal.pdf');
    expect(hrefs).toContain('/legal/Politica_de_Privacidad_y_Politica_de_Cookies.pdf');
  });
});
