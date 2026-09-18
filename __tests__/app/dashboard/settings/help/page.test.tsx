import { render, screen } from '@testing-library/react';

import HelpPage from '@/app/dashboard/settings/help/page';

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => Promise.resolve((key: string) => key)),
}));

describe('HelpPage', () => {
  it('lists every manual with a download link to the static file', async () => {
    render(await HelpPage());

    const link = screen.getByRole('link', { name: /download/i });
    expect(link).toHaveAttribute('href', '/manuals/Manual_PuntosClub_Owner_v1.docx');
    expect(link).toHaveAttribute('download');
    expect(screen.getByText('manuals.owner.title')).toBeInTheDocument();
  });
});
