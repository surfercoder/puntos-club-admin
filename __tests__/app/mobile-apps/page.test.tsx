import { render } from '@testing-library/react';
import MobileAppsPage, { generateMetadata } from '@/app/mobile-apps/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/mobile-apps/app-download-qr-cards', () => ({ AppDownloadQRCards: () => <div data-testid="app-qr-cards" /> }));

describe('MobileAppsPage', () => {
  it('renders the header and the app QR cards', async () => {
    const { container, getByTestId } = render(await MobileAppsPage());
    expect(container.textContent).toContain('title');
    expect(container.textContent).toContain('subtitle');
    expect(getByTestId('app-qr-cards')).toBeInTheDocument();
  });

  it('generateMetadata returns title and description', async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
  });
});
